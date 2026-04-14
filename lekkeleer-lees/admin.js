/**
 * admin.js — LekkeLeer Admin Dashboard
 * Fetches Supabase data and renders charts.
 * Access via admin.html?token=... (link removed from app; use direct URL).
 */

// Change this and the token in app.js (Debug modal link) to match.
const ADMIN_TOKEN = 'll-admin-2024';

const SUPABASE_URL = 'https://taiwqvydfhlkyjguunrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXdxdnlkZmhsa3lqZ3V1bnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTIwNDksImV4cCI6MjA4ODk2ODA0OX0.pnB1kt2kS81Y8jrxyc3Ot2psO1YqEEZr1M8F7aRaSMw';

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: 'application/json',
};

async function fetchTable(table, select = '*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`${table}: ${res.status}`);
  return res.json();
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token !== ADMIN_TOKEN) {
    document.getElementById('adminLoading').textContent = 'Access denied. Use admin.html?token=... with the correct token.';
    document.getElementById('adminLoading').classList.remove('hidden');
    return;
  }

  const loading = document.getElementById('adminLoading');
  const content = document.getElementById('adminContent');
  const errorEl = document.getElementById('adminError');

  Promise.all([
    fetchTable('users', 'id,display_name,created_at,last_seen'),
    fetchTable('sentence_results', 'user_id,week,completed,correct_words,total_words,mode'),
    fetchTable('feedback', 'user_id,message,created_at'),
  ])
    .then(([users, results, feedback]) => {
      loading.classList.add('hidden');
      content.classList.remove('hidden');
      renderDashboard(users, results, feedback);
    })
    .catch((err) => {
      console.error('[Admin]', err);
      loading.classList.add('hidden');
      errorEl.classList.remove('hidden');
    });
}

function renderDashboard(users, results, feedback) {
  const completed = results.filter((r) => r.completed);

  document.getElementById('cardUsers').textContent = users.length;
  document.getElementById('cardCompletions').textContent = completed.length;
  document.getElementById('cardFeedback').textContent = feedback.length;

  renderDailyUsers(users);
  renderCompletions(completed);
  renderAccuracy(results);
  renderActiveUsers(users, results);
  renderFeedback(feedback);
}

function renderDailyUsers(users) {
  const byDay = {};
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  users.forEach((u) => {
    if (!u.last_seen) return;
    const key = u.last_seen.slice(0, 10);
    if (byDay[key] !== undefined) byDay[key]++;
  });

  const labels = Object.keys(byDay).map((d) => d.slice(5));
  const data = Object.values(byDay);

  new Chart(document.getElementById('chartDailyUsers'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Users', data, backgroundColor: 'rgba(59, 158, 212, 0.6)' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

function renderCompletions(completed) {
  const byWeek = {};
  for (let w = 1; w <= 8; w++) byWeek[w] = 0;
  completed.forEach((r) => {
    if (byWeek[r.week] !== undefined) byWeek[r.week]++;
  });

  new Chart(document.getElementById('chartCompletions'), {
    type: 'bar',
    data: {
      labels: Object.keys(byWeek).map((w) => `Week ${w}`),
      datasets: [{ label: 'Completions', data: Object.values(byWeek), backgroundColor: 'rgba(46, 204, 113, 0.6)' }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

function renderAccuracy(results) {
  const listen = results.filter((r) => r.mode === 'listen' && r.total_words > 0);
  const byWeek = {};
  for (let w = 1; w <= 8; w++) byWeek[w] = { sum: 0, count: 0 };
  listen.forEach((r) => {
    if (byWeek[r.week]) {
      byWeek[r.week].sum += (r.correct_words / r.total_words) * 100;
      byWeek[r.week].count++;
    }
  });

  const labels = Object.keys(byWeek).map((w) => `Week ${w}`);
  const data = Object.values(byWeek).map((o) => (o.count ? Math.round(o.sum / o.count) : 0));

  new Chart(document.getElementById('chartAccuracy'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Accuracy %', data, backgroundColor: 'rgba(255, 217, 61, 0.6)' }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } },
      },
    },
  });
}

function renderActiveUsers(users, results) {
  const byUser = {};
  results.filter((r) => r.completed).forEach((r) => {
    byUser[r.user_id] = (byUser[r.user_id] || 0) + 1;
  });
  const sorted = users
    .map((u) => ({ id: u.id, name: u.display_name, count: byUser[u.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  const tbody = document.querySelector('#tableActiveUsers tbody');
  tbody.innerHTML = sorted
    .map(
      (u) =>
        `<tr><td>${escapeHtml(u.name || '—')}</td><td><code>${u.id.slice(0, 8)}…</code></td><td>${u.count}</td></tr>`
    )
    .join('');
}

function renderFeedback(feedback) {
  const sorted = [...feedback].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
  const list = document.getElementById('feedbackList');
  list.innerHTML = sorted
    .map(
      (f) =>
        `<div class="admin-feedback-item">
          <span class="admin-feedback-date">${formatDate(f.created_at)}</span>
          <p>${escapeHtml(f.message)}</p>
        </div>`
    )
    .join('');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { dateStyle: 'short' });
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

init();
