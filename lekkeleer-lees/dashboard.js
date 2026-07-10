/**
 * dashboard.js – Week activities dashboard
 * Shows activity cards for the selected week. Links to Lees saam and Spell woorde with week param.
 */

import { initUser, getUser, setDisplayName } from './user.js';
import { submitFeedback, updateDisplayName } from './db.js';

const WEEKS = [
  { label: "Week 1", term: 1 }, { label: "Week 2", term: 1 }, { label: "Week 3", term: 1 },
  { label: "Week 4", term: 1 }, { label: "Week 5", term: 1 }, { label: "Week 6", term: 1 },
  { label: "Week 7", term: 1 }, { label: "Week 8", term: 1 },
];

let state = {
  currentWeek: 0,
};

function selectWeek(idx) {
  state.currentWeek = idx;
  const label = document.getElementById("weekLabel");
  if (label) label.textContent = `Term 1 · ${WEEKS[idx].label}`;
}

function initBreadcrumb() {
  const trigger = document.querySelector('.breadcrumb-trigger[data-picker="week"]');
  const dropdown = trigger?.nextElementSibling;
  if (!trigger || !dropdown) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !dropdown.classList.contains("hidden");
    document.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
    document.querySelectorAll(".breadcrumb-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
    if (!isOpen) {
      dropdown.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
    }
  });

  dropdown.querySelectorAll("button[role=option]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const idx = parseInt(opt.dataset.weekIndex, 10);
      selectWeek(idx);
      trigger.textContent = WEEKS[idx].label;
      dropdown.classList.add("hidden");
      trigger.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", () => {
    dropdown.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
  });
}

const ACTIVITY_URLS = {
  lees: "./days.html?activity=lees",
  spell: "./days.html?activity=spell",
};

function bindActivityLinks() {
  document.querySelectorAll('.dashboard-card[data-activity]').forEach((card) => {
    const activity = card.dataset.activity;
    const baseUrl = ACTIVITY_URLS[activity];
    if (!baseUrl) return;

    card.addEventListener("click", (e) => {
      e.preventDefault();
      const week = state.currentWeek + 1;
      window.location.href = `${baseUrl}&week=${week}`;
    });
  });
}

// ── Feedback & Debug modals ───────────────────────────────────────────────────
function openFeedbackModal() {
  const name = (getUser()?.displayName || "").trim();
  if (!name) {
    openNameRequiredModal();
    return;
  }
  const modal = document.getElementById("feedbackModal");
  const input = document.getElementById("feedbackInput");
  const status = document.getElementById("feedbackStatus");
  if (!modal) return;
  modal.classList.remove("hidden");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (status) {
    status.textContent = "";
    status.className = "feedback-modal-status hidden";
  }
}

function closeFeedbackModal() {
  document.getElementById("feedbackModal")?.classList.add("hidden");
}

function openNameRequiredModal() {
  const modal = document.getElementById("nameRequiredModal");
  const input = document.getElementById("nameRequiredInput");
  if (!modal) return;
  modal.classList.remove("hidden");
  if (input) {
    input.value = "";
    input.focus();
  }
}

function closeNameRequiredModal() {
  document.getElementById("nameRequiredModal")?.classList.add("hidden");
}

async function submitFeedbackForm() {
  const input = document.getElementById("feedbackInput");
  const status = document.getElementById("feedbackStatus");
  const submitBtn = document.getElementById("feedbackSubmitBtn");
  const msg = (input?.value || "").trim();
  if (!msg) return;
  if (!(getUser()?.displayName || "").trim()) {
    if (status) {
      status.classList.remove("hidden");
      status.className = "feedback-modal-status error";
      status.textContent = "Please set your name first.";
    }
    return;
  }
  if (submitBtn) submitBtn.disabled = true;
  const result = await submitFeedback(msg);
  if (submitBtn) submitBtn.disabled = false;
  if (status) {
    status.classList.remove("hidden");
    status.className = "feedback-modal-status " + (result.ok ? "success" : "error");
    status.textContent = result.ok ? "Thank you!" : "Could not send." + (result.hint || " Try again.");
  }
  if (result.ok && input) {
    input.value = "";
    setTimeout(closeFeedbackModal, 1200);
  }
}

function openDebugModal() {
  const modal = document.getElementById("debugModal");
  const body = document.getElementById("debugModalBody");
  if (!modal || !body) return;
  body.innerHTML = `<p><strong>Build:</strong> 2026-03-09</p><p>Dashboard – Week activities</p>`;
  modal.classList.remove("hidden");
}

function closeDebugModal() {
  document.getElementById("debugModal")?.classList.add("hidden");
}

function bindModals() {
  document.getElementById("feedbackBtn")?.addEventListener("click", openFeedbackModal);
  document.getElementById("feedbackCancelBtn")?.addEventListener("click", closeFeedbackModal);
  document.getElementById("feedbackSubmitBtn")?.addEventListener("click", submitFeedbackForm);
  document.getElementById("feedbackModal")?.querySelector(".feedback-modal-backdrop")?.addEventListener("click", closeFeedbackModal);

  document.getElementById("nameRequiredContinueBtn")?.addEventListener("click", () => {
    const input = document.getElementById("nameRequiredInput");
    const name = (input?.value || "").trim();
    if (!name) return;
    setDisplayName(name);
    updateDisplayName(name).catch(() => {});
    closeNameRequiredModal();
    openFeedbackModal();
  });
  document.getElementById("nameRequiredCancelBtn")?.addEventListener("click", closeNameRequiredModal);
  document.getElementById("nameRequiredModal")?.querySelector(".feedback-modal-backdrop")?.addEventListener("click", closeNameRequiredModal);
  document.getElementById("nameRequiredInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("nameRequiredContinueBtn")?.click();
    }
  });

  document.getElementById("debugBtn")?.addEventListener("click", openDebugModal);
  document.getElementById("debugCloseBtn")?.addEventListener("click", closeDebugModal);
  document.getElementById("debugModal")?.querySelector(".version-modal-backdrop")?.addEventListener("click", closeDebugModal);
}

// Init
(async () => {
  await initUser();

  const params = new URLSearchParams(window.location.search);
  const weekParam = params.get("week");
  if (weekParam) {
    const w = parseInt(weekParam, 10);
    if (w >= 1 && w <= 8) {
      state.currentWeek = w - 1;
      const trigger = document.querySelector('.breadcrumb-trigger[data-picker="week"]');
      if (trigger) trigger.textContent = WEEKS[state.currentWeek].label;
      document.getElementById("weekLabel").textContent = `Term 1 · ${WEEKS[state.currentWeek].label}`;
    }
  }

  initBreadcrumb();
  bindActivityLinks();
  bindModals();
})();
