import { initUser, getUser, setDisplayName, clearDisplayName } from './user.js';
import { fetchUserStats, resetProgress, updateDisplayName } from './db.js';

const WEEKS_TOTAL = 8;
const SENTENCES_PER_WEEK = 7;

function aggregateStats(results) {
  const byWeek = {};
  for (let w = 1; w <= WEEKS_TOTAL; w++) {
    byWeek[w] = new Set();
  }
  let totalDuration = 0;

  const secsPerWordList = [];

  results.forEach((r) => {
    if (r.week >= 1 && r.week <= WEEKS_TOTAL) {
      byWeek[r.week].add(r.sentence_index);
    }
    totalDuration += r.duration_secs || 0;
    const tw = r.total_words || 0;
    if (tw > 0 && (r.duration_secs || 0) >= 0) {
      secsPerWordList.push((r.duration_secs || 0) / tw);
    }
  });

  const totalSentences = Object.values(byWeek).reduce((sum, set) => sum + set.size, 0);
  const totalSecs = Math.round(totalDuration);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;

  let wordTimeAvg = 0;
  if (secsPerWordList.length > 0) {
    wordTimeAvg = secsPerWordList.reduce((a, b) => a + b, 0) / secsPerWordList.length;
  }

  return { byWeek, totalSentences, mins, secs, wordTimeAvg };
}

function formatTime(mins, secs) {
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatSecs(s) {
  return s < 1 ? `${(s * 1000).toFixed(0)}ms` : `${s.toFixed(1)}s`;
}

function renderStats({ byWeek, totalSentences, mins, secs, wordTimeAvg }) {
  document.getElementById('statsTotal').textContent = String(totalSentences);
  document.getElementById('statsTime').textContent = formatTime(mins, secs);

  const wordTimeEl = document.getElementById('statsWordTime');
  if (wordTimeEl) {
    if (wordTimeAvg > 0) {
      wordTimeEl.textContent = formatSecs(wordTimeAvg);
      wordTimeEl.closest('.stats-word-time')?.classList.remove('hidden');
    } else {
      wordTimeEl.closest('.stats-word-time')?.classList.add('hidden');
    }
  }

  const weeksEl = document.getElementById('statsWeeks');
  weeksEl.replaceChildren();

  for (let w = 1; w <= WEEKS_TOTAL; w++) {
    const count = byWeek[w].size;
    let starsHtml = '';
    for (let i = 0; i < SENTENCES_PER_WEEK; i++) {
      starsHtml += byWeek[w].has(i)
        ? '<span class="stars-filled">★</span>'
        : '<span class="stars-empty">☆</span>';
    }
    const row = document.createElement('div');
    row.className = 'stats-week-row';
    row.innerHTML = `<span class="stats-week-label">Week ${w}</span><span class="stats-week-stars">${starsHtml}</span><span class="stats-week-count">${count}/7</span>`;
    weeksEl.appendChild(row);
  }
}

function hasDisplayName(user) {
  const name = (user?.displayName || '').trim();
  return name.length > 0;
}

function renderProfile() {
  const user = getUser();
  const uidEl = document.getElementById('profileUid');
  const nameEl = document.getElementById('profileName');
  const editBtn = document.getElementById('profileEditBtn');
  const profileEl = document.getElementById('statsProfile');

  if (!user || !uidEl || !nameEl || !editBtn || !profileEl) return;

  const shortId = user.id.slice(0, 8) + '…';
  uidEl.textContent = `UID: ${shortId}`;
  uidEl.classList.toggle('hidden', hasDisplayName(user));

  if (hasDisplayName(user)) {
    nameEl.textContent = (user.displayName || '').trim();
    nameEl.classList.remove('stats-profile-prompt');
    editBtn.textContent = '✏️';
    editBtn.title = 'Change name';
    editBtn.classList.remove('hidden');
    profileEl.classList.add('has-name');
  } else {
    nameEl.textContent = 'You have not set your Username yet. Press here to choose a name';
    nameEl.classList.add('stats-profile-prompt');
    editBtn.textContent = 'Set name';
    editBtn.title = 'Choose your name';
    editBtn.classList.remove('hidden');
    profileEl.classList.remove('has-name');
  }
}

function openNameModal() {
  const modal = document.getElementById('nameModal');
  const input = document.getElementById('nameInput');
  if (!modal || !input) return;
  input.value = (getUser()?.displayName || '').trim();
  modal.classList.remove('hidden');
  input.focus();
}

function closeNameModal() {
  const modal = document.getElementById('nameModal');
  if (modal) modal.classList.add('hidden');
}

async function saveName() {
  const input = document.getElementById('nameInput');
  const name = (input?.value || '').trim().slice(0, 32);
  if (!name) return;
  setDisplayName(name);
  await updateDisplayName(name).catch(console.warn);
  renderProfile();
  closeNameModal();
}

async function init() {
  initUser();
  renderProfile();

  const loading = document.getElementById('statsLoading');
  const content = document.getElementById('statsContent');
  const empty = document.getElementById('statsEmpty');

  const results = await fetchUserStats();

  loading.classList.add('hidden');

  const profileEl = document.getElementById('statsProfile');
  const profileName = document.getElementById('profileName');
  const profileEditBtn = document.getElementById('profileEditBtn');
  if (profileEl) {
    profileEl.addEventListener('click', (e) => {
      if (e.target === profileEditBtn || profileEditBtn?.contains(e.target)) return;
      openNameModal();
    });
  }
  if (profileEditBtn) {
    profileEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openNameModal();
    });
  }

  document.getElementById('nameCancelBtn')?.addEventListener('click', closeNameModal);
  document.getElementById('nameSaveBtn')?.addEventListener('click', saveName);
  document.getElementById('nameClearBtn')?.addEventListener('click', async () => {
    clearDisplayName();
    await updateDisplayName(null).catch(console.warn);
    renderProfile();
    const input = document.getElementById('nameInput');
    if (input) input.value = '';
  });
  document.querySelector('.stats-name-modal-backdrop')?.addEventListener('click', closeNameModal);
  document.getElementById('nameInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') closeNameModal();
  });

  if (results.length === 0) {
    empty.classList.remove('hidden');
    return;
  }

  const stats = aggregateStats(results);
  renderStats(stats);
  content.classList.remove('hidden');

  const resetBtn = document.getElementById('statsResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Sure you want to reset all progress?')) return;
      const ok = await resetProgress();
      if (ok) {
        window.location.href = './index.html';
      } else {
        alert('Could not reset. Try again.');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
