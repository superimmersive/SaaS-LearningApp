import { Audio, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { arrayBufferToBase64 } from './base64';
import { buildTtsCacheKey, synthesizeSpeech } from './tts';
import type { VoiceName } from './config';
import { runExclusive } from './audioLock';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

// P3: cap the in-memory URI map (and the on-disk .mp3 files it points to) so the cache can't
// grow without bound as the user moves across weeks. Holds well more than a full week of audio.
const MAX_TTS_CACHE_ENTRIES = 200;

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

class TtsService {
  private uriCache = new Map<string, string>();
  private pending = new Map<string, Promise<string>>();
  private sound: Audio.Sound | null = null;
  private karaokeTimer: ReturnType<typeof setInterval> | null = null;

  async configureAudio() {
    await this.configureForPlayback();
  }

  /** Playback-only mode — release the mic so TTS and expo-av work reliably on iOS. */
  async configureForPlayback() {
    await runExclusive(() => this.configureForPlaybackCore());
  }

  private async configureForPlaybackCore() {
    // The session is never disabled anymore, so this is just a category switch back to
    // playback (.playback on iOS). Ensure audio is enabled as a cheap safety (no-op after the
    // first call) — no settle delay needed since there's no full re-enable to wait on.
    if (Platform.OS === 'ios') {
      await Audio.setIsEnabledAsync(true);
    }
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
    });
  }

  /** Force playback mode after a failed mic session. Safe to call repeatedly. */
  async forceRestorePlayback() {
    await runExclusive(() => this.forceRestorePlaybackUnlocked());
  }

  /**
   * Lock-free variant of {@link forceRestorePlayback}. Call ONLY while already
   * holding the audio lock (e.g. from inside a mic session start/stop).
   */
  async forceRestorePlaybackUnlocked() {
    await this.stopCore();
    await this.configureForPlaybackCore();
  }

  /** Recording mode — stop TTS first, then hand the audio session to the mic stream. */
  async configureForRecording() {
    await this.prepareForMicCapture();
  }

  /**
   * Stop playback and release expo-av before mic capture.
   * On iOS, reset expo-av then disable it so expo-stream-audio can own AVAudioSession.
   */
  async prepareForMicCapture() {
    await runExclusive(() => this.prepareForMicCaptureUnlocked());
  }

  /**
   * Lock-free variant of {@link prepareForMicCapture}. Call ONLY while already
   * holding the audio lock (e.g. from inside a mic session start).
   */
  async prepareForMicCaptureUnlocked() {
    await this.stopCore();
    // Keep ONE shared, always-active audio session. Put expo-av into record-capable mode
    // (.playAndRecord on iOS) but DO NOT disable it — the native mic module reuses this same
    // session, and afterwards we just switch the category back to .playback for TTS. This
    // removes the deactivate/reactivate handoff that left TTS silent after STT.
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
    });
    if (Platform.OS === 'ios') await sleep(150);
  }

  async getUri(text: string, voice: VoiceName, rate = 1): Promise<string> {
    const key = buildTtsCacheKey(text, voice, rate);
    const cached = this.uriCache.get(key);
    if (cached) {
      // LRU bump: re-insert so frequently used clips stay at the newest end.
      this.uriCache.delete(key);
      this.uriCache.set(key, cached);
      return cached;
    }

    if (!this.pending.has(key)) {
      const pending = (async () => {
        try {
          const buffer = await synthesizeSpeech(text, voice, rate);
          const base64 = arrayBufferToBase64(buffer);
          const cacheDir = FileSystem.cacheDirectory;
          let uri: string;
          if (!cacheDir) {
            uri = `data:audio/mpeg;base64,${base64}`;
          } else {
            const path = `${cacheDir}tts-${hashKey(key)}.mp3`;
            try {
              await FileSystem.writeAsStringAsync(path, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              uri = path;
            } catch (error) {
              console.warn('TTS cache write failed, falling back to data URI:', error);
              uri = `data:audio/mpeg;base64,${base64}`;
            }
          }
          this.uriCache.set(key, uri);
          await this.evictTtsCacheIfNeeded();
          return uri;
        } catch (err) {
          console.warn('TTS getUri failed:', err);
          throw err;
        } finally {
          this.pending.delete(key);
        }
      })();
      this.pending.set(key, pending);
    }

    return this.pending.get(key)!;
  }

  /** Evict the least-recently-used entries (and their disk files) once over the cap (P3). */
  private async evictTtsCacheIfNeeded() {
    while (this.uriCache.size > MAX_TTS_CACHE_ENTRIES) {
      const oldestKey: string | undefined = this.uriCache.keys().next().value;
      if (oldestKey === undefined) break;
      const uri = this.uriCache.get(oldestKey);
      this.uriCache.delete(oldestKey);
      if (uri && !uri.startsWith('data:')) {
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch {
          // Best effort — file may already be gone or in use.
        }
      }
    }
  }

  preload(text: string, voice: VoiceName, rate = 1) {
    this.getUri(text, voice, rate).catch(() => {});
  }

  async stop() {
    await runExclusive(() => this.stopCore());
  }

  private async stopCore() {
    if (this.karaokeTimer) {
      clearInterval(this.karaokeTimer);
      this.karaokeTimer = null;
    }
    const sound = this.sound;
    if (sound) {
      // Clear the reference first so a re-entrant op never touches a unloading sound.
      this.sound = null;
      try {
        // Keep the status callback attached through unload so any speak()/karaoke
        // promise awaiting this sound resolves on the unload event instead of timing out.
        await sound.stopAsync();
        await sound.unloadAsync();
        sound.setOnPlaybackStatusUpdate(null);
      } catch {
        // ignore
      }
    }
  }

  /** Tear down a specific sound once playback ends, without clobbering a newer one. */
  private async releaseSound(sound: Audio.Sound) {
    if (this.sound === sound) {
      await this.stopCore();
      return;
    }
    // Superseded by a newer playback (which already owns the karaoke timer); just
    // make sure this sound is gone.
    try {
      await sound.unloadAsync();
      sound.setOnPlaybackStatusUpdate(null);
    } catch {
      // already unloaded
    }
  }

  async speak(text: string, voice: VoiceName, rate = 1): Promise<void> {
    // Fetch the audio outside the lock so network latency never blocks other audio ops.
    const uri = await this.getUri(text, voice, rate);
    const sound = await runExclusive(async () => {
      await this.stopCore();
      await this.configureForPlaybackCore();
      const created = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      this.sound = created.sound;
      return created.sound;
    });
    try {
      await Promise.race([
        this.waitForPlaybackToFinish(sound),
        timeout(15000, 'TTS playback timed out'),
      ]);
    } finally {
      await runExclusive(() => this.releaseSound(sound));
    }
  }

  async playWithKaraoke(
    text: string,
    voice: VoiceName,
    wordCount: number,
    onWord: (index: number) => void,
    rate = 0.9,
  ): Promise<void> {
    const uri = await this.getUri(text, voice, rate);
    const sound = await runExclusive(async () => {
      await this.stopCore();
      await this.configureForPlaybackCore();
      const created = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      this.sound = created.sound;

      let wordIndex = 0;
      onWord(0);
      // Created inside the lock so a superseding stopCore() reliably clears it.
      this.karaokeTimer = setInterval(async () => {
        try {
          const status = await created.sound.getStatusAsync();
          if (!status.isLoaded || !status.isPlaying) return;
          const duration = status.durationMillis ?? wordCount * 500;
          const nextIndex = Math.min(
            wordCount - 1,
            Math.floor((status.positionMillis / duration) * wordCount),
          );
          if (nextIndex !== wordIndex) {
            wordIndex = nextIndex;
            onWord(wordIndex);
          }
        } catch {
          // Sound was unloaded/superseded between ticks — getStatusAsync rejects; ignore.
        }
      }, 80);

      return created.sound;
    });
    try {
      const maxDuration = Math.max(15000, wordCount * 1500);
      await Promise.race([
        this.waitForPlaybackToFinish(sound),
        timeout(maxDuration, 'TTS karaoke playback timed out'),
      ]);
    } finally {
      await runExclusive(() => this.releaseSound(sound));
    }
  }

  private waitForPlaybackToFinish(sound: Audio.Sound): Promise<void> {
    return new Promise((resolve, reject) => {
      let startedPlaying = false;
      let stallTimer: ReturnType<typeof setTimeout> | null = null;
      const clearStall = () => {
        if (stallTimer) {
          clearTimeout(stallTimer);
          stallTimer = null;
        }
      };
      const settle = (fn: () => void) => {
        clearStall();
        fn();
      };

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          // Unloaded: finished naturally, or stopped/superseded by another op. Done either way.
          if ('error' in status && status.error) settle(() => reject(new Error(String(status.error))));
          else settle(() => resolve());
          return;
        }
        if ('error' in status && status.error) {
          settle(() => reject(new Error(String(status.error))));
          return;
        }
        if (status.didJustFinish) {
          settle(() => resolve());
          return;
        }
        if (status.isPlaying) {
          startedPlaying = true;
          clearStall();
          return;
        }
        // Was playing, now paused before finishing — almost always an iOS audio interruption
        // (incoming call, Siri, another app grabbing audio). Resolve shortly instead of blocking
        // for the full playback timeout; the next speak() reconfigures the session and recovers.
        if (startedPlaying) {
          clearStall();
          stallTimer = setTimeout(() => settle(() => resolve()), 1500);
        }
      });
    });
  }
}

export const ttsService = new TtsService();
