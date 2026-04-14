/**
 * db.js — Lumi Supabase Sync Module
 * -----------------------------------
 * Handles all database writes. Designed to be:
 *   - Fire-and-forget (never blocks the reading experience)
 *   - Offline-safe (queues writes if network fails, retries on next call)
 *   - Totally invisible to the child (silent background sync)
 *
 * Setup: See docs/SUPABASE_SETUP.md for the one-time Supabase config steps.
 *
 * Usage in app.js:
 *   import { initDB, startSession, recordSentenceResult, endSession } from './db.js';
 *   await initDB();
 *   const session = await startSession({ week: 1, subject: 'afrikaans' });
 *   await recordSentenceResult({ sessionId: session.id, ... });
 *   await endSession(session.id);
 */

import { getUser } from './user.js';

// ── Config ────────────────────────────────────────────────────────────────────
// Replace these two values with your Supabase project details.
// Find them at: supabase.com → your project → Settings → API
export const SUPABASE_URL = 'https://taiwqvydfhlkyjguunrb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXdxdnlkZmhsa3lqZ3V1bnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTIwNDksImV4cCI6MjA4ODk2ODA0OX0.pnB1kt2kS81Y8jrxyc3Ot2psO1YqEEZr1M8F7aRaSMw';

const HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer':        'return=representation',
};

// ── Offline queue ─────────────────────────────────────────────────────────────
// If a write fails (offline, etc.), it goes here and retries next time db.js
// makes a successful network call.
const QUEUE_KEY = 'lumi_sync_queue';

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueue(item) {
  const q = loadQueue();
  q.push({ ...item, queued_at: new Date().toISOString() });
  saveQueue(q);
}

async function flushQueue() {
  const q = loadQueue();
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    const ok = await _write(item.table, item.data, false); // false = don't re-queue
    if (!ok) remaining.push(item);
  }
  saveQueue(remaining);
}

// ── Core write helper ─────────────────────────────────────────────────────────
async function _write(table, data, requeue = true, opts = {}) {
  try {
    const url = opts.upsert
      ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${opts.onConflict || 'id'}`
      : `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = opts.upsert
      ? { ...HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates' }
      : HEADERS;

    const res = await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Lumi DB] Write to ${table} failed:`, err);
      if (requeue) enqueue({ table, data });
      return false;
    }
    const rows = await res.json();
    return rows?.[0] || true;
  } catch (e) {
    console.warn('[Lumi DB] Network error, queuing write:', e.message);
    if (requeue) enqueue({ table, data });
    return false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
let _initialised = false;

/**
 * Call once on app load, after initUser().
 * Upserts the user row in Supabase (creates if new, updates last_seen if returning).
 * Also flushes any queued offline writes from previous sessions.
 */
export async function initDB() {
  if (_initialised) return;
  _initialised = true;

  const user = getUser();
  if (!user) {
    console.warn('[Lumi DB] initDB called before initUser()');
    return;
  }

  // Upsert user row — creates on first visit, updates last_seen on return
  await _write('users', {
    id:           user.id,
    display_name: user.displayName,
    created_at:   user.createdAt,
    last_seen:    new Date().toISOString(),
    is_claimed:   false,
  }, true, { upsert: true, onConflict: 'id' });

  // Try to flush anything that failed to sync last time
  await flushQueue();

  console.log('[Lumi DB] Initialised.');
}

// ── Sessions ──────────────────────────────────────────────────────────────────

/**
 * Call when a child starts interacting with a week's content.
 * Returns a session object with an id you'll pass to recordSentenceResult().
 *
 * @param {{ week: number, subject?: string }} opts
 * @returns {{ id: string, startedAt: string } | null}
 */
export async function startSession({ week, subject = 'afrikaans' }) {
  const user = getUser();
  if (!user) return null;

  const session = {
    id:         generateSessionId(),
    user_id:    user.id,
    week,
    subject,
    started_at: new Date().toISOString(),
    ended_at:   null,
  };

  await _write('sessions', session);
  return session;
}

/**
 * Call when the child navigates away, closes the tab, or finishes all sentences.
 * Updates the session's ended_at timestamp.
 *
 * @param {string} sessionId
 */
export async function endSession(sessionId) {
  if (!sessionId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${sessionId}`, {
      method:  'PATCH',
      headers: HEADERS,
      body:    JSON.stringify({ ended_at: new Date().toISOString() }),
      keepalive: true,
    });
  } catch (e) {
    // Non-critical — session end is best-effort
    console.warn('[Lumi DB] Could not end session:', e.message);
  }
}

// ── Sentence results ──────────────────────────────────────────────────────────

/**
 * Call when a sentence is completed in any mode.
 * Fire-and-forget — will queue and retry if offline.
 *
 * @param {{
 *   sessionId:     string,
 *   week:          number,
 *   sentenceIndex: number,
 *   mode:          'listen' | 'tap' | 'play',
 *   correctWords:  number,
 *   totalWords:    number,
 *   completed:     boolean,
 *   durationSecs:  number,
 * }} result
 */
export async function recordSentenceResult({
  sessionId,
  week,
  sentenceIndex,
  mode,
  correctWords,
  totalWords,
  completed,
  durationSecs = 0,
}) {
  const user = getUser();
  if (!user) return;

  await _write('sentence_results', {
    user_id:        user.id,
    session_id:     sessionId,
    week,
    sentence_index: sentenceIndex,
    mode,
    correct_words:  correctWords,
    total_words:    totalWords,
    completed,
    duration_secs:  Math.round(durationSecs),
    recorded_at:    new Date().toISOString(),
  });
}

/**
 * Fetches completed sentence indices for a week (for main app continuation sync).
 * @param {number} weekNumber — 1–8
 * @returns {Promise<Set<number>>}
 */
export async function fetchCompletionForWeek(weekNumber) {
  const user = getUser();
  if (!user) return new Set();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sentence_results?user_id=eq.${user.id}&week=eq.${weekNumber}&select=sentence_index`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(res.statusText);
    const rows = await res.json();
    return new Set((rows || []).map((r) => r.sentence_index));
  } catch (e) {
    console.warn('[Lumi DB] Could not fetch completion:', e.message);
    return new Set();
  }
}

/**
 * Fetches sentence results for the current user (for stats dashboard).
 * @returns {Promise<Array<{week:number,sentence_index:number,correct_words:number,total_words:number,duration_secs:number,recorded_at:string}>>}
 */
export async function fetchUserStats() {
  const user = getUser();
  if (!user) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sentence_results?user_id=eq.${user.id}&select=week,sentence_index,correct_words,total_words,duration_secs,recorded_at,completed`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.warn('[Lumi DB] Could not fetch stats:', e.message);
    return [];
  }
}

export const COMPLETED_KEY = 'lekkeleer_completed';

/**
 * Resets all progress: deletes sentence_results and sessions in Supabase,
 * and clears local completion cache. TTS audio cache (IndexedDB) is left intact.
 * @returns {Promise<boolean>} true if reset succeeded
 */
export async function resetProgress() {
  const completedKey = COMPLETED_KEY;
  const user = getUser();
  if (!user) return false;
  const deleteHeaders = {
    apikey:        SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
  try {
    const resResults = await fetch(
      `${SUPABASE_URL}/rest/v1/sentence_results?user_id=eq.${user.id}`,
      { method: 'DELETE', headers: deleteHeaders }
    );
    if (!resResults.ok) throw new Error(resResults.statusText);

    const resSessions = await fetch(
      `${SUPABASE_URL}/rest/v1/sessions?user_id=eq.${user.id}`,
      { method: 'DELETE', headers: deleteHeaders }
    );
    if (!resSessions.ok) throw new Error(resSessions.statusText);
  } catch (e) {
    console.warn('[Lumi DB] Reset failed:', e.message);
    return false;
  }
  for (let i = 0; i < 8; i++) {
    try {
      localStorage.removeItem(`${completedKey}_${i}`);
    } catch (_) {}
  }
  return true;
}

/**
 * Submits user feedback via Edge Function → Discord webhook.
 * No database; posts directly to Discord.
 * @param {string} message
 * @returns {Promise<{ ok: boolean, error?: string, hint?: string }>}
 */
export async function submitFeedback(message) {
  const user = getUser();
  const trimmed = String(message || '').trim();
  if (!trimmed) return { ok: false, error: 'Empty message' };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/feedback-to-discord`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message:     trimmed,
        userId:      user?.id || null,
        displayName: user?.displayName || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[Lumi DB] Feedback failed:', res.status, data);
      return {
        ok:    false,
        error: data.error || res.statusText,
        hint:  res.status === 500 ? ' Check DISCORD_FEEDBACK_WEBHOOK secret.' : '',
      };
    }
    return { ok: true };
  } catch (e) {
    console.error('[Lumi DB] Feedback network error:', e);
    return { ok: false, error: e.message, hint: ' Check your connection.' };
  }
}

/**
 * Records a display name update to the server (e.g. after name prompt).
 * @param {string} name
 */
export async function updateDisplayName(name) {
  const user = getUser();
  if (!user) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method:  'PATCH',
      headers: HEADERS,
      body:    JSON.stringify({ display_name: name }),
    });
  } catch (e) {
    console.warn('[Lumi DB] Could not update name:', e.message);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSessionId() {
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `${ts}-${rnd}`;
}
