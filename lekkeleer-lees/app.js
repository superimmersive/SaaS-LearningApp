import { initUser, getUser, setDisplayName } from './user.js';
import { initDB, startSession, endSession, recordSentenceResult, fetchCompletionForWeek, fetchUserStats, COMPLETED_KEY, submitFeedback, updateDisplayName, SUPABASE_URL, SUPABASE_ANON_KEY } from './db.js';
import * as ttsCache from './ttsCache.js';
import { getHomeworkDay } from './homeworkData.js';

const CONTENT = [
  {
    term: 1,
    week: 1,
    sentences: [
      { af: "Die kat sit.", en: "The cat sits.", emoji: "🐱" },
      { af: "Die man staan.", en: "The man stands.", emoji: "🧍" },
      { af: "Die kat sit langs die man.", en: "The cat sits next to the man.", emoji: "🐱🧍" },
      { af: "Die kas is bruin.", en: "The cupboard is brown.", emoji: "🗄️" },
      { af: "Die mat is voor die kas.", en: "The mat is in front of the cupboard.", emoji: "🟫" },
      { af: "Die bad is vol.", en: "The bath is full.", emoji: "🛁" },
      { af: "Die kat sit op die mat.", en: "The cat sits on the mat.", emoji: "🐱" },
    ],
  },
  {
    term: 1,
    week: 2,
    sentences: [
      { af: "Ek hou van eet.", en: "I like eating.", emoji: "😊" },
      { af: "Die emmer is vol.", en: "The bucket is full.", emoji: "🪣" },
      { af: "Daar is elf bokke.", en: "There are eleven goats.", emoji: "🐐" },
      { af: "Die hond slaap op die bed.", en: "The dog sleeps on the bed.", emoji: "🐶🛏️" },
      { af: "Ek ken vir Ben.", en: "I know Ben.", emoji: "🧒" },
      { af: "Die kat is vet.", en: "The cat is fat.", emoji: "🐱" },
      { af: "Hy dra 'n blou pet.", en: "He wears a blue cap.", emoji: "🧢" },
    ],
  },
  {
    term: 1,
    week: 3,
    sentences: [
      { af: "Die vis swem vinnig.", en: "The fish swims fast.", emoji: "🐟" },
      { af: "Ek mis my ma.", en: "I miss my mom.", emoji: "👩" },
      { af: "Sy sit op die stoel.", en: "She sits on the chair.", emoji: "🪑" },
      { af: "Die ink is swart.", en: "The ink is black.", emoji: "🖊️" },
      { af: "Die kos is min.", en: "The food is little.", emoji: "🍽️" },
      { af: "Dit klink na pret.", en: "That sounds like fun.", emoji: "🎉" },
      { af: "Hulle hou van sing.", en: "They like singing.", emoji: "🎵" },
    ],
  },
  {
    term: 1,
    week: 4,
    sentences: [
      { af: "Die pot is vol.", en: "The pot is full.", emoji: "🍲" },
      { af: "Daar is kos in die bord.", en: "There is food on the plate.", emoji: "🍽️" },
      { af: "My maag is vol.", en: "My tummy is full.", emoji: "😊" },
      { af: "Daar vlieg 'n mot.", en: "A moth is flying.", emoji: "🦋" },
      { af: "Die appel is vrot.", en: "The apple is rotten.", emoji: "🍎" },
      { af: "Sy naam is Tom.", en: "His name is Tom.", emoji: "🧒" },
      { af: "Ek hou van die rooi blom.", en: "I like the red flower.", emoji: "🌺" },
    ],
  },
  {
    term: 1,
    week: 5,
    sentences: [
      { af: "Ons ry in die bus.", en: "We ride in the bus.", emoji: "🚌" },
      { af: "Hy is baie fluks.", en: "He is very hard-working.", emoji: "💪" },
      { af: "Ek is lus vir koeldrank.", en: "I feel like a cooldrink.", emoji: "🥤" },
      { af: "Ek het twee susters.", en: "I have two sisters.", emoji: "👧👧" },
      { af: "Sy dra 'n rooi mus.", en: "She wears a red beanie.", emoji: "🧣" },
      { af: "Hy blus die vuur.", en: "He puts out the fire.", emoji: "🚒" },
    ],
  },
  {
    term: 1,
    week: 6,
    sentences: [
      { af: "Hy lees 'n boek.", en: "He reads a book.", emoji: "📖" },
      { af: "Ben het vir Piet gaan soek.", en: "Ben went to look for Piet.", emoji: "🕵️" },
      { af: "My voet is seer.", en: "My foot is sore.", emoji: "🦶" },
      { af: "Ek dra geel skoene.", en: "I wear yellow shoes.", emoji: "🟡👟" },
      { af: "Hy is baie soet.", en: "He is very sweet/well-behaved.", emoji: "😊" },
      { af: "My boet speel buite.", en: "My brother plays outside.", emoji: "🏃" },
      { af: "Ons moet swem.", en: "We must swim.", emoji: "🏊" },
    ],
  },
  {
    term: 1,
    week: 7,
    sentences: [
      { af: "Hy spring oor die muur.", en: "He jumps over the wall.", emoji: "🤸" },
      { af: "Die vuur is warm.", en: "The fire is warm.", emoji: "🔥" },
      { af: "Die suurlemoen is suur.", en: "The lemon is sour.", emoji: "🍋" },
      { af: "Daar is mense wat die huis huur.", en: "There are people who rent the house.", emoji: "🏠" },
      { af: "Die rok is baie duur.", en: "The dress is very expensive.", emoji: "👗" },
      { af: "Die man sit langs die vuur.", en: "The man sits next to the fire.", emoji: "🧍🔥" },
      { af: "Die motor is duur.", en: "The car is expensive.", emoji: "🚗" },
    ],
  },
  {
    term: 1,
    week: 8,
    sentences: [
      { af: "Die deur is bruin.", en: "The door is brown.", emoji: "🚪" },
      { af: "Die kos het 'n lekker geur.", en: "The food has a nice smell.", emoji: "😋" },
      { af: "Ek wonder wat gaan gebeur.", en: "I wonder what will happen.", emoji: "🤔" },
      { af: "Sy loop deur die huis.", en: "She walks through the house.", emoji: "🚶‍♀️" },
      { af: "My neus jeuk.", en: "My nose itches.", emoji: "👃" },
      { af: "Hy hou van neute.", en: "He likes nuts.", emoji: "🥜" },
      { af: "Water loop deur die geut.", en: "Water runs through the gutter.", emoji: "💧" },
    ],
  },
];

// TTS uses Supabase Edge Function (tts-proxy) — Azure key stays server-side.
const AZURE_CONFIG = {
  region: "westeurope",
  voices: {
    Adri: "af-ZA-AdriNeural",
    Willem: "af-ZA-WillemNeural",
  },
};

const BUILD_INFO = {
  version: "2026-03-09",
  note: "Vordering stars mirror database — each star shows that sentence's completion.",
};

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = Boolean(SpeechRecognitionCtor);
const isMobileDevice = () => /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const TIP_TEXT = hasSpeechRecognition
  ? "🎤 Tik <strong>Begin Lees</strong> en lees die sin hardop — elke woord word groen! | Tap <strong>Begin Lees</strong> and read aloud!"
  : "😔 Spraakherkenning is slegs beskikbaar in Chrome.";

function isElectronRuntime() {
  return /Electron|Cursor/i.test(navigator.userAgent);
}

const state = {
  unitIndex: 0,
  current: 0,
  listening: false,
  recognition: null,
  inputMeter: null,
  lastTranscriptWords: [],
  wordIndex: 0,
  expectedWord: 0,
  currentVoice: "Adri",
  currentAudio: null,
  ttsCache: new Map(),
  idbKeys: new Set(),
  ttsReady: false,
  playingSentence: false,
  karaokeCancel: null,
  ttsTimings: new Map(),
  ttsPending: new Map(),
  wordHighlightTimers: [],
  pendingSentenceCompletion: null,
  totals: {
    correct: 0,
    missed: 0,
  },
  sentence: {
    correct: 0,
    missed: 0,
  },
  completed: new Set(),
  session: null,
  listenStartTime: null,
};

function loadCompletedForWeek(weekIndex) {
  try {
    const raw = localStorage.getItem(`${COMPLETED_KEY}_${weekIndex}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCompletedForWeek() {
  try {
    const key = `${COMPLETED_KEY}_${state.unitIndex}`;
    localStorage.setItem(key, JSON.stringify([...state.completed]));
  } catch (_) {}
}

/** Loads completion from Supabase (source of truth), falls back to localStorage when offline. */
async function loadCompletedForWeekWithSync(weekIndex) {
  const weekNumber = weekIndex + 1;
  const fromDb = await fetchCompletionForWeek(weekNumber);
  if (fromDb.size > 0) {
    try {
      localStorage.setItem(`${COMPLETED_KEY}_${weekIndex}`, JSON.stringify([...fromDb]));
    } catch (_) {}
    return fromDb;
  }
  return loadCompletedForWeek(weekIndex);
}

const els = {
  starsBar: document.getElementById("starsBar"),
  breadcrumbPicker: document.getElementById("breadcrumbPicker"),
  unitLabel: document.getElementById("unitLabel"),
  voiceButtons: Array.from(document.querySelectorAll("[data-voice]")),
  ttsStatus: document.getElementById("ttsStatus"),
  mainCard: document.getElementById("mainCard"),
  sentenceNum: document.getElementById("sentenceNum"),
  sentenceEmoji: document.getElementById("sentenceEmoji"),
  sentenceText: document.getElementById("sentenceText"),
  translation: document.getElementById("translation"),
  celebration: document.getElementById("celebration"),
  finalCorrect: document.getElementById("finalCorrect"),
  finalMissed: document.getElementById("finalMissed"),
  finalPct: document.getElementById("finalPct"),
  micStatus: document.getElementById("micStatus"),
  scoreChip: document.getElementById("scoreChip"),
  scoreCorrect: document.getElementById("scoreCorrect"),
  scoreSupport: document.getElementById("scoreSupport"),
  controls: document.getElementById("controls"),
  prevBtn: document.getElementById("prevBtn"),
  listenBtn: document.getElementById("listenBtn"),
  listenIcon: document.getElementById("listenIcon"),
  listenLabel: document.getElementById("listenLabel"),
  playSentenceBtn: document.getElementById("playSentenceBtn"),
  nextBtn: document.getElementById("nextBtn"),
  progressDots: document.getElementById("progressDots"),
  restartBtn: document.getElementById("restartBtn"),
  feedbackBtn: document.getElementById("feedbackBtn"),
  nameRequiredModal: document.getElementById("nameRequiredModal"),
  nameRequiredInput: document.getElementById("nameRequiredInput"),
  nameRequiredCancelBtn: document.getElementById("nameRequiredCancelBtn"),
  nameRequiredContinueBtn: document.getElementById("nameRequiredContinueBtn"),
  feedbackModal: document.getElementById("feedbackModal"),
  feedbackInput: document.getElementById("feedbackInput"),
  feedbackCancelBtn: document.getElementById("feedbackCancelBtn"),
  feedbackSubmitBtn: document.getElementById("feedbackSubmitBtn"),
  feedbackStatus: document.getElementById("feedbackStatus"),
  debugBtn: document.getElementById("debugBtn"),
  debugModal: document.getElementById("debugModal"),
  debugModalBody: document.getElementById("debugModalBody"),
  debugCloseBtn: document.getElementById("debugCloseBtn"),
  debugMicStatus: document.getElementById("debugMicStatus"),
  micRepromptBtn: document.getElementById("micRepromptBtn"),
};

const speechSynthesisService = {
  buildCacheKey(text, rate = 1) {
    return `${state.currentVoice}|${rate}|${text}`;
  },

  updateStatus(kind, message) {
    els.ttsStatus.className = `tts-status ${kind}`;
    els.ttsStatus.textContent = message;
  },

  async createAudioUrl(text, rate = 1) {
    const ratePercent = rate === 1 ? "+0%" : `${Math.round((rate - 1) * 100)}%`;
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='af-ZA'>
      <voice name='${AZURE_CONFIG.voices[state.currentVoice]}'>
        <prosody rate='${ratePercent}'>${escapeXml(text)}</prosody>
      </voice>
    </speak>`;

    const cacheKey = this.buildCacheKey(text, rate);
    const url = `${SUPABASE_URL}/functions/v1/tts-proxy`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ssml }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.updateStatus("error", "⚠️ Spraak fout");
      throw new Error(err.error || `TTS failed: ${res.status}`);
    }

    const audioBuffer = await res.arrayBuffer();
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });

    const wordBoundaries = await estimateWordTimings(blob, text);
    state.ttsTimings.set(cacheKey, wordBoundaries);
    ttsCache.set(cacheKey, blob, wordBoundaries).catch(() => {});

    return URL.createObjectURL(blob);
  },

  async getOrCreateAudioUrl(text, rate = 1) {
    const key = this.buildCacheKey(text, rate);
    if (state.ttsCache.has(key)) {
      return state.ttsCache.get(key);
    }

    if (!state.ttsPending.has(key)) {
      state.ttsPending.set(
        key,
        (async () => {
          const cached = await ttsCache.get(key);
          if (cached) {
            const url = URL.createObjectURL(cached.blob);
            state.ttsCache.set(key, url);
            state.ttsTimings.set(key, cached.wordBoundaries);
            return url;
          }
          return this.createAudioUrl(text, rate);
        })()
          .then((url) => {
            state.ttsCache.set(key, url);
            state.ttsPending.delete(key);
            return url;
          })
          .catch((error) => {
            state.ttsPending.delete(key);
            throw error;
          })
      );
    }

    return state.ttsPending.get(key);
  },

  async playAudioUrl(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      state.currentAudio = audio;

      audio.onended = () => {
        if (state.currentAudio === audio) {
          state.currentAudio = null;
        }
        resolve();
      };

      audio.onerror = () => {
        if (state.currentAudio === audio) {
          state.currentAudio = null;
        }
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch(reject);
    });
  },

  preload(text, rate = 1) {
    this.getOrCreateAudioUrl(text, rate).catch(() => {});
  },

  async speak(text, rate = 1) {
    this.updateStatus("busy", "🔊 ...");
    try {
      const url = await this.getOrCreateAudioUrl(text, rate);
      await this.playAudioUrl(url);
      this.updateStatus("ok", "✅ Ready");
    } catch (error) {
      console.error("TTS error:", error);
      this.updateStatus("error", "⚠️ Verbinding fout");
      throw error;
    }
  },

  stop() {
    clearWordHighlightTimers();
    clearPendingSentenceCompletion();
    if (state.karaokeCancel) {
      state.karaokeCancel();
      state.karaokeCancel = null;
      state.playingSentence = false;
    }

    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio.currentTime = 0;
      state.currentAudio = null;
    }
  },
};

const recognitionService = {
  ensureReady() {
    if (!hasSpeechRecognition || state.recognition) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    const mobile = isMobileDevice();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "af-ZA";

    recognition.onresult = (event) => {
      let transcript = "";
      let lastInterim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const t = result[0]?.transcript || "";
        if (result.isFinal) {
          transcript += t;
        } else {
          lastInterim = t;
        }
      }
      if (!transcript.trim() && lastInterim.trim() && isMobileDevice()) {
        transcript = lastInterim;
      }
      if (!transcript.trim()) return;
      const transcriptWords = tokenizeTranscript(transcript);
      if (!transcriptWords.length) {
        return;
      }

      const unchangedPrefixLength = getCommonPrefixLength(state.lastTranscriptWords, transcriptWords);
      const newWords = transcriptWords.slice(unchangedPrefixLength);
      state.lastTranscriptWords = transcriptWords;

      if (!newWords.length) {
        return;
      }

      processTranscript(newWords);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        stopListening();
        return;
      }
      if (event.error === "not-allowed") {
        renderMicStatus("error", "🚫 Mikrofoon geweier. Gee toestemming in browser.");
      } else if (event.error === "no-speech") {
        renderHearingStatus("🎤 Neem jou tyd... lees die volgende woord wanneer jy gereed is.");
        return;
      } else if (event.error === "no-match" && isMobileDevice()) {
        renderHearingStatus("🎤 Probeer weer... lees die woord hardop.");
        return;
      } else if (event.error === "network") {
        const networkMessage = isElectronRuntime()
          ? "⚠️ Spraakherkenning werk nie betroubaar in Cursor nie. Gebruik Chrome of Edge."
          : "⚠️ Browser spraakdiens is onbeskikbaar. Probeer Chrome of Edge.";
        renderMicStatus("error", networkMessage);
      } else {
        renderMicStatus("error", `⚠️ Fout: ${event.error}`);
      }

      stopListening();
    };

    recognition.onend = () => {
      if (!state.listening) {
        return;
      }

      const restart = () => {
        if (!state.listening || !state.recognition) return;
        try {
          recognition.start();
        } catch (error) {
          console.warn("Speech recognition restart failed:", error);
        }
      };

      if (isMobileDevice()) {
        setTimeout(restart, 250);
      } else {
        restart();
      }
    };

    state.recognition = recognition;
  },

  start() {
    this.ensureReady();
    if (!state.recognition) {
      return;
    }

    try {
      state.recognition.start();
    } catch (error) {
      console.warn("Speech recognition start failed:", error);
    }
  },

  stop() {
    if (!state.recognition) {
      return;
    }

    try {
      if (isMobileDevice()) {
        state.recognition.abort();
      } else {
        state.recognition.stop();
      }
    } catch (error) {
      console.warn("Speech recognition stop failed:", error);
    }
  },
};

function showDayContext(dayId) {
  const day = getHomeworkDay(state.unitIndex, dayId);
  const wrap = document.getElementById("dayContextWrap");
  const chip = document.getElementById("dayContextChip");
  const back = document.getElementById("dayContextBack");
  if (!day || !wrap || !chip || !back) return;
  chip.textContent = `${day.label} · ${day.labelEn}`;
  back.href = `./days.html?activity=lees&week=${state.unitIndex + 1}&day=${dayId}`;
  wrap.classList.remove("hidden");
}

async function init() {
  initUser();
  await initDB().catch(console.warn);

  const params = new URLSearchParams(window.location.search);
  const weekParam = params.get("week");
  if (weekParam) {
    const w = parseInt(weekParam, 10);
    if (w >= 1 && w <= CONTENT.length) {
      state.unitIndex = w - 1;
    }
  }
  const dayParam = params.get("day");
  if (dayParam) showDayContext(dayParam);

  state.completed = await loadCompletedForWeekWithSync(state.unitIndex);
  state.idbKeys = await ttsCache.keys().catch(() => new Set());

  bindEvents();
  renderStars();
  renderVoiceButtons();
  renderBreadcrumb();
  refreshUI();

  const stats = await fetchUserStats().catch(() => []);
  const completedRows = (stats || []).filter((r) => r.completed !== false);
  const totalDone = new Set(completedRows.map((r) => `${r.week}-${r.sentence_index}`)).size;
  const weeksWithCompletion = new Set(completedRows.map((r) => r.week));

  if (shouldShowWelcome()) {
    showWelcome({ totalDone, weeksWithCompletion });
  }
  beginSession();
}

function shouldShowWelcome() {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const navType = nav?.type ?? "navigate";
  const referrer = document.referrer || "";
  let fromInternalNav = false;
  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      const sameOrigin = refUrl.origin === window.location.origin;
      const path = refUrl.pathname || "";
      fromInternalNav = sameOrigin && path && !path.replace(/\/$/, "").endsWith("index.html");
    } catch (_) {}
  }
  return navType === "navigate" && !fromInternalNav;
}

async function beginSession() {
  if (state.session) {
    endSession(state.session.id).catch(console.warn);
  }
  state.session = await startSession({
    week: state.unitIndex + 1,
    subject: 'afrikaans',
  }).catch(() => null);
}

function bindBreadcrumbPicker() {
  const picker = els.breadcrumbPicker;
  if (!picker) return;

  function closeAllDropdowns() {
    picker.querySelectorAll(".breadcrumb-dropdown").forEach((d) => d.classList.add("hidden"));
    picker.querySelectorAll(".breadcrumb-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  picker.addEventListener("click", async (event) => {
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
      if (option.classList.contains("locked")) {
        alert("Locked");
        return;
      }

      const term = option.dataset.term;
      const weekIndex = option.dataset.weekIndex;
      const subject = option.dataset.subject;
      const activity = option.dataset.activity;

      if (term !== undefined) {
        const n = Number(term);
        if (n >= 2 && n <= 4) return;
        // Term 1 only for now
      }

      if (weekIndex !== undefined) {
        const index = Number(weekIndex);
        if (Number.isNaN(index) || index === state.unitIndex || index < 0 || index >= CONTENT.length) return;
        state.unitIndex = index;
        state.current = 0;
        state.completed = await loadCompletedForWeekWithSync(index);
        state.totals.correct = 0;
        state.totals.missed = 0;
        refreshUI();
        renderBreadcrumb();
        beginSession();
      }

      if (subject !== undefined) {
        if (subject === "english" || subject === "maths") return;
        // Afrikaans only for now
      }

      if (activity !== undefined) {
        if (activity === "spell") {
          window.location.href = "words.html";
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

function bindEvents() {
  if (els.breadcrumbPicker) {
    bindBreadcrumbPicker();
  }

  els.voiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setVoice(button.dataset.voice);
    });
  });

  els.prevBtn.addEventListener("click", () => navigate(-1));
  els.nextBtn.addEventListener("click", () => navigate(1));
  els.listenBtn.addEventListener("click", toggleListen);
  els.playSentenceBtn.addEventListener("click", playSentence);
  els.restartBtn.addEventListener("click", restart);

  if (els.feedbackBtn) {
    els.feedbackBtn.addEventListener("click", openFeedbackModal);
  }
  if (els.nameRequiredCancelBtn) {
    els.nameRequiredCancelBtn.addEventListener("click", closeNameRequiredModal);
  }
  if (els.nameRequiredContinueBtn) {
    els.nameRequiredContinueBtn.addEventListener("click", () => {
      const name = (els.nameRequiredInput?.value || "").trim();
      if (!name) return;
      setDisplayName(name);
      updateDisplayName(name).catch(() => {});
      closeNameRequiredModal();
      openFeedbackModal();
    });
  }
  if (els.nameRequiredModal?.querySelector(".feedback-modal-backdrop")) {
    els.nameRequiredModal.querySelector(".feedback-modal-backdrop").addEventListener("click", closeNameRequiredModal);
  }
  els.nameRequiredInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      els.nameRequiredContinueBtn?.click();
    }
  });
  if (els.feedbackCancelBtn) {
    els.feedbackCancelBtn.addEventListener("click", closeFeedbackModal);
  }
  if (els.feedbackSubmitBtn) {
    els.feedbackSubmitBtn.addEventListener("click", () => submitFeedbackForm());
  }
  if (els.feedbackModal?.querySelector(".feedback-modal-backdrop")) {
    els.feedbackModal.querySelector(".feedback-modal-backdrop").addEventListener("click", closeFeedbackModal);
  }

  if (els.debugBtn) els.debugBtn.addEventListener("click", openDebugModal);
  if (els.debugCloseBtn) els.debugCloseBtn.addEventListener("click", closeDebugModal);
  if (els.debugModal?.querySelector(".version-modal-backdrop")) {
    els.debugModal.querySelector(".version-modal-backdrop").addEventListener("click", closeDebugModal);
  }

  if (els.micRepromptBtn) els.micRepromptBtn.addEventListener("click", repromptMicPermission);

  document.addEventListener("keydown", handleKeydown);
}

async function repromptMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showDebugMicStatus("error", "🚫 Mikrofoon nie ondersteun nie.");
    return;
  }
  if (els.debugMicStatus) {
    els.debugMicStatus.textContent = "Checking…";
    els.debugMicStatus.classList.remove("hidden");
    els.debugMicStatus.className = "version-modal-status";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    showDebugMicStatus("success", "✅ Mikrofoon toegestaan.");
    renderMicStatus("idle", "✅ Mikrofoon toegestaan. Tik Begin Lees!");
  } catch (err) {
    showDebugMicStatus("error", "🚫 Mikrofoon geweier. Gee toestemming in browser.");
    renderMicStatus("error", "🚫 Mikrofoon geweier. Gee toestemming in browser.");
  }
}

function showDebugMicStatus(kind, message) {
  if (!els.debugMicStatus) return;
  els.debugMicStatus.textContent = message;
  els.debugMicStatus.classList.remove("hidden", "success", "error");
  els.debugMicStatus.classList.add(kind === "success" ? "success" : "error");
}

function openDebugModal() {
  if (!els.debugModal || !els.debugModalBody) return;
  els.debugModalBody.innerHTML = `<p><strong>Build:</strong> ${BUILD_INFO.version}</p><p>${BUILD_INFO.note}</p><details class="debug-troubleshoot"><summary>Troubleshooting</summary><ul><li><strong>Profile / Set name not working?</strong> Clear your browser cache (or hard refresh: Ctrl+Shift+R / Cmd+Shift+R). Stale cache can block updates.</li><li><strong>Mic not working?</strong> Use the Re-prompt mic button above. Ensure you're on HTTPS (e.g. GitHub Pages or ngrok).</li><li><strong>Feedback won't send?</strong> Check the console (F12) for errors. Run <code>supabase/03_feedback_fix.sql</code> in Supabase SQL Editor if needed. See docs/FEEDBACK_TROUBLESHOOTING.md.</li></ul></details>`;
  if (els.debugMicStatus) {
    els.debugMicStatus.textContent = "";
    els.debugMicStatus.classList.add("hidden");
  }
  els.debugModal.classList.remove("hidden");
}

function closeDebugModal() {
  if (!els.debugModal) return;
  els.debugModal.classList.add("hidden");
}

function hasDisplayName() {
  const name = (getUser()?.displayName || "").trim();
  return name.length > 0;
}

function showWelcome(opts = {}) {
  const { totalDone = 0, weeksWithCompletion = new Set() } = opts;
  const overlay = document.getElementById("welcomeOverlay");
  const banner = document.getElementById("welcomeBanner");
  const starsRow = document.getElementById("welcomeStarsRow");
  const title = document.getElementById("welcomeTitle");
  const sub = document.getElementById("welcomeSub");
  const weekDots = document.getElementById("welcomeWeekDots");
  const nameWrap = document.getElementById("welcomeNameWrap");
  const continueBtn = document.getElementById("welcomeContinueBtn");
  const pickWeekBtn = document.getElementById("welcomePickWeekBtn");

  if (!overlay || !title || !sub || !continueBtn) return;

  const user = getUser();
  const isNew = user?.isNew ?? true;
  const nameKnown = hasDisplayName();
  const starCount = state.completed?.size ?? 0;
  const weekNum = state.unitIndex + 1;
  const unit = getCurrentUnit();

  const dismiss = () => {
    const inp = document.getElementById("welcomeNameInput");
    const name = (inp?.value || "").trim().slice(0, 32);
    if (name) {
      setDisplayName(name);
      updateDisplayName(name).catch(console.warn);
    }
    overlay.classList.add("hidden");
  };

  if (isNew) {
    if (banner) banner.classList.add("hidden");
    if (starsRow) starsRow.classList.add("hidden");
    if (weekDots) weekDots.classList.add("hidden");
    if (pickWeekBtn) pickWeekBtn.classList.add("hidden");
    title.textContent = "Welcome to LekkeLeer! 📖";
    sub.textContent = "Read Afrikaans sentences aloud and watch words turn green as you go. What should we call you?";
    nameWrap?.classList.remove("hidden");
    const inp = document.getElementById("welcomeNameInput");
    if (inp) {
      inp.value = "";
      setTimeout(() => inp.focus(), 100);
    }
    continueBtn.textContent = "Get started";
  } else {
    if (banner) {
      banner.textContent = `Week ${weekNum} • ${totalDone} sentences done`;
      banner.classList.remove("hidden");
    }
    if (starsRow) {
      let starsHtml = "";
      for (let i = 0; i < 7; i++) {
        starsHtml += state.completed?.has(i) ? '<span class="welcome-star earned">★</span>' : '<span class="welcome-star">☆</span>';
      }
      starsRow.innerHTML = starsHtml;
      starsRow.classList.remove("hidden");
    }
    if (weekDots) {
      let dotsHtml = "";
      for (let w = 1; w <= 8; w++) {
        const filled = weeksWithCompletion.has(w);
        dotsHtml += `<span class="welcome-week-dot ${filled ? "filled" : ""}"></span>`;
      }
      weekDots.innerHTML = dotsHtml;
      weekDots.classList.remove("hidden");
    }
    if (pickWeekBtn) pickWeekBtn.classList.remove("hidden");

    if (nameKnown) {
      title.textContent = `Welcome back, ${(user.displayName || "").trim()}!`;
      sub.innerHTML = `You left off on Week ${weekNum}.<br>Ready to keep going?`;
      nameWrap?.classList.add("hidden");
      continueBtn.textContent = `Continue Week ${weekNum}`;
      setTimeout(() => continueBtn.focus(), 100);
    } else {
      title.textContent = "Welcome back!";
      sub.innerHTML = `You left off on Week ${weekNum}.<br>Add your name to personalize your progress.`;
      nameWrap?.classList.remove("hidden");
      const inp = document.getElementById("welcomeNameInput");
      if (inp) {
        inp.value = "";
        setTimeout(() => inp.focus(), 100);
      }
      continueBtn.textContent = `Continue Week ${weekNum}`;
    }
  }

  overlay.classList.remove("hidden");

  continueBtn.onclick = dismiss;
  if (pickWeekBtn) pickWeekBtn.onclick = dismiss;
  overlay.querySelector(".welcome-backdrop")?.addEventListener("click", dismiss);
  document.getElementById("welcomeNameInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") dismiss();
  });
}

function openFeedbackModal() {
  const name = (getUser()?.displayName || "").trim();
  if (!name) {
    openNameRequiredModal();
    return;
  }
  if (!els.feedbackModal) return;
  els.feedbackModal.classList.remove("hidden");
  els.feedbackInput?.focus();
  if (els.feedbackInput) els.feedbackInput.value = "";
  if (els.feedbackStatus) {
    els.feedbackStatus.textContent = "";
    els.feedbackStatus.className = "feedback-modal-status hidden";
  }
}

function openNameRequiredModal() {
  if (!els.nameRequiredModal) return;
  els.nameRequiredModal.classList.remove("hidden");
  if (els.nameRequiredInput) {
    els.nameRequiredInput.value = "";
    els.nameRequiredInput.focus();
  }
}

function closeNameRequiredModal() {
  if (!els.nameRequiredModal) return;
  els.nameRequiredModal.classList.add("hidden");
}

function closeFeedbackModal() {
  if (!els.feedbackModal) return;
  els.feedbackModal.classList.add("hidden");
}

async function submitFeedbackForm() {
  const msg = els.feedbackInput?.value?.trim() || "";
  if (!msg) return;
  if (!(getUser()?.displayName || "").trim()) {
    if (els.feedbackStatus) {
      els.feedbackStatus.classList.remove("hidden");
      els.feedbackStatus.className = "feedback-modal-status error";
      els.feedbackStatus.textContent = "Please set your name first.";
    }
    return;
  }
  if (els.feedbackSubmitBtn) els.feedbackSubmitBtn.disabled = true;
  const result = await submitFeedback(msg);
  if (els.feedbackSubmitBtn) els.feedbackSubmitBtn.disabled = false;
  if (els.feedbackStatus) {
    els.feedbackStatus.classList.remove("hidden");
    els.feedbackStatus.className = "feedback-modal-status " + (result.ok ? "success" : "error");
    els.feedbackStatus.textContent = result.ok
      ? "Thank you!"
      : "Could not send." + (result.hint || " Try again.");
  }
  if (result.ok && els.feedbackInput) {
    els.feedbackInput.value = "";
    setTimeout(closeFeedbackModal, 1200);
  }
}

function getCurrentUnit() {
  return CONTENT[state.unitIndex] || CONTENT[0];
}

function getCurrentSentences() {
  return getCurrentUnit().sentences;
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    const welcome = document.getElementById("welcomeOverlay");
    if (welcome && !welcome.classList.contains("hidden")) {
      document.getElementById("welcomeContinueBtn")?.click();
      return;
    }
    if (els.nameRequiredModal && !els.nameRequiredModal.classList.contains("hidden")) {
      closeNameRequiredModal();
      return;
    }
    if (els.feedbackModal && !els.feedbackModal.classList.contains("hidden")) {
      closeFeedbackModal();
      return;
    }
    if (els.debugModal && !els.debugModal.classList.contains("hidden")) {
      closeDebugModal();
      return;
    }
  }
  if (els.celebration.classList.contains("show")) {
    return;
  }
}

function getCurrentSentence() {
  return getCurrentSentences()[state.current];
}

function getWordSpans() {
  return Array.from(els.sentenceText.querySelectorAll(".word-span"));
}

function setVoice(name) {
  state.currentVoice = name;
  renderVoiceButtons();
  warmSentenceAudio(getCurrentSentence().af.split(" "));
}

function renderVoiceButtons() {
  els.voiceButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.voice === state.currentVoice);
  });
}

function refreshUI() {
  resetSentenceProgress();
  stopListening();
  speechSynthesisService.stop();
  renderSentence();
  renderUnitLabel();
  renderBreadcrumb();
  renderMicStatus("idle", hasSpeechRecognition ? "🎤 Gereed — tik Begin Lees!" : "Gebruik Chrome vir spraakherkenning");
  renderScoreChip();
  renderProgressDots();
}

function renderSentence() {
  const sentence = getCurrentSentence();
  const words = sentence.af.split(" ");

  els.sentenceEmoji.textContent = sentence.emoji;
  els.sentenceNum.textContent = `${state.current + 1} / ${getCurrentSentences().length}`;
  els.translation.textContent = state.completed.has(state.current) ? sentence.en : "";
  els.sentenceText.replaceChildren();

  const isCompleted = state.completed.has(state.current);
  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = isCompleted ? "word-span correct" : "word-span";
    span.textContent = word;
    span.dataset.index = String(index);
    span.dataset.word = normalizeWord(word);
    const spoken = ttsWord(word);
    span.addEventListener("click", () => speakWord(spoken, span));
    els.sentenceText.appendChild(span);
  });

  warmSentenceAudio(words);
}

function renderUnitLabel() {
  const unit = getCurrentUnit();
  if (!els.unitLabel || !unit) {
    return;
  }

  els.unitLabel.textContent = `Term ${unit.term} · Week ${unit.week}`;
}

function renderBreadcrumb() {
  if (!els.breadcrumbPicker) return;

  const triggers = els.breadcrumbPicker.querySelectorAll(".breadcrumb-trigger");
  triggers.forEach((trigger) => {
    const picker = trigger.dataset.picker;
    if (picker === "term") trigger.textContent = "Term 1";
    if (picker === "week") trigger.textContent = `Week ${state.unitIndex + 1}`;
    if (picker === "subject") trigger.textContent = "Afrikaans";
    if (picker === "activity") trigger.textContent = "Lees saam";
  });
}

function renderMicStatus(status, message) {
  els.micStatus.className = `mic-status ${status}`;

  if (status === "hearing") {
    const wave = document.createElement("div");
    wave.className = "wave";
    for (let index = 0; index < 5; index += 1) {
      const bar = document.createElement("div");
      bar.className = "wave-bar";
      wave.appendChild(bar);
    }

    const label = document.createElement("span");
    label.textContent = message || "Hoor jou...";
    els.micStatus.replaceChildren(wave, label);
    return;
  }

  const dot = document.createElement("div");
  dot.className = "mic-dot";
  const label = document.createElement("span");
  label.textContent = message;
  els.micStatus.replaceChildren(dot, label);
}

function renderHearingStatus(message = "Hoor jou...") {
  const existingWave = els.micStatus.querySelector(".wave");
  const existingLabel = els.micStatus.querySelector("span");

  if (!existingWave || !existingLabel || !els.micStatus.classList.contains("hearing")) {
    renderMicStatus("hearing", message);
    return;
  }

  existingLabel.textContent = message;
}

function renderScoreChip() {
  els.scoreChip.classList.remove("hidden");
  els.scoreCorrect.textContent = String(state.sentence.correct);
  els.scoreSupport.textContent =
    state.sentence.correct > 0 ? "Mooi so!" : "Hou aan!";
}

function renderStars() {
  els.starsBar.replaceChildren();

  const sentences = getCurrentSentences();
  for (let index = 0; index < sentences.length; index += 1) {
    const star = document.createElement("span");
    star.className = "star";
    if (state.completed.has(index)) {
      star.classList.add("earned");
    }
    star.textContent = "⭐";
    els.starsBar.appendChild(star);
  }
}

function isSentenceCached(sentence) {
  const words = sentence.af.split(" ");
  const keys = [
    speechSynthesisService.buildCacheKey(sentence.af, 0.85),
    speechSynthesisService.buildCacheKey(sentence.af, 0.9),
    ...words.map((w) => speechSynthesisService.buildCacheKey(ttsWord(w), 0.85)),
  ];
  return keys.every((k) => state.ttsCache.has(k) || state.idbKeys.has(k));
}

function renderProgressDots() {
  els.progressDots.replaceChildren();

  const sentences = getCurrentSentences();
  sentences.forEach((sentence, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.classList.toggle("current", index === state.current);
    dot.classList.toggle("done2", state.completed.has(index));

    const cached = index === state.current || isSentenceCached(sentence);
    if (!cached) {
      dot.classList.add("locked");
      dot.disabled = true;
    }

    dot.addEventListener("click", () => {
      state.current = index;
      refreshUI();
    });
    els.progressDots.appendChild(dot);
  });
}

function resetSentenceProgress() {
  state.wordIndex = 0;
  state.expectedWord = 0;
  state.lastTranscriptWords = [];
  state.sentence.correct = 0;
  state.sentence.missed = 0;
  clearPendingSentenceCompletion();
}

let preloadGeneration = 0;

function warmSentenceAudio(words) {
  preloadGeneration++;
  const sentence = getCurrentSentence();
  const alreadyCached = isSentenceCached(sentence);

  if (!alreadyCached) {
    state.ttsReady = false;
    applyTtsReadyState();
  }

  const promises = [
    speechSynthesisService.getOrCreateAudioUrl(sentence.af, 0.85).catch(() => {}),
    speechSynthesisService.getOrCreateAudioUrl(sentence.af, 0.9).catch(() => {}),
    ...words.map((word) =>
      speechSynthesisService.getOrCreateAudioUrl(ttsWord(word), 0.85).catch(() => {})
    ),
  ];

  const gen = preloadGeneration;
  Promise.all(promises).then(() => {
    if (gen !== preloadGeneration) return;
    state.ttsReady = true;
    applyTtsReadyState();
    preloadWeekAudio(gen);
  });
}

function preloadWeekAudio(gen) {
  const sentences = getCurrentSentences();
  const currentIdx = state.current;
  const total = sentences.length;

  const order = [];
  for (let offset = 1; offset < total; offset++) {
    order.push((currentIdx + offset) % total);
  }

  let chain = Promise.resolve();
  order.forEach((idx) => {
    chain = chain.then(() => {
      if (gen !== preloadGeneration) return;
      const sentence = sentences[idx];
      const words = sentence.af.split(" ");
      const batch = [
        speechSynthesisService.getOrCreateAudioUrl(sentence.af, 0.85).catch(() => {}),
        speechSynthesisService.getOrCreateAudioUrl(sentence.af, 0.9).catch(() => {}),
        ...words.map((w) =>
          speechSynthesisService.getOrCreateAudioUrl(ttsWord(w), 0.85).catch(() => {})
        ),
      ];
      return Promise.all(batch).then(() => {
        if (gen === preloadGeneration) renderProgressDots();
      });
    });
  });
}

function applyTtsReadyState() {
  const loading = !state.ttsReady;
  els.mainCard.classList.toggle("tts-loading", loading);
  els.playSentenceBtn.disabled = loading;
  els.listenBtn.disabled = loading;

  getWordSpans().forEach((span, i) => {
    span.style.animationDelay = loading ? `${i * 0.15}s` : "";
  });
}

function clearPendingSentenceCompletion() {
  if (state.pendingSentenceCompletion) {
    clearTimeout(state.pendingSentenceCompletion);
    state.pendingSentenceCompletion = null;
  }
}

function clearWordHighlightTimers() {
  state.wordHighlightTimers.forEach((timer) => clearTimeout(timer));
  state.wordHighlightTimers = [];
}

function stopInputMeter() {
  if (!state.inputMeter) {
    return;
  }

  if (state.inputMeter.frameId) {
    cancelAnimationFrame(state.inputMeter.frameId);
  }

  if (state.inputMeter.stream) {
    state.inputMeter.stream.getTracks().forEach((track) => track.stop());
  }

  if (state.inputMeter.source) {
    state.inputMeter.source.disconnect();
  }

  if (state.inputMeter.analyser) {
    state.inputMeter.analyser.disconnect();
  }

  if (state.inputMeter.audioContext && state.inputMeter.audioContext.state !== "closed") {
    state.inputMeter.audioContext.close().catch(() => {});
  }

  state.inputMeter = null;
}

function updateInputMeter() {
  if (!state.inputMeter) {
    return;
  }

  const { analyser, dataArray } = state.inputMeter;
  analyser.getByteTimeDomainData(dataArray);

  let total = 0;
  for (const value of dataArray) {
    const normalized = (value - 128) / 128;
    total += normalized * normalized;
  }

  const rms = Math.sqrt(total / dataArray.length);
  const level = Math.min(1, rms * 5);
  const multipliers = [0.45, 0.75, 1, 0.75, 0.45];
  const bars = els.micStatus.querySelectorAll(".wave-bar");

  bars.forEach((bar, index) => {
    const scale = 0.16 + level * multipliers[index];
    bar.style.transform = `scaleY(${scale})`;
    bar.style.opacity = String(0.35 + level * 0.65);
  });

  state.inputMeter.frameId = requestAnimationFrame(updateInputMeter);
}

async function startInputMeter() {
  stopInputMeter();

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextCtor) {
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!state.listening) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const audioContext = new AudioContextCtor();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    state.inputMeter = {
      audioContext,
      analyser,
      source,
      stream,
      dataArray: new Uint8Array(analyser.frequencyBinCount),
      frameId: null,
    };

    updateInputMeter();
  } catch (error) {
    console.warn("Mic level meter unavailable:", error);
  }
}

function normalizeWord(word) {
  return word
    .normalize("NFKD")
    .replace(/['’`"]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()
    .trim();
}

// Strip leading/trailing punctuation for TTS so "sit." → "sit", keeping mid-word apostrophes
function ttsWord(word) {
  return word.replace(/^[^\w']+|[^\w']+$/g, "");
}

function tokenizeTranscript(transcript) {
  return transcript
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function getCommonPrefixLength(previousWords, nextWords) {
  const maxLength = Math.min(previousWords.length, nextWords.length);
  let index = 0;

  while (index < maxLength && previousWords[index] === nextWords[index]) {
    index += 1;
  }

  return index;
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => {
      if (rowIndex === 0) {
        return colIndex;
      }
      if (colIndex === 0) {
        return rowIndex;
      }
      return 0;
    })
  );

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      matrix[row][col] =
        a[row - 1] === b[col - 1]
          ? matrix[row - 1][col - 1]
          : 1 + Math.min(matrix[row - 1][col], matrix[row][col - 1], matrix[row - 1][col - 1]);
    }
  }

  return matrix[a.length][b.length];
}

function fuzzyMatch(spoken, expected) {
  if (spoken === expected) {
    return true;
  }

  return levenshtein(spoken, expected) <= (expected.length <= 3 ? 1 : 2);
}

function toggleListen() {
  if (!hasSpeechRecognition) {
    renderMicStatus("error", "😔 Gebruik Chrome op Android vir spraakherkenning.");
    return;
  }

  if (!window.isSecureContext && isMobileDevice()) {
    renderMicStatus("error", "🔒 Gebruik HTTPS (bv. ngrok URL). Mikrofoon werk nie op HTTP nie.");
    return;
  }

  if (state.listening) {
    stopListening();
    return;
  }

  startListening();
}

function startListening() {
  state.listenStartTime = Date.now();
  stopSentencePlayback();
  recognitionService.ensureReady();
  speechSynthesisService.stop();
  resetSentenceProgress();
  state.listening = true;

  getWordSpans().forEach((span, index) => {
    span.className = `word-span ${index === 0 ? "active" : "pending"}`;
  });

  els.translation.textContent = "";
  els.mainCard.classList.add("listening");
  els.listenBtn.classList.add("active");
  els.listenIcon.textContent = "⏹";
  els.listenLabel.textContent = "Stop";
  els.playSentenceBtn.disabled = true;
  renderScoreChip();
  renderHearingStatus("🎤 Luister... Lees die sin hardop!");
  if (!isMobileDevice()) {
    startInputMeter();
  }
  recognitionService.start();
}

function stopListening() {
  state.listening = false;
  stopInputMeter();
  recognitionService.stop();
  els.mainCard.classList.remove("listening");
  els.listenBtn.classList.remove("active");
  els.listenIcon.textContent = "🎤";
  els.listenLabel.textContent = "Begin Lees";
  els.playSentenceBtn.disabled = false;
  getWordSpans().forEach((s) => { s.className = "word-span"; });
}

function processTranscript(spokenWords) {
  const spans = getWordSpans();
  const expectedWords = getCurrentSentence().af.split(" ").map(normalizeWord);

  spokenWords.forEach((spokenWord) => {
    if (state.expectedWord >= expectedWords.length) {
      return;
    }

    const index = state.expectedWord;
    if (!fuzzyMatch(spokenWord, expectedWords[index])) {
      return;
    }

    spans[index].className = "word-span correct";
    state.sentence.correct += 1;
    state.totals.correct += 1;
    state.expectedWord = index + 1;

    if (state.expectedWord < spans.length) {
      spans[state.expectedWord].className = "word-span active";
    } else {
      scheduleSentenceCompletion();
    }

    renderScoreChip();
  });

  renderHearingStatus("Hoor jou...");
}

function scheduleSentenceCompletion() {
  clearPendingSentenceCompletion();
  state.pendingSentenceCompletion = window.setTimeout(() => {
    state.pendingSentenceCompletion = null;
    sentenceComplete();
  }, 400);
}

async function sentenceComplete() {
  const durationSecs = state.listenStartTime
    ? (Date.now() - state.listenStartTime) / 1000
    : 0;
  const totalWords = getCurrentSentence().af.split(" ").length;

  stopListening();
  const sentence = getCurrentSentence();
  els.translation.textContent = sentence.en;

  awardStar();
  renderMicStatus("idle", "✅ Uitstekend! Luister weer na die sin.");

  if (state.session) {
    recordSentenceResult({
      sessionId: state.session.id,
      week: state.unitIndex + 1,
      sentenceIndex: state.current,
      mode: 'listen',
      correctWords: totalWords,
      totalWords,
      completed: true,
      durationSecs,
    }).catch(console.warn);
  }

  try {
    await speechSynthesisService.speak(sentence.af, 0.9);
  } catch (error) {
    // If TTS fails, still move on.
  }

  const isLast = state.current >= getCurrentSentences().length - 1;
  if (!isLast) {
    navigate(1);
  }
}

function stopSentencePlayback() {
  if (state.karaokeCancel) {
    state.karaokeCancel();
    state.karaokeCancel = null;
  }
  if (state.playingSentence) {
    state.playingSentence = false;
    getWordSpans().forEach((s) => s.classList.remove("tts-active"));
    els.playSentenceBtn.disabled = false;
    els.listenBtn.disabled = false;
  }
}

async function playSentence() {
  const sentence = getCurrentSentence();
  if (!sentence) return;

  if (state.listening) {
    toggleListen();
  }
  stopSentencePlayback();

  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }

  const spans = getWordSpans();
  spans.forEach((s) => { s.className = "word-span"; });
  state.playingSentence = true;
  els.playSentenceBtn.disabled = true;
  els.listenBtn.disabled = true;

  try {
    const rate = 0.9;
    const url = await speechSynthesisService.getOrCreateAudioUrl(sentence.af, rate);
    const key = speechSynthesisService.buildCacheKey(sentence.af, rate);
    const timings = state.ttsTimings.get(key) || [];

    await playWithKaraokeHighlight(url, timings, spans);
  } catch (_) {
    // ignore TTS errors or cancellation
  }

  state.playingSentence = false;
  state.karaokeCancel = null;
  spans.forEach((s) => s.classList.remove("tts-active"));
  els.playSentenceBtn.disabled = false;
  els.listenBtn.disabled = false;
}

function playWithKaraokeHighlight(url, timings, spans) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    state.currentAudio = audio;
    let activeIndex = -1;
    let cancelled = false;

    state.karaokeCancel = () => {
      cancelled = true;
      audio.pause();
      audio.currentTime = 0;
      if (state.currentAudio === audio) state.currentAudio = null;
      resolve();
    };

    function tick() {
      if (cancelled || audio.ended) return;
      if (audio.paused && audio.currentTime === 0) return;

      const t = audio.currentTime;
      let newIndex = -1;
      for (let i = timings.length - 1; i >= 0; i--) {
        if (t >= timings[i].offset) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== activeIndex) {
        if (activeIndex >= 0 && activeIndex < spans.length) {
          spans[activeIndex].classList.remove("tts-active");
        }
        if (newIndex >= 0 && newIndex < spans.length) {
          spans[newIndex].classList.add("tts-active");
        }
        activeIndex = newIndex;
      }

      requestAnimationFrame(tick);
    }

    audio.onplay = () => requestAnimationFrame(tick);

    audio.onended = () => {
      if (state.currentAudio === audio) state.currentAudio = null;
      resolve();
    };

    audio.onerror = () => {
      if (state.currentAudio === audio) state.currentAudio = null;
      reject(new Error("Audio playback failed"));
    };

    audio.play().catch(reject);
  });
}

async function speakWord(word, span) {
  if (state.playingSentence) {
    stopSentencePlayback();
  }

  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }

  getWordSpans().forEach((wordSpan) => {
    wordSpan.className = "word-span";
  });

  span.classList.add("active");

  try {
    await speechSynthesisService.speak(word, 0.85);
  } catch (error) {
    return;
  }

  span.classList.remove("active");
}

function navigate(direction) {
  const nextIndex = state.current + direction;
  if (nextIndex < 0 || nextIndex >= getCurrentSentences().length) {
    return;
  }

  state.current = nextIndex;
  refreshUI();
}

function awardStar() {
  if (state.completed.has(state.current)) {
    return;
  }

  state.completed.add(state.current);
  saveCompletedForWeek();
  renderStars();
  renderProgressDots();

  if (state.completed.size === getCurrentSentences().length) {
    window.setTimeout(showCelebration, 900);
  }
}

function showCelebration() {
  confetti(70);

  const totalAttempts = state.totals.correct + state.totals.missed;
  const percentage = totalAttempts ? Math.round((state.totals.correct / totalAttempts) * 100) : 0;

  els.finalCorrect.textContent = String(state.totals.correct);
  els.finalMissed.textContent = String(state.totals.missed);
  els.finalPct.textContent = `${percentage}%`;

  [els.mainCard, els.controls, els.progressDots, els.micStatus, els.scoreChip].forEach((element) => {
    element.classList.add("hidden");
  });
  els.celebration.classList.add("show");
}

function restart() {
  state.current = 0;
  state.completed.clear();
  saveCompletedForWeek();
  state.totals.correct = 0;
  state.totals.missed = 0;
  resetSentenceProgress();
  stopListening();
  speechSynthesisService.stop();

  [els.mainCard, els.controls, els.progressDots, els.micStatus].forEach((element) => {
    element.classList.remove("hidden");
  });
  els.celebration.classList.remove("show");

  renderStars();
  refreshUI();
}

function confetti(count) {
  const colors = ["#ffd93d", "#3b9ed4", "#2ecc71", "#ff6b9d", "#ff8c42", "#9b59b6"];

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-p";
    piece.style.cssText = [
      `left:${Math.random() * 100}vw`,
      "top:-10px",
      `width:${6 + Math.random() * 8}px`,
      `height:${6 + Math.random() * 8}px`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-duration:${1.5 + Math.random() * 2}s`,
      `animation-delay:${Math.random() * 0.8}s`,
    ].join(";");
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

/** Estimate word timings for karaoke (REST API has no word boundaries). */
async function estimateWordTimings(blob, text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return new Promise((resolve) => {
    const audio = new Audio();
    const blobUrl = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const duration = audio.duration || 0;
      const timings = words.map((word, i) => ({
        offset: (duration * i) / words.length,
        text: word,
      }));
      resolve(timings);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(words.map((word, i) => ({ offset: i, text: word })));
    };
    audio.src = blobUrl;
  });
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("beforeunload", () => {
  if (state.session) {
    endSession(state.session.id).catch(() => {});
  }
});
