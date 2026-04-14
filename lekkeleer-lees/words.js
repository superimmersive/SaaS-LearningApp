/**
 * words.js – Woorde flashcard section
 * Uses TTS (tts-proxy) for Afrikaans word playback. Tap card to flip, arrows to navigate.
 * Styling matches Lees saam (LekkeLeer).
 */

import { initUser, getUser, setDisplayName } from './user.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, submitFeedback, updateDisplayName } from './db.js';
import * as ttsCache from './ttsCache.js';

const AZURE_VOICES = {
  Adri: "af-ZA-AdriNeural",
  Willem: "af-ZA-WillemNeural",
};

// Emoji mapping for common Afrikaans words
const EMOJIS = {
  das: "🧣", sak: "🎒", mat: "🟫", bal: "⚽", kam: "💈", kat: "🐱", vat: "🏺", tak: "🌿",
  tas: "👜", was: "🧺", nes: "🪺", pet: "🧢", bed: "🛏️", pen: "✏️", mes: "🔪", hek: "🚪",
  ek: "👤", tent: "⛺", emmer: "🪣", lig: "💡", pit: "🌱", lip: "💋", vis: "🐟", kis: "📦",
  pil: "💊", bril: "👓", gril: "😬", in: "📥", iglo: "🏔️", son: "☀️", rot: "🐀", rok: "👗",
  pop: "🪆", mot: "🦋", dop: "🔔", gom: "🗑️", som: "➕", hom: "👦", hok: "🐔",
  vyf: "5️⃣", rys: "🌾", byl: "🪓", pyp: "🚰", ys: "🧊", by: "🐝", pyl: "🏹", ryp: "❄️",
  lys: "📋", lyf: "🫀", bus: "🚌", hut: "🛖", sus: "👧", rug: "🎒", mus: "🐭", bul: "🐂",
  put: "⛏️", rus: "😴", lug: "🌬️", buk: "📚",
  katte: "🐱", matte: "🟫", vuur: "🔥", mure: "🧱", sakke: "🎒", sin: "✳️", sinne: "✳️",
  dam: "🌊", damme: "🌊", muur: "🏰", naam: "🏷️", raam: "🖼️", vere: "🪶", vure: "🔥",
  haan: "🐓", hane: "🐓", rane: "🐸", dame: "👑", name: "🏷️", veer: "🪶",
};

const WEEKS = [
  { label: "Week 1", words: [
    { af: "das", en: "tie / scarf" }, { af: "sak", en: "bag / pocket" }, { af: "mat", en: "mat" },
    { af: "bal", en: "ball" }, { af: "kam", en: "comb" }, { af: "kat", en: "cat" },
    { af: "vat", en: "barrel / to grab" }, { af: "tak", en: "branch" }, { af: "tas", en: "bag / suitcase" },
    { af: "was", en: "washing / was" },
  ]},
  { label: "Week 2", words: [
    { af: "nes", en: "nest" }, { af: "pet", en: "cap / hat" }, { af: "bed", en: "bed" },
    { af: "pen", en: "pen" }, { af: "mes", en: "knife" }, { af: "hek", en: "gate / fence" },
    { af: "ek", en: "I / me" }, { af: "tent", en: "tent" }, { af: "emmer", en: "bucket" },
  ]},
  { label: "Week 3", words: [
    { af: "lig", en: "light / easy" }, { af: "pit", en: "seed / pip" }, { af: "lip", en: "lip" },
    { af: "vis", en: "fish" }, { af: "kis", en: "chest / box" }, { af: "pil", en: "pill" },
    { af: "bril", en: "glasses" }, { af: "gril", en: "shudder / grill" }, { af: "in", en: "in" },
    { af: "iglo", en: "igloo" },
  ]},
  { label: "Week 4", words: [
    { af: "son", en: "sun" }, { af: "rot", en: "rat / rotten" }, { af: "rok", en: "dress / skirt" },
    { af: "pop", en: "doll" }, { af: "mot", en: "moth" }, { af: "dop", en: "shell / to fail" },
    { af: "gom", en: "gum / eraser" }, { af: "som", en: "sum" }, { af: "hom", en: "him" },
    { af: "hok", en: "cage / coop" },
  ]},
  { label: "Week 5", words: [
    { af: "vyf", en: "five" }, { af: "rys", en: "rice" }, { af: "byl", en: "axe" },
    { af: "pyp", en: "pipe / tube" }, { af: "ys", en: "ice" }, { af: "by", en: "bee / at / by" },
    { af: "pyl", en: "arrow" }, { af: "ryp", en: "ripe / frost" }, { af: "lys", en: "list / pale" },
    { af: "lyf", en: "body" },
  ]},
  { label: "Week 6", words: [
    { af: "bus", en: "bus" }, { af: "hut", en: "hut" }, { af: "sus", en: "sister" },
    { af: "rug", en: "back (body)" }, { af: "mus", en: "mouse / beanie" }, { af: "bul", en: "bull" },
    { af: "put", en: "well / pit" }, { af: "rus", en: "to rest" }, { af: "lug", en: "air / sky" },
    { af: "buk", en: "to bend down" },
  ]},
  { label: "Week 7", words: [
    { af: "kat", en: "cat" }, { af: "katte", en: "cats" }, { af: "mat", en: "mat" },
    { af: "matte", en: "mats" }, { af: "vuur", en: "fire" }, { af: "mure", en: "walls" },
    { af: "sak", en: "bag" }, { af: "sakke", en: "bags" }, { af: "sin", en: "sense / sentence" },
    { af: "sinne", en: "senses" }, { af: "dam", en: "dam / pond" }, { af: "damme", en: "dams" },
  ]},
  { label: "Week 8", words: [
    { af: "muur", en: "wall" }, { af: "mure", en: "walls" }, { af: "vuur", en: "fire" },
    { af: "vure", en: "fires" }, { af: "veer", en: "feather / spring" }, { af: "vere", en: "feathers" },
    { af: "naam", en: "name" }, { af: "name", en: "names" }, { af: "raam", en: "frame / window" },
    { af: "rane", en: "frames" }, { af: "haan", en: "rooster" }, { af: "hane", en: "roosters" },
  ]},
];

const SpeechRecognitionCtor =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;
const hasSpeechRecognition = !!SpeechRecognitionCtor && typeof SpeechRecognitionCtor === "function";

let state = {
  currentWeek: 0,
  currentIndex: 0,
  isFlipped: false,
  currentWords: [],
  currentVoice: "Adri",
  ttsCache: new Map(),
  ttsPending: new Map(),
  currentAudio: null,
  listening: false,
  recognition: null,
};

function getEmoji(word) {
  return EMOJIS[word] || "🔤";
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildCacheKey(text, voice) {
  return `words:${voice}:${text}`;
}

async function getOrCreateAudioUrl(text) {
  const key = buildCacheKey(text, state.currentVoice);
  if (state.ttsCache.has(key)) return state.ttsCache.get(key);
  if (state.ttsPending.has(key)) return state.ttsPending.get(key);

  const promise = (async () => {
    const cached = await ttsCache.get(key);
    if (cached) {
      const url = URL.createObjectURL(cached.blob);
      state.ttsCache.set(key, url);
      return url;
    }
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='af-ZA'>
      <voice name='${AZURE_VOICES[state.currentVoice]}'>${escapeXml(text)}</voice>
    </speak>`;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tts-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ ssml }),
    });
    if (!res.ok) throw new Error("TTS failed");
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "audio/mpeg" });
    ttsCache.set(key, blob, []).catch(() => {});
    const url = URL.createObjectURL(blob);
    state.ttsCache.set(key, url);
    return url;
  })()
    .then((url) => {
      state.ttsPending.delete(key);
      return url;
    })
    .catch((err) => {
      state.ttsPending.delete(key);
      throw err;
    });

  state.ttsPending.set(key, promise);
  return promise;
}

async function speakWord(text) {
  const els = { ttsStatus: document.getElementById("ttsStatus") };
  els.ttsStatus.className = "tts-status busy";
  els.ttsStatus.textContent = "🔊 ...";
  try {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    const url = await getOrCreateAudioUrl(text);
    const audio = new Audio(url);
    state.currentAudio = audio;
    audio.onended = () => {
      if (state.currentAudio === audio) state.currentAudio = null;
      els.ttsStatus.className = "tts-status ok";
      els.ttsStatus.textContent = "✅ Ready";
    };
    audio.onerror = () => {
      els.ttsStatus.className = "tts-status error";
      els.ttsStatus.textContent = "⚠️ Spraak fout";
    };
    await audio.play();
  } catch (e) {
    els.ttsStatus.className = "tts-status error";
    els.ttsStatus.textContent = "⚠️ Verbinding fout";
  }
}

function normalizeWord(word) {
  return String(word || "")
    .normalize("NFKD")
    .replace(/[''`"]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()
    .trim();
}

function tokenizeTranscript(transcript) {
  return String(transcript || "")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      matrix[r][c] =
        a[r - 1] === b[c - 1]
          ? matrix[r - 1][c - 1]
          : 1 + Math.min(matrix[r - 1][c], matrix[r][c - 1], matrix[r - 1][c - 1]);
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyMatch(spoken, expected) {
  if (spoken === expected) return true;
  return levenshtein(spoken, expected) <= (expected.length <= 3 ? 1 : 2);
}

function renderMicStatus(cls, text) {
  const el = document.getElementById("micStatus");
  const txt = document.getElementById("micStatusText");
  if (el) el.className = "mic-status " + (cls || "idle");
  if (txt) txt.textContent = text || "";
}

const wordRecognitionService = {
  ensureReady() {
    if (!hasSpeechRecognition || state.recognition) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "af-ZA";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) transcript += r[0]?.transcript || "";
      }
      if (!transcript.trim()) return;
      const words = tokenizeTranscript(transcript);
      const expected = normalizeWord(
        (state.currentWords[state.currentIndex]?.af || "")
      );
      for (const spoken of words) {
        if (fuzzyMatch(spoken, expected)) {
          renderMicStatus("hearing", "Reg! ✓");
          stopListening();
          setTimeout(() => renderMicStatus("idle", "Gereed — tik Begin Lees om die woord te sê"), 1500);
          return;
        }
      }
    };
    recognition.onerror = (e) => {
      if (e.error === "aborted") return;
      if (e.error === "not-allowed") {
        renderMicStatus("error", "🚫 Mikrofoon geweier.");
      } else if (e.error === "no-speech") {
        renderMicStatus("hearing", "🎤 Neem jou tyd... sê die woord.");
        return;
      } else {
        renderMicStatus("error", `⚠️ ${e.error}`);
      }
      stopListening();
    };
    recognition.onend = () => {
      if (state.listening && state.recognition) {
        try {
          state.recognition.start();
        } catch (_) {}
      }
    };
    state.recognition = recognition;
  },
  start() {
    this.ensureReady();
    if (state.recognition) state.recognition.start();
  },
  stop() {
    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch (_) {}
    }
  },
};

function toggleListen() {
  if (!hasSpeechRecognition) {
    renderMicStatus("error", "😔 Gebruik Chrome vir spraakherkenning.");
    return;
  }
  if (state.listening) {
    stopListening();
    return;
  }
  state.listening = true;
  document.getElementById("card")?.classList.add("listening");
  document.getElementById("listenBtn")?.classList.add("active");
  document.getElementById("listenIcon").textContent = "⏹";
  document.getElementById("listenLabel").textContent = "Stop";
  renderMicStatus("hearing", "🎤 Luister... sê die woord hardop.");
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
  }
  wordRecognitionService.start();
}

function stopListening() {
  state.listening = false;
  document.getElementById("card")?.classList.remove("listening");
  document.getElementById("listenBtn")?.classList.remove("active");
  document.getElementById("listenIcon").textContent = "🎤";
  document.getElementById("listenLabel").textContent = "Begin Lees";
  renderMicStatus("idle", "Gereed — tik Begin Lees om die woord te sê");
  wordRecognitionService.stop();
}

function renderBreadcrumb() {
  const weekTrigger = document.querySelector('.breadcrumb-trigger[data-picker="week"]');
  const activityTrigger = document.querySelector('.breadcrumb-trigger[data-picker="activity"]');
  if (weekTrigger) weekTrigger.textContent = WEEKS[state.currentWeek].label;
  if (activityTrigger) activityTrigger.textContent = "Spell woorde";
}

function bindBreadcrumbPicker() {
  const picker = document.getElementById("breadcrumbPicker");
  if (!picker) return;

  function closeAllDropdowns() {
    picker.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
    picker.querySelectorAll(".breadcrumb-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  picker.addEventListener("click", (event) => {
    const trigger = event.target.closest(".breadcrumb-trigger");
    const option = event.target.closest(".breadcrumb-dropdown button[role='option']");

    if (trigger) {
      event.stopPropagation();
      const segment = trigger.closest(".breadcrumb-segment");
      const dropdown = segment?.querySelector(".breadcrumb-dropdown");
      const isOpen = dropdown && !dropdown.classList.contains("hidden");

      closeAllDropdowns();
      if (!isOpen && dropdown) {
        dropdown.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
      }
      return;
    }

    if (option) {
      event.stopPropagation();
      if (option.classList.contains("locked")) return;

      const weekIndex = option.dataset.weekIndex;
      const activity = option.dataset.activity;

      if (weekIndex !== undefined) {
        const idx = parseInt(weekIndex, 10);
        if (idx >= 0 && idx < WEEKS.length) {
          selectWeek(idx);
        }
      }

      if (activity !== undefined) {
        if (activity === "lees") {
          window.location.href = `index.html?week=${state.currentWeek + 1}`;
          return;
        }
      }

      closeAllDropdowns();
      renderBreadcrumb();
    }
  });

  document.addEventListener("click", (e) => {
    if (!picker.contains(e.target)) closeAllDropdowns();
  });
}

function selectWeek(idx) {
  state.currentWeek = idx;
  state.currentIndex = 0;
  state.isFlipped = false;
  loadWeek(idx);
  renderBreadcrumb();
}

function loadWeek(idx) {
  state.currentWords = [...WEEKS[idx].words];
  state.currentIndex = 0;
  renderCard();
  renderProgressDots();
  renderWordGrid();
}

function renderCard() {
  stopListening();
  const card = document.getElementById("card");
  card.classList.remove("flipped");
  state.isFlipped = false;

  const w = state.currentWords[state.currentIndex];
  if (!w) return;

  document.getElementById("frontWord").textContent = w.af;
  document.getElementById("backWord").textContent = w.en;
  document.getElementById("cardEmoji").textContent = getEmoji(w.af);
  document.getElementById("counter").textContent = `${state.currentIndex + 1} / ${state.currentWords.length}`;

  renderProgressDots();
  document.querySelectorAll(".word-chip").forEach((chip, i) => {
    chip.classList.toggle("current", i === state.currentIndex);
  });
}

function renderProgressDots() {
  const container = document.getElementById("progressDots");
  if (!container) return;
  container.replaceChildren();
  state.currentWords.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.classList.toggle("current", i === state.currentIndex);
    dot.addEventListener("click", () => {
      state.currentIndex = i;
      renderCard();
    });
    container.appendChild(dot);
  });
}

function flipCard() {
  stopListening();
  state.isFlipped = !state.isFlipped;
  document.getElementById("card").classList.toggle("flipped", state.isFlipped);
}

function navigate(dir) {
  const newIdx = state.currentIndex + dir;
  if (newIdx < 0 || newIdx >= state.currentWords.length) return;
  state.currentIndex = newIdx;
  renderCard();
}

function renderWordGrid() {
  const grid = document.getElementById("wordGrid");
  if (!grid) return;
  grid.innerHTML = "";
  state.currentWords.forEach((w, i) => {
    const chip = document.createElement("div");
    chip.className = "word-chip" + (i === state.currentIndex ? " current" : "");
    chip.textContent = w.af;
    chip.onclick = () => {
      state.currentIndex = i;
      renderCard();
    };
    grid.appendChild(chip);
  });
}

function toggleList() {
  const grid = document.getElementById("wordGrid");
  const btn = document.getElementById("wordListToggle");
  grid.classList.toggle("open");
  btn.textContent = grid.classList.contains("open") ? "▲ Verberg woorde" : "▼ Wys alle woorde vir hierdie week";
}

// ── Feedback & Debug modals (same as Lees saam) ───────────────────────────────
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
  body.innerHTML = `<p><strong>Build:</strong> 2026-03-09</p><p>Spell woorde – LekkeLeer flashcard section</p>`;
  modal.classList.remove("hidden");
}

function closeDebugModal() {
  document.getElementById("debugModal")?.classList.add("hidden");
}

function bindEvents() {
  document.getElementById("cardWrapper").addEventListener("click", (e) => {
    if (!e.target.closest(".woorde-speak-btn") && !e.target.closest(".woorde-listen-btn")) flipCard();
  });
  document.getElementById("prevBtn").addEventListener("click", () => navigate(-1));
  document.getElementById("nextBtn").addEventListener("click", () => navigate(1));
  document.getElementById("wordListToggle").addEventListener("click", toggleList);
  document.getElementById("speakBtn").addEventListener("click", () => {
    const w = state.currentWords[state.currentIndex];
    if (w) speakWord(w.af);
  });
  document.getElementById("listenBtn").addEventListener("click", toggleListen);

  document.querySelectorAll(".voice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentVoice = btn.dataset.voice;
      document.querySelectorAll(".voice-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.getElementById("feedbackModal") && !document.getElementById("feedbackModal").classList.contains("hidden")) {
        closeFeedbackModal();
        return;
      }
      if (document.getElementById("nameRequiredModal") && !document.getElementById("nameRequiredModal").classList.contains("hidden")) {
        closeNameRequiredModal();
        return;
      }
      if (document.getElementById("debugModal") && !document.getElementById("debugModal").classList.contains("hidden")) {
        closeDebugModal();
        return;
      }
    }
    if (e.key === "ArrowRight") navigate(1);
    else if (e.key === "ArrowLeft") navigate(-1);
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flipCard();
    }
  });

  // Feedback modal
  document.getElementById("feedbackBtn")?.addEventListener("click", openFeedbackModal);
  document.getElementById("feedbackCancelBtn")?.addEventListener("click", closeFeedbackModal);
  document.getElementById("feedbackSubmitBtn")?.addEventListener("click", submitFeedbackForm);
  document.getElementById("feedbackModal")?.querySelector(".feedback-modal-backdrop")?.addEventListener("click", closeFeedbackModal);

  // Name required modal
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

  // Debug modal
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
    }
  }

  document.querySelector(".voice-btn[data-voice='Adri']")?.classList.add("active");
  bindBreadcrumbPicker();
  renderBreadcrumb();
  loadWeek(state.currentWeek);
  bindEvents();
})();
