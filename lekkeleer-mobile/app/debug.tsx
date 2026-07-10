import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { isRunningInExpoGo } from 'expo';
import { useRouter } from 'expo-router';
import { CtrlButton } from '@/components/CtrlButton';
import { Header } from '@/components/Header';
import { theme } from '@/constants/theme';
import {
  AzureLiveSpeechSession,
  fetchAzureSpeechToken,
  getStreamMicPermission,
  isAzureLiveSpeechNativeAvailable,
  requestStreamMicPermission,
  type AzureLiveSpeechStatus,
} from '@/lib/azureLiveSpeech';
import { ttsService } from '@/lib/ttsService';
import { clearAllProgress } from '@/lib/progressStorage';
import { SUPABASE_URL } from '@/lib/config';

type LogLine = { id: number; text: string };

// Bumped every time the JS bundle ships a meaningful audio change. Lets us confirm via the
// debug screen exactly which JS is live (this travels over OTA), independent of the native build.
const JS_BUILD_TAG = 'final-gated completion (no premature green fade) · 2026-06-22';

let logId = 0;

function debugValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function appendLog(setter: Dispatch<SetStateAction<LogLine[]>>, text: string) {
  const stamp = new Date().toLocaleTimeString();
  setter((prev) => [{ id: ++logId, text: `[${stamp}] ${text}` }, ...prev].slice(0, 40));
}

export default function DebugScreen() {
  const router = useRouter();
  const [micPerm, setMicPerm] = useState<string>('(not loaded)');
  const [azureListening, setAzureListening] = useState(false);
  const [azureStatus, setAzureStatus] = useState<AzureLiveSpeechStatus>('idle');
  const [azurePartial, setAzurePartial] = useState('—');
  const [azureFinal, setAzureFinal] = useState('—');
  const [azureLevel, setAzureLevel] = useState('—');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [logCopied, setLogCopied] = useState(false);
  const [ttsStatus, setTtsStatus] = useState('—');
  const [lastError, setLastError] = useState('—');
  const [pingResult, setPingResult] = useState('—');
  const [pinging, setPinging] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const azureSessionRef = useRef<AzureLiveSpeechSession | null>(null);

  const log = useCallback((text: string) => {
    appendLog(setLogs, text);
    if (text.includes('error') || text.includes('Error')) {
      setLastError(text.replace(/^\[\d:.*?\]\s*/, ''));
    }
  }, []);

  const copyEventLog = useCallback(async () => {
    if (!logs.length) return;

    const text = [...logs]
      .reverse()
      .map((line) => line.text)
      .join('\n');

    try {
      await Clipboard.setStringAsync(text);
      setLogCopied(true);
      if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = setTimeout(() => {
        copyFeedbackTimerRef.current = null;
        setLogCopied(false);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Clipboard copy failed — ${message}`);
      await Share.share({ message: text }).catch((shareError) => {
        const shareMessage = shareError instanceof Error ? shareError.message : String(shareError);
        log(`Share log failed — ${shareMessage}`);
      });
    }
  }, [log, logs]);

  const checkMicPermission = useCallback(async () => {
    const status = await getStreamMicPermission();
    setMicPerm(status);
    log(`mic permission check → ${status}`);
  }, [log]);

  const requestMicPermission = useCallback(async () => {
    const status = await requestStreamMicPermission();
    setMicPerm(status);
    log(`mic permission request → ${status}`);
  }, [log]);

  useEffect(() => {
    if (!isAzureLiveSpeechNativeAvailable()) {
      setMicPerm('unavailable (module not loaded)');
      return;
    }
    checkMicPermission();
  }, [checkMicPermission]);

  useEffect(
    () => () => {
      azureSessionRef.current?.stop().catch(() => {});
      if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
    },
    [],
  );

  async function testAzureToken() {
    log('→ Azure token…');
    try {
      const token = await fetchAzureSpeechToken();
      log(`Azure token ok → region=${token.region}, expires=${token.expiresInSeconds ?? 'unknown'}s`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Azure token error — ${message}`);
    }
  }

  async function testStartAzure(lang = 'af-ZA') {
    await testStopAzure();
    setAzurePartial('—');
    setAzureFinal('—');
    setAzureLevel('—');
    log(`→ Azure live start (${lang})`);

    const session = new AzureLiveSpeechSession({
      onStatus: (status) => {
        setAzureStatus(status);
        log(`Azure status → ${status}`);
        if (status === 'idle') setAzureListening(false);
      },
      onPartial: (text) => {
        setAzurePartial(text || '—');
        log(`Azure partial → ${text || '(empty)'}`);
      },
      onFinal: (text) => {
        setAzureFinal(text || '—');
        log(`Azure final → ${text || '(empty)'}`);
      },
      onAudioLevel: (level) => setAzureLevel(level.toFixed(4)),
      onError: (message) => {
        setAzureStatus('error');
        setAzureListening(false);
        setLastError(message);
        log(`Azure error → ${message}`);
        ttsService.forceRestorePlayback().catch(() => {});
      },
    });

    azureSessionRef.current = session;
    setAzureListening(true);
    try {
      await session.start(lang);
    } catch (error) {
      setAzureListening(false);
      setAzureStatus('error');
      azureSessionRef.current = null;
      const message = error instanceof Error ? error.message : String(error);
      log(`Azure start error — ${message}`);
    }
  }

  async function testStopAzure() {
    const session = azureSessionRef.current;
    azureSessionRef.current = null;
    setAzureListening(false);
    if (!session) return;
    log('→ Azure live stop');
    await session.stop();
  }

  async function testTts() {
    setTtsStatus('speaking…');
    log('→ TTS "hallo"');
    try {
      await ttsService.forceRestorePlayback();
      await ttsService.speak('hallo', 'Adri', 0.9);
      setTtsStatus('ok');
      log('TTS ok');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTtsStatus(`error: ${message.slice(0, 60)}`);
      log(`TTS error — ${message}`);
    }
  }

  async function runPing() {
    if (pinging) return;
    setPinging(true);
    setPingResult('pinging…');
    log('→ ping');
    const url = `${SUPABASE_URL}/functions/v1/speech-token`;
    const samples: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const t = Date.now();
      try {
        await fetch(url, { method: 'OPTIONS' });
        samples.push(Date.now() - t);
      } catch {
        // skip failed sample
      }
    }
    let tokenMs = -1;
    let region = '?';
    const t2 = Date.now();
    try {
      const tk = await fetchAzureSpeechToken();
      tokenMs = Date.now() - t2;
      region = tk.region;
    } catch (error) {
      log(`ping token error — ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!samples.length) {
      setPingResult(`edge unreachable · token ${tokenMs >= 0 ? `${tokenMs}ms` : 'failed'} · ${region}`);
    } else {
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
      const result = `edge ~${avg}ms (min ${min} / max ${max}) · token ${tokenMs >= 0 ? `${tokenMs}ms` : 'failed'} · ${region}`;
      setPingResult(result);
      log(`ping → ${result}`);
    }
    setPinging(false);
  }

  async function resetProgress() {
    const n = await clearAllProgress();
    setResetMsg(`Cleared ${n} saved key${n === 1 ? '' : 's'} — progress reset.`);
    log(`reset progress → cleared ${n} key(s)`);
    if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current);
    copyFeedbackTimerRef.current = setTimeout(() => setResetMsg(''), 4000);
  }

  const azureNativeLoaded = isAzureLiveSpeechNativeAvailable();
  const clipboardNativeLoaded = Clipboard.setStringAsync != null;
  const inExpoGo = isRunningInExpoGo();
  const updateCreatedAt = Updates.createdAt ? new Date(Updates.createdAt).toLocaleString() : '—';

  return (
    <View style={styles.root}>
      <Header badge="Debug" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.sub}>
          Test microphone capture, Azure speech-to-text, and TTS. All listening uses Azure (af-ZA).
        </Text>

        <Section title="Build / update">
          <Text style={styles.hint}>
            Confirm you are on the latest native build (build number) and JS bundle (update).
          </Text>
          <Row label="App version" value={Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—'} />
          <Row label="Native build #" value={Application.nativeBuildVersion ?? '—'} />
          <Row label="JS build tag" value={JS_BUILD_TAG} />
          <Row label="Runtime" value={Updates.runtimeVersion ?? Constants.expoConfig?.runtimeVersion ?? '—'} />
          <Row label="Update source" value={Updates.isEmbeddedLaunch ? 'embedded (build bundle)' : 'OTA update'} />
          <Row label="Update ID" value={Updates.updateId ?? '—'} />
          <Row label="Update created" value={updateCreatedAt} />
        </Section>

        <Section title="Environment">
          <Row label="Platform" value={Platform.OS} />
          <Row label="Expo Go" value={inExpoGo ? 'yes (no Azure mic)' : 'no (dev build)'} />
          <Row label="Azure mic module" value={azureNativeLoaded ? 'loaded ✓' : 'NOT loaded ✗'} />
          <Row label="Clipboard module" value={clipboardNativeLoaded ? 'loaded ✓' : 'NOT loaded ✗'} />
          <Row label="STT backend" value="Azure Cognitive Services" />
          <Row label="Execution" value={Constants.executionEnvironment ?? '—'} />
        </Section>

        <Section title="Microphone permission">
          <Text style={styles.hint}>
            Tap Request mic to open the iOS microphone permission prompt before testing Azure.
          </Text>
          <Mono>{micPerm}</Mono>
          <View style={styles.btnRow}>
            <CtrlButton label="Check status" onPress={checkMicPermission} variant="nav" />
            <CtrlButton label="Request mic" onPress={requestMicPermission} variant="listen" />
          </View>
          <Pressable style={styles.linkBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.linkText}>Open Settings → LekkeLeer</Text>
          </Pressable>
        </Section>

        <Section title="Azure live test">
          <Row label="Status" value={azureStatus} />
          <Row label="Last error" value={lastError} />
          <Row label="Mic level" value={azureLevel} />
          <Text style={styles.blockLabel}>Partial transcript</Text>
          <Mono>{azurePartial}</Mono>
          <Text style={styles.blockLabel}>Final transcript</Text>
          <Mono>{azureFinal}</Mono>
          <Text style={styles.hint}>
            {azureListening
              ? '🎤 Listening via Azure — speak Afrikaans aloud'
              : 'Use Azure af-ZA for Begin Lees. en-US is available for comparison.'}
          </Text>
          <View style={styles.btnRow}>
            <CtrlButton label="Token" onPress={testAzureToken} variant="nav" />
            {!azureListening ? (
              <>
                <CtrlButton
                  label="Azure af-ZA"
                  icon="🎤"
                  onPress={() => testStartAzure('af-ZA')}
                  variant="listen"
                />
                <CtrlButton
                  label="Azure en-US"
                  icon="🎤"
                  onPress={() => testStartAzure('en-US')}
                  variant="primary"
                />
              </>
            ) : (
              <CtrlButton label="Stop Azure" onPress={testStopAzure} variant="primary" />
            )}
          </View>
        </Section>

        <Section title="TTS test">
          <Row label="Status" value={ttsStatus} />
          <CtrlButton label='Play "hallo"' icon="🔊" onPress={testTts} variant="play" />
        </Section>

        <Section title="Network ping">
          <Text style={styles.hint}>
            Measures round-trip to the Supabase edge function and the time to fetch a live Azure
            speech token (with the active region).
          </Text>
          <Mono>{pingResult}</Mono>
          <CtrlButton
            label={pinging ? 'Pinging…' : 'Run ping test'}
            icon="📶"
            onPress={runPing}
            variant="nav"
            disabled={pinging}
          />
        </Section>

        <Section title="Progress">
          <Text style={styles.hint}>
            Clears all saved Lees saam progress (completed sentences) on this device.
          </Text>
          {resetMsg ? <Text style={styles.resetMsg}>{resetMsg}</Text> : null}
          <CtrlButton label="Reset progress" icon="🗑️" onPress={resetProgress} variant="primary" />
        </Section>

        <Section title="Event log">
          <View style={styles.logActions}>
            <CtrlButton
              label={logCopied ? 'Copied!' : clipboardNativeLoaded ? 'Copy log' : 'Share log'}
              icon="📋"
              onPress={copyEventLog}
              variant="nav"
              disabled={logs.length === 0}
            />
            <CtrlButton label="Clear" onPress={() => setLogs([])} variant="nav" disabled={logs.length === 0} />
          </View>
          {logs.length === 0 ? (
            <Text style={styles.muted}>No events yet.</Text>
          ) : (
            logs.map((line) => (
              <Text key={line.id} selectable style={styles.logLine}>
                {line.text}
              </Text>
            ))
          )}
          {!clipboardNativeLoaded && logs.length > 0 ? (
            <Text style={styles.muted}>Long-press any log line to copy without the clipboard module.</Text>
          ) : null}
        </Section>

        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to dashboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{debugValue(value)}</Text>
    </View>
  );
}

function Mono({ children }: { children: string }) {
  return <Text style={styles.mono}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.sky,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.navy,
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: theme.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  section: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.navy,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: theme.muted,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.navy,
    flex: 1,
    textAlign: 'right',
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.muted,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: theme.text,
    backgroundColor: theme.sky,
    padding: 10,
    borderRadius: 8,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  hint: {
    fontSize: 13,
    color: theme.navy,
    marginBottom: 8,
  },
  linkBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.blue,
    textDecorationLine: 'underline',
  },
  muted: {
    fontSize: 12,
    color: theme.muted,
  },
  resetMsg: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.green,
    marginBottom: 10,
  },
  logActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  logLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: theme.text,
    marginBottom: 4,
    lineHeight: 14,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.blue,
  },
});
