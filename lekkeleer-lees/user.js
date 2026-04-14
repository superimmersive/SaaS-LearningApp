/**
 * user.js — Lumi User Identity Module
 * ------------------------------------
 * Manages anonymous device-pinned user profiles.
 * No login required. UUID lives in localStorage.
 * Drop this file into your project and call initUser() on app load.
 *
 * Usage in app.js:
 *   import { initUser, getUser, setDisplayName } from './user.js';
 *   const user = await initUser();
 */

const USER_KEY   = 'lumi_user_id';
const NAME_KEY   = 'lumi_display_name';
const CREATED_KEY = 'lumi_created_at';

// ── UUID generation ──────────────────────────────────────────────────────────
// Uses crypto.randomUUID() where available, falls back to manual generation
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Core user object ──────────────────────────────────────────────────────────
let _currentUser = null;

/**
 * Returns the current user object.
 * Always call initUser() first.
 */
export function getUser() {
  return _currentUser;
}

/**
 * Initialises the user session.
 * - Loads existing UUID from localStorage, or creates a new one.
 * - Returns the user object.
 * - Safe to call multiple times (idempotent).
 *
 * @returns {{ id: string, displayName: string|null, createdAt: string, isNew: boolean }}
 */
export function initUser() {
  let id        = localStorage.getItem(USER_KEY);
  let createdAt = localStorage.getItem(CREATED_KEY);
  const isNew   = !id;

  if (isNew) {
    id        = generateUUID();
    createdAt = new Date().toISOString();
    localStorage.setItem(USER_KEY,    id);
    localStorage.setItem(CREATED_KEY, createdAt);
  }

  let displayName = localStorage.getItem(NAME_KEY) || null;
  if (displayName && !displayName.trim()) {
    localStorage.removeItem(NAME_KEY);
    displayName = null;
  } else if (displayName) {
    displayName = displayName.trim();
  }

  _currentUser = {
    id,
    displayName,
    createdAt,
    isNew,
  };

  console.log(`[Lumi] User ${isNew ? 'created' : 'loaded'}: ${id.slice(0, 8)}…`);
  return _currentUser;
}

/**
 * Sets or updates the child's display name.
 * Persists to localStorage and updates the current user object.
 *
 * @param {string} name — e.g. "Mia" or "Jan"
 */
export function setDisplayName(name) {
  const trimmed = (name || '').trim().slice(0, 32); // max 32 chars
  if (!trimmed) return;
  localStorage.setItem(NAME_KEY, trimmed);
  if (_currentUser) _currentUser.displayName = trimmed;
}

/**
 * Clears the display name only. Use for testing or to reset name.
 */
export function clearDisplayName() {
  localStorage.removeItem(NAME_KEY);
  if (_currentUser) _currentUser.displayName = null;
  console.log('[Lumi] Display name cleared.');
}

/**
 * Clears all local user data. Use for testing or "start fresh".
 * Does NOT delete server-side data.
 */
export function clearLocalUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(CREATED_KEY);
  _currentUser = null;
  console.log('[Lumi] Local user cleared.');
}

/**
 * Returns true if this user was created more than N days ago.
 * Useful for prompting "claim your profile" after they've been active a while.
 *
 * @param {number} days
 */
export function userOlderThan(days) {
  if (!_currentUser?.createdAt) return false;
  const created  = new Date(_currentUser.createdAt);
  const cutoff   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return created < cutoff;
}
