import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';
import { Audio } from 'expo-av';
import './cryptoPolyfill';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import { ttsService } from './ttsService';
import { runExclusive } from './audioLock';

const SAMPLE_RATE = 16000;
const FRAME_DURATION_MS = 20;
const MISSING_NATIVE_MODULE_MESSAGE =
  'Nuwe LekkeLeer development build nodig: ExpoStreamAudio native module ontbreek.';

// P3: the mic streams frames every ~20ms even during silence, so a multi-second gap means
// the audio engine was interrupted (call, Siri, Control Center, backgrounding), not a quiet child.
const FRAME_GAP_LIMIT_MS = 2500;
// P3: stop a few seconds before the Azure token dies so we surface a friendly message instead of
// Azure's opaque cancellation when a mic is left listening for many minutes.
const SESSION_CAP_SAFETY_SECONDS = 30;
// P3: refetch a cached token this long before it expires.
const TOKEN_REFRESH_BUFFER_MS = 60_000;

declare const require: (name: string) => StreamAudioModule;

type SpeechTokenResponse = {
  token: string;
  region: string;
  expiresInSeconds?: number;
};

export type AzureLiveSpeechStatus =
  | 'idle'
  | 'requesting-permission'
  | 'fetching-token'
  | 'connecting'
  | 'listening'
  | 'stopping'
  | 'error';

export type AzureLiveSpeechCallbacks = {
  onStatus?: (status: AzureLiveSpeechStatus) => void;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
  onAudioLevel?: (level: number) => void;
};

type Recognizer = SpeechSDK.SpeechRecognizer;
type PushAudioStream = SpeechSDK.PushAudioInputStream;
type Subscription = { remove: () => void };
type AudioFrameEvent = {
  pcmBase64: string;
  sampleRate: number;
  timestamp: number;
  level?: number;
};
type StreamAudioModule = {
  requestPermission: () => Promise<'granted' | 'denied' | 'undetermined'>;
  start: (options?: {
    sampleRate?: 16000 | 44100 | 48000;
    frameDurationMs?: number;
    channels?: 1;
    enableLevelMeter?: boolean;
  }) => Promise<void>;
  stop: () => Promise<void>;
  addFrameListener: (listener: (event: AudioFrameEvent) => void) => Subscription;
  addErrorListener: (listener: (event: { message: string }) => void) => Subscription;
};

let cachedStreamAudio: StreamAudioModule | null | undefined;

function getStreamAudioModule(): StreamAudioModule | null {
  if (cachedStreamAudio !== undefined) return cachedStreamAudio;
  try {
    cachedStreamAudio = require('expo-stream-audio');
  } catch (error) {
    console.warn('expo-stream-audio native module unavailable:', error);
    cachedStreamAudio = null;
  }
  return cachedStreamAudio;
}

export function isAzureLiveSpeechNativeAvailable(): boolean {
  return getStreamAudioModule() != null;
}

export type StreamMicPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getStreamMicPermission(): Promise<StreamMicPermissionStatus> {
  const streamAudio = getStreamAudioModule();
  if (!streamAudio) return 'unavailable';
  return streamAudio.requestPermission();
}

export async function requestStreamMicPermission(): Promise<StreamMicPermissionStatus> {
  const streamAudio = getStreamAudioModule();
  if (!streamAudio) return 'unavailable';

  let status = await getStreamMicPermission();
  if (status === 'granted' || status === 'denied') return status;

  if (Platform.OS !== 'ios') return status;

  try {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.granted || permission.status === 'granted') return 'granted';
    if (permission.status === 'denied') return 'denied';

    status = await streamAudio.requestPermission();
    if (status === 'granted' || status === 'denied') return status;
  } catch (error) {
    console.warn('Expo AV mic permission request failed:', error);
  }

  // Fallback: requestPermission only checks status in expo-stream-audio; start() can prompt iOS.
  // This probe may run inside the session-start audio lock (via ensureMicPermission), so it
  // uses the lock-free TTS variants to avoid deadlocking on the shared audio mutex.
  try {
    await ttsService.prepareForMicCaptureUnlocked();
    await streamAudio.start({
      sampleRate: SAMPLE_RATE,
      frameDurationMs: FRAME_DURATION_MS,
      channels: 1,
    });
    await streamAudio.stop();
    await sleep(200);
    status = await streamAudio.requestPermission();
  } catch (error) {
    console.warn('Mic permission probe failed:', error);
  } finally {
    await streamAudio.stop().catch(() => {});
    await ttsService.forceRestorePlaybackUnlocked().catch(() => {});
  }

  return status;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reject if `promise` hasn't settled within `ms` — keeps a stalled native/SDK call from
 *  hanging the shared audio lock. The underlying call may still finish later. */
function withDeadline<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function shortError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bytes = Buffer.from(base64, 'base64');
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function requestAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function ensureMicPermission(): Promise<boolean> {
  const androidGranted = await requestAndroidPermission();
  if (!androidGranted) return false;

  const streamAudio = getStreamAudioModule();
  if (!streamAudio) throw new Error(MISSING_NATIVE_MODULE_MESSAGE);

  const status = Platform.OS === 'ios' ? await requestStreamMicPermission() : await streamAudio.requestPermission();
  return status === 'granted';
}

export async function fetchAzureSpeechToken(): Promise<SpeechTokenResponse> {
  // Abort a stalled token request so it can't hang the session-start audio lock.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/speech-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      });
    } catch (error) {
      const reason = controller.signal.aborted ? 'time-out' : shortError(error);
      throw new Error(`Speech token network failed: ${reason}`);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Speech token failed (${res.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

type CachedSpeechToken = { token: string; region: string; expiresAt: number };
let cachedSpeechToken: CachedSpeechToken | null = null;

export function invalidateSpeechTokenCache() {
  cachedSpeechToken = null;
}

/**
 * P3: reuse a still-valid Azure token instead of doing a network round-trip on every
 * `start()`. Returns the remaining lifetime so the caller can cap the session before expiry.
 */
async function getSpeechToken(): Promise<{ token: string; region: string; remainingSeconds: number }> {
  const now = Date.now();
  if (cachedSpeechToken && cachedSpeechToken.expiresAt - TOKEN_REFRESH_BUFFER_MS > now) {
    return {
      token: cachedSpeechToken.token,
      region: cachedSpeechToken.region,
      remainingSeconds: Math.floor((cachedSpeechToken.expiresAt - now) / 1000),
    };
  }

  const fresh = await fetchAzureSpeechToken();
  const lifeSeconds = fresh.expiresInSeconds ?? 540;
  cachedSpeechToken = {
    token: fresh.token,
    region: fresh.region,
    expiresAt: now + lifeSeconds * 1000,
  };
  return { token: fresh.token, region: fresh.region, remainingSeconds: lifeSeconds };
}

export class AzureLiveSpeechSession {
  private callbacks: AzureLiveSpeechCallbacks;
  private recognizer: Recognizer | null = null;
  private pushStream: PushAudioStream | null = null;
  private frameSub: Subscription | null = null;
  private errorSub: Subscription | null = null;
  private active = false;
  private recordingMode = false;
  private hadError = false;
  private inputSampleRate: number | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private lastFrameAt = 0;
  private phrases: string[];

  constructor(callbacks: AzureLiveSpeechCallbacks = {}, options: { phrases?: string[] } = {}) {
    this.callbacks = callbacks;
    // Words/sentence we expect to hear — used to bias Azure recognition (phrase list grammar).
    this.phrases = (options.phrases ?? []).map((p) => p.trim()).filter(Boolean);
  }

  get isActive() {
    return this.active;
  }

  async start(language = 'af-ZA') {
    // Serialize the whole session setup against TTS playback and other sessions so the
    // shared AVAudioSession is never reconfigured from two places at once (P1). Allow a
    // longer lock budget than the default: setup legitimately includes a token fetch and
    // the Azure recognizer handshake (both bounded by their own inner timeouts below).
    await runExclusive(() => this.startInternal(language), 30000);
  }

  private async startInternal(language: string) {
    if (this.active) return;
    this.hadError = false;
    this.inputSampleRate = null;

    const streamAudio = getStreamAudioModule();
    if (!streamAudio) {
      throw this.reportStartError(MISSING_NATIVE_MODULE_MESSAGE);
    }

    this.callbacks.onStatus?.('requesting-permission');

    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
      throw this.reportStartError('Mikrofoon toestemming nodig.');
    }

    // Mark recording BEFORE disabling expo-av so any failure below routes through
    // stopInternal() and reliably restores playback — otherwise a throw here could leave
    // expo-av disabled and silently break all later TTS.
    this.recordingMode = true;
    try {
      await ttsService.prepareForMicCaptureUnlocked();

      this.callbacks.onStatus?.('fetching-token');
      const token = await getSpeechToken();

      this.callbacks.onStatus?.('connecting');
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      speechConfig.speechRecognitionLanguage = language;
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        '8000',
      );
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        '1200',
      );

      const queuedFrames: AudioFrameEvent[] = [];
      let firstFrame: AudioFrameEvent | null = null;
      let resolveFirstFrame: ((frame: AudioFrameEvent) => void) | null = null;
      const firstFramePromise = new Promise<AudioFrameEvent>((resolve, reject) => {
        resolveFirstFrame = resolve;
        setTimeout(() => reject(new Error('No microphone audio frames received.')), 3000);
      });

      this.frameSub = streamAudio.addFrameListener((frame: AudioFrameEvent) => {
        if (!this.active) return;
        this.lastFrameAt = Date.now();
        if (frame.level != null) this.callbacks.onAudioLevel?.(frame.level);

        if (!this.pushStream) {
          queuedFrames.push(frame);
          if (!firstFrame) {
            firstFrame = frame;
            resolveFirstFrame?.(frame);
          }
          return;
        }

        if (this.inputSampleRate != null && frame.sampleRate !== this.inputSampleRate) {
          this.fail(`Mic sample rate changed from ${this.inputSampleRate}Hz to ${frame.sampleRate}Hz.`);
          return;
        }

        this.pushStream.write(base64ToArrayBuffer(frame.pcmBase64));
      });

      this.errorSub = streamAudio.addErrorListener((event) => {
        this.fail(event.message);
      });

      // Brief pause after releasing expo-av so iOS can switch AVAudioSession category.
      await sleep(200);

      // Start mic before Azure recognizer so expo-stream-audio owns AVAudioSession first.
      this.active = true;
      await streamAudio.start({
        sampleRate: SAMPLE_RATE,
        frameDurationMs: FRAME_DURATION_MS,
        channels: 1,
        enableLevelMeter: true,
      });

      const frame = await firstFramePromise;
      const actualSampleRate = Math.round(frame.sampleRate);
      this.inputSampleRate = actualSampleRate;

      const format = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(actualSampleRate, 16, 1);
      const pushStream = SpeechSDK.AudioInputStream.createPushStream(format);
      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizing = (_sender, event) => {
        const text = event.result?.text?.trim();
        if (text) this.callbacks.onPartial?.(text);
      };

      recognizer.recognized = (_sender, event) => {
        const text = event.result?.text?.trim();
        if (text) this.callbacks.onFinal?.(text);
      };

      recognizer.canceled = (_sender, event) => {
        const details = event.errorDetails || event.reason?.toString() || 'Azure recognition canceled';
        this.fail(details);
      };

      recognizer.sessionStopped = () => {
        if (!this.hadError) this.callbacks.onStatus?.('idle');
      };

      // Bias recognition toward the exact words we expect the child to read. This sharpens
      // accuracy and helps interim (partial) results lock onto the right word sooner — which
      // is what makes the per-word highlight feel snappy without changing the streaming path.
      if (this.phrases.length) {
        try {
          const grammar = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);
          for (const phrase of this.phrases) grammar.addPhrase(phrase);
        } catch (error) {
          console.warn('Phrase list grammar unavailable:', error);
        }
      }

      this.pushStream = pushStream;
      this.recognizer = recognizer;

      for (const queued of queuedFrames) {
        if (queued.sampleRate === actualSampleRate) {
          pushStream.write(base64ToArrayBuffer(queued.pcmBase64));
        }
      }

      await new Promise<void>((resolve, reject) => {
        let done = false;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          reject(new Error('Azure herkenning kon nie begin nie (uitteltyd).'));
        }, 12000);
        recognizer.startContinuousRecognitionAsync(
          () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve();
          },
          (error) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            reject(new Error(shortError(error)));
          },
        );
      });

      this.startWatchdog(token.remainingSeconds);
      this.callbacks.onStatus?.('listening');
    } catch (error) {
      // A rejected connection often means a stale/expired cached token — drop it so the
      // next attempt fetches a fresh one (P3).
      invalidateSpeechTokenCache();
      await this.stopInternal({ emitIdle: false });
      throw error;
    }
  }

  /**
   * P3: a single 1s ticker that fires a friendly error if the mic goes silent (interruption)
   * or the session outlives its token (long idle listen) — instead of getting wedged or
   * cancelled cryptically by Azure.
   */
  private startWatchdog(tokenRemainingSeconds: number) {
    this.clearWatchdog();
    this.lastFrameAt = Date.now();
    const deadline =
      Date.now() + Math.max(30_000, (tokenRemainingSeconds - SESSION_CAP_SAFETY_SECONDS) * 1000);

    this.watchdog = setInterval(() => {
      if (!this.active) return;
      const now = Date.now();
      if (now - this.lastFrameAt > FRAME_GAP_LIMIT_MS) {
        this.fail('Mikrofoon het stil geword — tik Begin Lees weer.');
        return;
      }
      if (now >= deadline) {
        this.fail('Luister het te lank aangehou — tik Begin Lees weer.');
      }
    }, 1000);
  }

  private clearWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  async stop(options: { emitIdle?: boolean; emitStopping?: boolean } = {}) {
    // Serialize teardown so it can't interleave with a start/TTS transition (P1).
    await runExclusive(() => this.stopInternal(options));
  }

  private async stopInternal(options: { emitIdle?: boolean; emitStopping?: boolean } = {}) {
    const { emitIdle = true, emitStopping = true } = options;
    if (!this.active && !this.recognizer && !this.pushStream && !this.recordingMode) {
      this.clearWatchdog();
      return;
    }
    if (emitStopping) this.callbacks.onStatus?.('stopping');
    this.active = false;
    this.clearWatchdog();

    this.frameSub?.remove();
    this.errorSub?.remove();
    this.frameSub = null;
    this.errorSub = null;

    const streamAudio = getStreamAudioModule();
    if (streamAudio) {
      await withDeadline(streamAudio.stop(), 4000, 'mic stop timed out').catch(() => {});
    }

    const recognizer = this.recognizer;
    const pushStream = this.pushStream;
    this.pushStream = null;
    this.recognizer = null;

    if (recognizer) {
      // The Speech SDK stop callback can silently never fire on a dead WebSocket; force-close
      // and resolve after a few seconds so teardown can never hang the shared audio lock.
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          try {
            recognizer.close();
          } catch {
            // already closed
          }
          resolve();
        };
        const timer = setTimeout(finish, 6000);
        recognizer.stopContinuousRecognitionAsync(
          () => {
            clearTimeout(timer);
            finish();
          },
          () => {
            clearTimeout(timer);
            finish();
          },
        );
      });
    }

    try {
      pushStream?.close();
    } catch {
      // Stream may already be closed by Azure.
    }

    if (this.recordingMode) {
      this.recordingMode = false;
      // Switch the (still-active) shared session back to playback so TTS works and the mic is
      // released. No deactivation happened, so this is just a category change.
      await ttsService.forceRestorePlaybackUnlocked().catch(() => {});
    }

    this.inputSampleRate = null;
    if (emitIdle && !this.hadError) this.callbacks.onStatus?.('idle');
  }

  private reportStartError(message: string): Error {
    this.hadError = true;
    this.callbacks.onStatus?.('error');
    this.callbacks.onError?.(message);
    return new Error(message);
  }

  private fail(message: string) {
    if (this.hadError) return;
    this.hadError = true;
    // Stop the watchdog immediately so it can't re-fire while teardown is queued.
    this.clearWatchdog();
    this.callbacks.onStatus?.('error');
    this.callbacks.onError?.(message);
    // Route teardown through the lock; if a start is still in flight it will finish
    // (or time out on its own 3s frame wait) and release before this runs.
    void runExclusive(() => this.stopInternal({ emitIdle: false, emitStopping: false }));
  }
}
