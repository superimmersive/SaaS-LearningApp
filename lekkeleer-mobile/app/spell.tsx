import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CtrlButton } from '@/components/CtrlButton';
import { Header } from '@/components/Header';
import { LoadingDots } from '@/components/LoadingDots';
import { SpokenWord, type SpokenWordState } from '@/components/SpokenWord';
import { VoiceBar } from '@/components/VoiceBar';
import { theme, WEEK_FOCUS } from '@/constants/theme';
import { SPELL_EMOJIS, SPELL_WEEKS, type SpellWord } from '@/lib/content/spellContent';
import type { VoiceName } from '@/lib/config';
import { AzureLiveSpeechSession } from '@/lib/azureLiveSpeech';
import { fuzzyMatch, normalizeWord, tokenizeTranscript } from '@/lib/textUtils';
import { ttsService } from '@/lib/ttsService';

function getEmoji(word: string) {
  return SPELL_EMOJIS[word] ?? '🔤';
}

function shortError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, ' ').slice(0, 70);
}

export default function SpellScreen() {
  const router = useRouter();
  const { week } = useLocalSearchParams<{ week?: string }>();
  const weekNum = Math.min(8, Math.max(1, parseInt(week ?? '1', 10) || 1));
  const weekIndex = weekNum - 1;
  const weekData = SPELL_WEEKS[weekIndex] ?? SPELL_WEEKS[0];
  const words = weekData.words;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [voice, setVoice] = useState<VoiceName>('Adri');
  const [ttsStatus, setTtsStatus] = useState<'ok' | 'busy' | 'error'>('ok');
  const [ttsStatusText, setTtsStatusText] = useState('✅ Ready');
  const [listening, setListening] = useState(false);
  // True only while fetching token / opening the socket — UI shows pulsing dots, word stays grey.
  const [connecting, setConnecting] = useState(false);
  const [micMessage, setMicMessage] = useState('Gereed — tik Begin Lees');
  const [showWordList, setShowWordList] = useState(false);
  const [wordState, setWordState] = useState<SpokenWordState>('default');

  const current: SpellWord = words[index] ?? words[0];
  const listeningRef = useRef(false);
  const ttsBusyRef = useRef(false);
  const indexRef = useRef(0);
  const stopListeningRef = useRef<() => void>(() => {});
  const speechSessionRef = useRef<AzureLiveSpeechSession | null>(null);
  const correctResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ttsService.configureAudio().catch(() => {});
    ttsService.preload(current.af, voice, 1);
  }, [current.af, voice]);

  useEffect(() => {
    indexRef.current = index;
    setFlipped(false);
    setWordState('default');
    setConnecting(false);
    if (correctResetRef.current) {
      clearTimeout(correctResetRef.current);
      correctResetRef.current = null;
    }
  }, [index, weekIndex]);

  const stopListening = useCallback(async () => {
    listeningRef.current = false;
    setListening(false);
    setConnecting(false);
    // Clear the live "active" highlight when the child stops (the green "correct" path manages
    // its own fade separately so it isn't wiped the instant a word is recognised).
    setWordState((s) => (s === 'correct' ? s : 'default'));
    const session = speechSessionRef.current;
    speechSessionRef.current = null;
    if (session) await session.stop().catch(() => {});
    setMicMessage('Gereed — tik Begin Lees');
  }, []);

  stopListeningRef.current = stopListening;

  // After a correct read we read the word back to the child first, THEN (1s after the TTS ends)
  // gently fade the green highlight to default — so the green never disappears mid-reward and the
  // card can be re-read to loop the highlight back in.
  const readbackThenFade = useCallback(async () => {
    if (correctResetRef.current) {
      clearTimeout(correctResetRef.current);
      correctResetRef.current = null;
    }
    const startIndex = indexRef.current;
    ttsBusyRef.current = true;
    try {
      setTtsStatus('busy');
      setTtsStatusText('🔊 …');
      await ttsService.speak(current.af, voice, 1);
      setTtsStatus('ok');
      setTtsStatusText('✅ Ready');
    } catch (error) {
      console.warn('Spell read-back TTS failed:', error);
      setTtsStatus('error');
      setTtsStatusText(`⚠️ Spraak fout: ${shortError(error)}`);
    } finally {
      ttsBusyRef.current = false;
    }
    correctResetRef.current = setTimeout(() => {
      correctResetRef.current = null;
      if (indexRef.current === startIndex && !listeningRef.current) {
        setMicMessage('Gereed — tik Begin Lees');
        setWordState('default');
      }
    }, 1000);
  }, [current.af, voice]);

  const processTranscript = useCallback((transcript: string) => {
    if (!listeningRef.current) return;
    const spoken = tokenizeTranscript(transcript);
    const expected = normalizeWord(current.af);
    for (const word of spoken) {
      if (fuzzyMatch(word, expected)) {
        // Correct! Show the word green + tear the mic down, then read it back and fade gently.
        setConnecting(false);
        setWordState('correct');
        setMicMessage('Reg! ✓');
        listeningRef.current = false;
        setListening(false);
        const session = speechSessionRef.current;
        speechSessionRef.current = null;
        session?.stop().catch(() => {});
        void readbackThenFade();
        return;
      }
    }
  }, [current.af, readbackThenFade]);

  const speakWord = useCallback(async () => {
    // Ignore while listening or while another clip is playing — don't overlap audio.
    if (listeningRef.current || ttsBusyRef.current) return;
    ttsBusyRef.current = true;
    try {
      setTtsStatus('busy');
      setTtsStatusText('🔊 …');
      await ttsService.speak(current.af, voice, 1);
      setTtsStatus('ok');
      setTtsStatusText('✅ Ready');
    } catch (error) {
      console.warn('Spell word TTS failed:', error);
      setTtsStatus('error');
      setTtsStatusText(`⚠️ Spraak fout: ${shortError(error)}`);
    } finally {
      ttsBusyRef.current = false;
    }
  }, [current.af, voice]);

  const startListening = useCallback(async () => {
    // Claim the mic synchronously so a second tap can't start a second session.
    if (listeningRef.current) return;
    listeningRef.current = true;
    setListening(true);
    setConnecting(true);
    ttsBusyRef.current = false;
    if (correctResetRef.current) {
      clearTimeout(correctResetRef.current);
      correctResetRef.current = null;
    }
    // Grey while connecting (dots show in the status pill); highlight only once Azure is live.
    setWordState('pending');

    await ttsService.stop();

    const session = new AzureLiveSpeechSession(
      {
        onStatus: (status) => {
          if (!listeningRef.current) return;
          if (status === 'fetching-token' || status === 'connecting') {
            setConnecting(true);
            setWordState('pending');
          }
          if (status === 'listening') {
            setConnecting(false);
            setMicMessage('📖 Lees hardop!');
            setWordState('active');
          }
        },
        onPartial: processTranscript,
        onFinal: processTranscript,
        onError: (message) => {
          if (!listeningRef.current) return;
          setMicMessage(`⚠️ ${message.slice(0, 80)}`);
          void stopListeningRef.current();
        },
      },
      // Bias Azure toward the word the child is trying to spell aloud.
      { phrases: [current.af] },
    );

    speechSessionRef.current = session;
    try {
      await session.start('af-ZA');
      // If the child tapped Stop / flipped the card while starting up, tear it down.
      if (!listeningRef.current) {
        await session.stop().catch(() => {});
        if (speechSessionRef.current === session) speechSessionRef.current = null;
      }
    } catch (error) {
      await stopListening();
      setMicMessage(`⚠️ Azure spraak fout: ${shortError(error)}`);
    }
  }, [processTranscript, stopListening, current.af]);

  const toggleListen = useCallback(() => {
    if (listeningRef.current) void stopListening();
    else void startListening();
  }, [startListening, stopListening]);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      void stopListening();
      setIndex((i) => Math.max(0, Math.min(words.length - 1, i + dir)));
    },
    [stopListening, words.length],
  );

  const emoji = useMemo(() => getEmoji(current.af), [current.af]);

  useEffect(
    () => () => {
      ttsService.stop();
      speechSessionRef.current?.stop().catch(() => {});
      if (correctResetRef.current) clearTimeout(correctResetRef.current);
    },
    [],
  );

  return (
    <View style={styles.root}>
      <Header badge="✏️ Spell woorde" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.breadcrumb}>
          Term 1 › {weekData.label} › Afrikaans › Spell woorde
        </Text>

        <Text style={styles.weekFocus}>{WEEK_FOCUS[weekIndex] ?? ''}</Text>

        <VoiceBar
          voice={voice}
          onVoiceChange={setVoice}
          status={ttsStatus}
          statusText={ttsStatusText}
        />

        <Pressable
          style={[styles.card, listening && styles.cardListening]}
          onPress={() => {
            stopListening();
            setFlipped((f) => !f);
          }}
        >
          <Text style={styles.counter}>
            {index + 1} / {words.length}
          </Text>
          <Text style={styles.cardEmoji}>{emoji}</Text>
          {!flipped ? (
            <SpokenWord text={current.af} state={wordState} baseStyle={styles.frontWord} />
          ) : (
            <Text style={styles.backWord}>{current.en}</Text>
          )}
          <Text style={styles.flipHint}>Tik kaart om te draai</Text>
        </Pressable>

        <View style={styles.cardActions}>
          <CtrlButton label="Speel" icon="🔊" variant="play" onPress={speakWord} style={styles.cardBtn} />
          <CtrlButton
            label={listening ? 'Stop' : 'Begin Lees'}
            icon={listening ? '⏹' : '🎤'}
            variant="listen"
            onPress={toggleListen}
            style={styles.cardBtn}
          />
        </View>

        <View style={[styles.micStatus, listening && styles.micStatusActive]}>
          {connecting ? (
            <LoadingDots color={theme.navy} />
          ) : (
            <Text style={styles.micText}>{micMessage}</Text>
          )}
        </View>

        <View style={styles.controls}>
          <CtrlButton label="Terug" icon="◀" onPress={() => navigate(-1)} disabled={index === 0} />
          <CtrlButton
            label="Volgende"
            icon="▶"
            onPress={() => navigate(1)}
            disabled={index >= words.length - 1}
          />
        </View>

        <View style={styles.dotsRow}>
          {words.map((_, i) => (
            <Pressable
              key={i}
              style={[styles.dot, i === index && styles.dotCurrent]}
              onPress={() => {
                stopListening();
                setIndex(i);
              }}
            />
          ))}
        </View>

        <Pressable onPress={() => setShowWordList((v) => !v)}>
          <Text style={styles.listToggle}>
            {showWordList ? '▲ Verberg woorde' : '▼ Wys alle woorde vir hierdie week'}
          </Text>
        </Pressable>

        {showWordList ? (
          <View style={styles.wordGrid}>
            {words.map((w, i) => (
              <Pressable
                key={w.af}
                style={[styles.chip, i === index && styles.chipCurrent]}
                onPress={() => {
                  stopListening();
                  setIndex(i);
                }}
              >
                <Text style={styles.chipText}>{w.af}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable style={styles.backLink} onPress={() => router.replace('/')}>
          <Text style={styles.backLinkText}>← Terug na Dashboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.sky },
  scroll: { padding: 16, paddingBottom: 32, alignItems: 'center' },
  breadcrumb: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  weekFocus: {
    fontSize: 12,
    color: theme.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 320,
    lineHeight: 17,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    minHeight: 260,
    backgroundColor: theme.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 6,
    borderTopColor: theme.pink,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  cardListening: {
    borderColor: theme.green,
    borderWidth: 2,
  },
  counter: { position: 'absolute', top: 16, right: 20, fontWeight: '800', color: theme.muted },
  cardEmoji: { fontSize: 48, marginBottom: 12 },
  frontWord: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.navy,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backWord: { fontSize: 22, fontWeight: '700', color: theme.muted, textAlign: 'center' },
  flipHint: { marginTop: 16, fontSize: 12, color: theme.muted, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
    maxWidth: 340,
  },
  cardBtn: { flex: 1 },
  micStatus: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.border,
  },
  micStatusActive: {
    borderColor: theme.green,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  micText: { fontSize: 13, fontWeight: '700', color: theme.navy, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 99, backgroundColor: theme.border },
  dotCurrent: { backgroundColor: theme.pink, transform: [{ scale: 1.25 }] },
  listToggle: { marginTop: 16, color: theme.blue, fontWeight: '800', fontSize: 13 },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
    maxWidth: 360,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.border,
  },
  chipCurrent: { borderColor: theme.pink, backgroundColor: 'rgba(255, 107, 157, 0.12)' },
  chipText: { fontWeight: '800', color: theme.navy },
  backLink: { marginTop: 20 },
  backLinkText: { color: theme.blue, fontWeight: '700', fontSize: 14 },
});
