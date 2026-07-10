/**
 * days.js – Day-of-week homework picker for Lees saam & Spell woorde.
 * Each day card expands to show that day's homework from the sheet.
 */

import { getHomeworkWeek } from './homeworkData.js';

const TASK_ICONS = {
  lees: "📖",
  spell: "✏️",
  write: "📝",
  math: "🔢",
  language: "💬",
  comprehension: "🧠",
  oral: "🎤",
};

const ACTIVITY_META = {
  lees: { badge: "📖 Lees Saam", crumb: "Lees saam", url: "./index.html" },
  spell: { badge: "✏️ Spell woorde", crumb: "Spell woorde", url: "./words.html" },
};

let state = {
  weekIndex: 0,
  activity: "lees",
  openDayId: null,
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const week = parseInt(params.get("week") ?? "1", 10);
  if (week >= 1 && week <= 8) state.weekIndex = week - 1;
  const activity = params.get("activity");
  if (activity === "spell" || activity === "lees") state.activity = activity;
  const day = params.get("day");
  if (day) state.openDayId = day;
}

function updateUrl() {
  const params = new URLSearchParams();
  params.set("week", String(state.weekIndex + 1));
  params.set("activity", state.activity);
  if (state.openDayId) params.set("day", state.openDayId);
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", next);
}

function renderIntro(week) {
  const meta = ACTIVITY_META[state.activity];
  document.getElementById("headerBadge").textContent = meta.badge;
  document.getElementById("activityCrumb").textContent = meta.crumb;
  document.getElementById("daysSchool").textContent = week.school ?? "";
  document.getElementById("daysTitle").textContent = `${week.label} huiswerk`;
  document.getElementById("daysDates").textContent = week.dateRange ?? "";
  document.getElementById("daysReminder").textContent = week.intro ?? "";

  const list = document.getElementById("daysDailyList");
  list.innerHTML = (week.dailyReminder ?? [])
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
}

function renderTask(task) {
  const icon = TASK_ICONS[task.type] ?? "📌";
  const items = task.items?.length
    ? `<ul class="day-task-items">${task.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
    : "";
  return `
    <li class="day-task day-task--${task.type}">
      <span class="day-task-icon">${icon}</span>
      <div class="day-task-body">
        <strong>${escapeHtml(task.label)}</strong>
        <span>${escapeHtml(task.detail)}</span>
        ${items}
      </div>
    </li>`;
}

function activityUrl(dayId) {
  const meta = ACTIVITY_META[state.activity];
  const week = state.weekIndex + 1;
  return `${meta.url}?week=${week}&day=${dayId}`;
}

function renderDayCards(week) {
  const container = document.getElementById("dayCards");
  const primaryLabel = state.activity === "lees" ? "Begin Lees saam" : "Begin Spell woorde";
  const primaryIcon = state.activity === "lees" ? "📖" : "✏️";
  const secondary = state.activity === "lees"
    ? { label: "Spell woorde", icon: "✏️", url: "./words.html" }
    : { label: "Lees saam", icon: "📖", url: "./index.html" };

  container.innerHTML = week.days
    .map((day) => {
      const open = state.openDayId === day.id;
      const summary = day.tasks
        .slice(0, 2)
        .map((t) => t.label)
        .join(" · ");
      return `
        <article class="day-card ${open ? "day-card--open" : ""}" data-day-id="${day.id}">
          <button type="button" class="day-card-header" aria-expanded="${open}">
            <span class="day-card-emoji">${day.emoji}</span>
            <span class="day-card-headings">
              <span class="day-card-label">${escapeHtml(day.label)}</span>
              <span class="day-card-label-en">${escapeHtml(day.labelEn)}</span>
              <span class="day-card-summary">${escapeHtml(summary)}</span>
            </span>
            <span class="day-card-chevron" aria-hidden="true">${open ? "▲" : "▼"}</span>
          </button>
          <div class="day-card-body ${open ? "" : "hidden"}">
            <ul class="day-task-list">
              ${day.tasks.map(renderTask).join("")}
            </ul>
            <div class="day-card-actions">
              <a href="${activityUrl(day.id)}" class="day-action-btn day-action-btn--primary">
                <span>${primaryIcon}</span> ${primaryLabel}
              </a>
              <a href="${secondary.url}?week=${state.weekIndex + 1}&day=${day.id}" class="day-action-btn day-action-btn--secondary">
                <span>${secondary.icon}</span> ${secondary.label}
              </a>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function render() {
  const week = getHomeworkWeek(state.weekIndex);
  renderIntro(week);
  renderDayCards(week);
  const trigger = document.querySelector('.breadcrumb-trigger[data-picker="week"]');
  if (trigger) trigger.textContent = week.label;
  updateUrl();
}

function bindEvents() {
  document.getElementById("dayCards")?.addEventListener("click", (e) => {
    const header = e.target.closest(".day-card-header");
    if (!header) return;
    const card = header.closest(".day-card");
    const dayId = card?.dataset.dayId;
    if (!dayId) return;
    state.openDayId = state.openDayId === dayId ? null : dayId;
    render();
  });

  const picker = document.getElementById("breadcrumbPicker");
  picker?.addEventListener("click", (e) => {
    const trigger = e.target.closest(".breadcrumb-trigger");
    const option = e.target.closest(".breadcrumb-dropdown button[role='option']");

    if (trigger?.dataset.picker === "week") {
      e.stopPropagation();
      const dropdown = trigger.nextElementSibling;
      const open = dropdown?.classList.contains("hidden");
      picker.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
      if (open) dropdown?.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }

    if (option?.dataset.weekIndex !== undefined) {
      state.weekIndex = Number(option.dataset.weekIndex);
      state.openDayId = null;
      picker.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
      render();
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".breadcrumb-picker")) {
      document.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
    }
  });
}

readParams();
bindEvents();
render();
