import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEES_WEEKS, type LeesSentence } from '@/lib/content/leesContent';
import type { VoiceName } from '@/lib/config';
import { loadLeesCompleted, saveLeesCompleted } from '@/lib/progressStorage';
import { AzureLiveSpeechSession } from '@/lib/azureLiveSpeech';
import {
  createAzureTranscriptProcessor,
  fuzzyMatch,
  normalizeWord,
  tokenizeTranscript,
  ttsWord,
} from '@/lib/textUtils';
import { ttsService } from '@/lib/ttsService';

export type WordState = 'default' | 'pending' | 'active' | 'correct' | 'karaoke';

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, ' ').slice(0, 70);
}

export function useLeesSaam(weekIndex: number) {
  const week = LEES_WEEKS[weekIndex] ?? LEES_WEEKS[0];
  const sentences = week.sentences;

  const [current, setCurrent] = useState(0);
  const [voice, setVoice] = useState<VoiceName>('Adri');
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [ttsReady, setTtsReady] = useState(false);
  const [ttsStatus, setTtsStatus] = useState<'ok' | 'busy' | 'error'>('ok');
  const [ttsStatusText, setTtsStatusText] = useState('✅ Ready');
  const [listening, setListening] = useState(false);
  // True only while we are fetching the token / opening the Azure socket — before the mic is
  // actually live. The UI shows pulsing dots (not a "Koppel aan Azure" string) during this phase.
  const [connecting, setConnecting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [micMessage, setMicMessage] = useState('🎤 Gereed — tik Begin Lees!');
  const [scoreCorrect, setScoreCorrect] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);

  const expectedWordRef = useRef(0);
  // Read position confirmed by Azure FINAL (stable) results only. The sentence is treated as
  // "read in full" — and the green only fades — once finals have sequentially covered every word.
  // Partial hypotheses (which the phrase-list bias can autocomplete past the child) drive the live
  // highlight but can NOT complete the sentence, so the green never fades before the child finishes.
  const finalizedWordRef = useRef(0);
  const transcriptProcessorRef = useRef(createAzureTranscriptProcessor());
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Delays fading the green highlight back to default until ~1s AFTER the completion read-back.
  const greenFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningRef = useRef(false);
  const finishSentenceRef = useRef<() => Promise<void>>(async () => {});
  const speechSessionRef = useRef<AzureLiveSpeechSession | null>(null);
  // Synchronous guards so rapid taps / async state can't let two audio processes overlap.
  // `listeningRef` covers the mic; `ttsBusyRef` covers any TTS playback (word, sentence,
  // completion replay); `currentRef` lets a finishing playback know if the user has since moved on.
  const ttsBusyRef = useRef(false);
  const currentRef = useRef(0);

  const sentence: LeesSentence = sentences[current] ?? sentences[0];
  const words = useMemo(() => sentence.af.split(' '), [sentence.af]);

  const refreshWordStates = useCallback(
    (listeningMode: boolean, expected = 0) => {
      // Correctness green is NOT persisted for completed sentences — it only lives during a
      // Begin Lees pass and then fades back to default (so a sentence can be re-read and the
      // highlight loops back in). We still surface the translation on a completed sentence.
      setShowTranslation(completed.has(current) && !listeningMode);
      setWordStates(
        words.map((_, i) => {
          if (listeningMode) {
            if (i < expected) return 'correct';
            if (i === expected) return 'active';
            // Upcoming words are greyed out so the one to read next clearly stands out.
            return 'pending';
          }
          return 'default';
        }),
      );
    },
    [completed, current, words],
  );

  useEffect(() => {
    loadLeesCompleted(weekIndex).then(setCompleted);
    ttsService.configureAudio().catch(() => {});
  }, [weekIndex]);

  useEffect(() => {
    currentRef.current = current;
    // A sentence change must never carry over a pending auto-completion (P2) or a pending
    // green-fade from the previous sentence's read-back.
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    if (greenFadeRef.current) {
      clearTimeout(greenFadeRef.current);
      greenFadeRef.current = null;
    }
    setConnecting(false);
    expectedWordRef.current = 0;
    finalizedWordRef.current = 0;
    transcriptProcessorRef.current.reset();
    setScoreCorrect(0);
    refreshWordStates(false);
    setMicMessage('🎤 Gereed — tik Begin Lees!');
  }, [current, weekIndex, refreshWordStates]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const preloadCurrent = () =>
      Promise.allSettled([
        ttsService.getUri(sentence.af, voice, 0.9),
        ttsService.getUri(sentence.af, voice, 0.85),
        ...words.map((w) => ttsService.getUri(ttsWord(w), voice, 0.85)),
      ]);

    // Warm the rest of the week in the background (sequential, low priority) so navigating to
    // the next sentence — or replaying it — is instant. Mirrors the web app's week preloader.
    const preloadWeekAhead = async () => {
      for (let offset = 1; offset < sentences.length && !cancelled; offset += 1) {
        const next = sentences[(current + offset) % sentences.length];
        const nextWords = next.af.split(' ');
        await Promise.allSettled([
          ttsService.getUri(next.af, voice, 0.9),
          ttsService.getUri(next.af, voice, 0.85),
          ...nextWords.map((w) => ttsService.getUri(ttsWord(w), voice, 0.85)),
        ]);
      }
    };

    const run = (isRetry: boolean) => {
      setTtsReady(false);
      setTtsStatus('busy');
      setTtsStatusText('Laai klank…');
      preloadCurrent().then((results) => {
        if (cancelled) return;
        const ok = results.some((r) => r.status === 'fulfilled');
        const failure = results.find((r) => r.status === 'rejected');
        setTtsReady(ok);
        setTtsStatus(ok ? 'ok' : 'error');
        setTtsStatusText(ok ? '✅ Ready' : `⚠️ Verbinding fout: ${shortError(failure?.reason)}`);
        if (ok) {
          void preloadWeekAhead();
        } else if (!isRetry) {
          // One automatic retry — a transient network blip shouldn't leave the card stuck.
          retryTimer = setTimeout(() => run(true), 1500);
        }
      });
    };

    run(false);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [sentence.af, voice, words, sentences, current]);

  const stopListening = useCallback(async () => {
    // Cancel any pending auto-completion so it can't mark a sentence the user is
    // leaving (or a freshly displayed one) as complete (P2).
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    listeningRef.current = false;
    setListening(false);
    setConnecting(false);
    const session = speechSessionRef.current;
    speechSessionRef.current = null;
    if (session) await session.stop().catch(() => {});
    refreshWordStates(false);
    setMicMessage('🎤 Gereed — tik Begin Lees!');
  }, [refreshWordStates]);

  const finishSentence = useCallback(async () => {
    await stopListening();
    setShowTranslation(true);
    setWordStates(words.map(() => 'correct'));

    const isLast = current >= sentences.length - 1;
    const allDone = (completed.has(current) ? completed.size : completed.size + 1) === sentences.length;

    setCompleted((prev) => {
      if (prev.has(current)) return prev;
      const next = new Set(prev);
      next.add(current);
      saveLeesCompleted(weekIndex, next);
      if (next.size === sentences.length) {
        setTimeout(() => setShowCelebration(true), 600);
      }
      return next;
    });

    setMicMessage('✅ Mooi gelees!');
    // Replay the sentence back to the child. Mark TTS busy so a word/Speel tap can't
    // overlap it — the mic has already been released above (P1 mutex serializes the handoff).
    ttsBusyRef.current = true;
    try {
      setTtsStatus('busy');
      await ttsService.speak(sentence.af, voice, 0.9);
      setTtsStatus('ok');
      setTtsStatusText('✅ Ready');
    } catch (error) {
      console.warn('Finish sentence TTS failed:', error);
      setTtsStatus('error');
      setTtsStatusText(`⚠️ Spraak fout: ${shortError(error)}`);
    } finally {
      ttsBusyRef.current = false;
    }

    // No auto-advance — the child moves on with "Volgende" when they are ready.
    if (currentRef.current === current && !listeningRef.current) {
      if (allDone) setMicMessage('🎉 Al die sinne gelees!');
      else if (isLast) setMicMessage('✅ Mooi gelees!');
      else setMicMessage('✅ Mooi gelees! Tik Volgende wanneer jy reg is.');
      // Recording is done and the reward replay has just finished. Keep the words green for a
      // beat, then gently fade them back to default ~1s later (SpokenWord drains the green over
      // ~1.4s) so the sentence can be re-read with the highlight looping in again. Translation stays.
      if (greenFadeRef.current) clearTimeout(greenFadeRef.current);
      greenFadeRef.current = setTimeout(() => {
        greenFadeRef.current = null;
        if (currentRef.current === current && !listeningRef.current) {
          setWordStates(words.map(() => 'default'));
        }
      }, 1000);
    }
  }, [completed, current, sentence.af, sentences.length, stopListening, voice, weekIndex, words]);

  finishSentenceRef.current = finishSentence;

  // Advances the live (green) highlight as words are recognised. Partials make this feel snappy,
  // but they can run ahead of the child (Azure's interim hypothesis, nudged by the phrase-list
  // bias, may "autocomplete" the sentence). So a partial is NOT allowed to green the very last
  // word — only a stable final can — which keeps the highlight honest and stops it from showing
  // the sentence as finished before it is.
  const applySpokenWords = useCallback(
    (newWords: string[], fromFinal: boolean) => {
      if (!newWords.length || !listeningRef.current) return;

      const expectedWords = words.map(normalizeWord);
      const maxPos = fromFinal ? expectedWords.length : Math.max(0, expectedWords.length - 1);
      let expected = expectedWordRef.current;

      newWords.forEach((spoken) => {
        if (expected >= maxPos) return;
        if (!fuzzyMatch(spoken, expectedWords[expected])) return;

        expected += 1;
        expectedWordRef.current = expected;
        setScoreCorrect((c) => c + 1);
        setMicMessage(`Hoor jou… ${spoken}`);
        refreshWordStates(true, expected);
      });
    },
    [refreshWordStates, words],
  );

  // Completion gate: only Azure FINAL results can finish a sentence. We re-match each final's raw
  // tokens sequentially from the last confirmed position, so completion (and the green fade) only
  // happens once stable recognition has covered every word — i.e. the child genuinely read it all.
  const confirmFinalRead = useCallback(
    (transcript: string) => {
      if (!listeningRef.current) return;
      const expectedWords = words.map(normalizeWord);
      let pos = finalizedWordRef.current;
      for (const spoken of tokenizeTranscript(transcript)) {
        if (pos >= expectedWords.length) break;
        if (fuzzyMatch(spoken, expectedWords[pos])) pos += 1;
      }
      finalizedWordRef.current = pos;

      if (pos >= expectedWords.length) {
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
        completionTimerRef.current = setTimeout(() => {
          completionTimerRef.current = null;
          finishSentenceRef.current();
        }, 250);
      }
    },
    [words],
  );

  const processPartialTranscript = useCallback(
    (transcript: string) => {
      if (!listeningRef.current) return;
      applySpokenWords(transcriptProcessorRef.current.processPartial(transcript), false);
    },
    [applySpokenWords],
  );

  const processFinalTranscript = useCallback(
    (transcript: string) => {
      if (!listeningRef.current) return;
      // Drive the highlight up to (and including) the last word from the stable result, then check
      // whether finals have now covered the whole sentence — the only path that completes it.
      applySpokenWords(transcriptProcessorRef.current.processFinal(transcript), true);
      confirmFinalRead(transcript);
    },
    [applySpokenWords, confirmFinalRead],
  );

  const startListening = useCallback(async () => {
    // Claim the mic synchronously so a second tap (before state flushes) can't start a
    // second session. Starting to listen interrupts any TTS that is playing.
    if (listeningRef.current) return;
    listeningRef.current = true;
    setListening(true);
    setConnecting(true);
    ttsBusyRef.current = false;
    setPlaying(false);
    if (greenFadeRef.current) {
      clearTimeout(greenFadeRef.current);
      greenFadeRef.current = null;
    }

    await ttsService.stop();

    expectedWordRef.current = 0;
    finalizedWordRef.current = 0;
    transcriptProcessorRef.current.reset();
    setScoreCorrect(0);
    // While connecting we show pulsing dots and keep every word grey/dimmed — the reading
    // highlight only switches on once Azure is actually listening (the 'listening' status below).
    setShowTranslation(false);
    setWordStates(words.map(() => 'pending'));

    const session = new AzureLiveSpeechSession(
      {
        onStatus: (status) => {
          if (!listeningRef.current) return;
          if (status === 'fetching-token' || status === 'connecting') {
            setConnecting(true);
            setWordStates(words.map(() => 'pending'));
          }
          if (status === 'listening') {
            setConnecting(false);
            setMicMessage('📖 Lees hardop!');
            refreshWordStates(true, 0);
          }
        },
        onPartial: processPartialTranscript,
        onFinal: processFinalTranscript,
        onError: (message) => {
          if (!listeningRef.current) return;
          setMicMessage(`⚠️ ${message.slice(0, 80)}`);
          void stopListening();
        },
      },
      // Bias Azure toward this sentence's words for faster, more accurate detection.
      { phrases: [sentence.af, ...words] },
    );

    speechSessionRef.current = session;
    try {
      await session.start('af-ZA');
      // If the child tapped Stop while we were starting up, tear the session back down
      // instead of leaving an orphaned mic running.
      if (!listeningRef.current) {
        await session.stop().catch(() => {});
        if (speechSessionRef.current === session) speechSessionRef.current = null;
      }
    } catch (error) {
      listeningRef.current = false;
      setListening(false);
      setConnecting(false);
      speechSessionRef.current = null;
      refreshWordStates(false);
      setMicMessage(`⚠️ Azure spraak fout: ${shortError(error)}`);
    }
  }, [
    processFinalTranscript,
    processPartialTranscript,
    refreshWordStates,
    stopListening,
    sentence.af,
    words,
  ]);

  const toggleListen = useCallback(() => {
    if (listeningRef.current) void stopListening();
    else void startListening();
  }, [startListening, stopListening]);

  const speakWord = useCallback(
    async (index: number) => {
      // Ignore while listening or while another clip is playing — don't overlap audio.
      if (listeningRef.current || ttsBusyRef.current) return;
      ttsBusyRef.current = true;
      const startIndex = current;
      setWordStates(words.map((_, i) => (i === index ? 'active' : 'default')));
      try {
        setTtsStatus('busy');
        await ttsService.speak(ttsWord(words[index]), voice, 0.85);
        setTtsStatus('ok');
        setTtsStatusText('✅ Ready');
      } catch (error) {
        console.warn('Speak word TTS failed:', error);
        setTtsStatus('error');
        setTtsStatusText(`⚠️ Spraak fout: ${shortError(error)}`);
      } finally {
        ttsBusyRef.current = false;
        // Only restore default word states if we're still on the same sentence and not listening.
        if (!listeningRef.current && currentRef.current === startIndex) refreshWordStates(false);
      }
    },
    [current, refreshWordStates, voice, words],
  );

  const playSentence = useCallback(async () => {
    // Ignore while listening or while another clip is playing — don't overlap audio.
    if (!ttsReady || listeningRef.current || ttsBusyRef.current) return;
    ttsBusyRef.current = true;
    const startIndex = current;
    setPlaying(true);
    setTtsStatus('busy');
    setTtsStatusText('🔊 …');

    try {
      await ttsService.playWithKaraoke(
        sentence.af,
        voice,
        words.length,
        (index) => {
          setWordStates(
            words.map((_, i) => {
              if (i < index) return 'correct';
              if (i === index) return 'karaoke';
              return 'default';
            }),
          );
        },
        0.9,
      );
      setTtsStatus('ok');
      setTtsStatusText('✅ Ready');
    } catch (error) {
      console.warn('Play sentence TTS failed:', error);
      setTtsStatus('error');
      setTtsStatusText(`⚠️ Spraak fout: ${shortError(error)}`);
    } finally {
      setPlaying(false);
      ttsBusyRef.current = false;
      // Don't clobber a sentence the child navigated to, or an active listen, mid-playback.
      if (!listeningRef.current && currentRef.current === startIndex) refreshWordStates(false);
    }
  }, [current, refreshWordStates, sentence.af, ttsReady, voice, words]);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      void stopListening();
      void ttsService.stop();
      setCurrent((i) => Math.max(0, Math.min(sentences.length - 1, i + dir)));
    },
    [sentences.length, stopListening],
  );

  const goToSentence = useCallback(
    (index: number) => {
      void stopListening();
      void ttsService.stop();
      setCurrent(index);
    },
    [stopListening],
  );

  const restartWeek = useCallback(() => {
    void stopListening();
    void ttsService.stop();
    setCurrent(0);
    setCompleted(new Set());
    saveLeesCompleted(weekIndex, new Set());
    setShowCelebration(false);
  }, [stopListening, weekIndex]);

  useEffect(
    () => () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      if (greenFadeRef.current) clearTimeout(greenFadeRef.current);
      ttsService.stop();
      speechSessionRef.current?.stop().catch(() => {});
    },
    [],
  );

  return {
    week,
    sentences,
    current,
    sentence,
    words,
    voice,
    setVoice,
    completed,
    ttsReady,
    ttsStatus,
    ttsStatusText,
    listening,
    connecting,
    playing,
    showCelebration,
    micMessage,
    scoreCorrect,
    wordStates,
    showTranslation,
    toggleListen,
    speakWord,
    playSentence,
    navigate,
    goToSentence,
    restartWeek,
    setShowCelebration,
  };
}
