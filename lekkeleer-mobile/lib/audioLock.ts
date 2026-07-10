/**
 * Global mutex for iOS audio-session transitions.
 *
 * expo-av (TTS playback) and expo-stream-audio (mic capture) share a single
 * AVAudioSession. When their start/stop/configure calls interleave, the
 * `setIsEnabledAsync` / `setCategory` calls collide and either wedge the mic
 * (OSStatus -50) or silently no-op the singleton recorder. Routing every
 * audio-session transition through `runExclusive` guarantees they run one at a
 * time, in submission order.
 *
 * IMPORTANT: never call `runExclusive` from inside another `runExclusive` task —
 * the inner call would wait for the outer to finish and deadlock. Helpers that
 * run inside a held lock are exposed as lock-free `*Unlocked` / `*Core` methods.
 *
 * HANG SAFETY: every task is wrapped in a watchdog timeout. Native audio calls
 * (Audio.setIsEnabledAsync, Sound.createAsync) and the Azure Speech SDK's
 * recognizer start/stop callbacks can, under accumulated session stress, never
 * settle. Without a timeout a single stuck task would leave `tail` pending
 * forever and silently wedge ALL future audio (TTS would just stop responding).
 * The watchdog forces the queue to advance so the system self-heals.
 */
const DEFAULT_LOCK_TIMEOUT_MS = 15000;

let tail: Promise<void> = Promise.resolve();

export function runExclusive<T>(
  task: () => Promise<T>,
  timeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS,
): Promise<T> {
  const run = tail.then(() => withTimeout(task, timeoutMs));
  // Keep the queue alive even if a task throws or times out, so one failure can't wedge the lock.
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Runs `task` but guarantees the returned promise settles within `ms`, even if
 * `task()` never resolves. A timed-out native call may still complete later in
 * the background; that is an acceptable trade against permanently freezing audio.
 */
function withTimeout<T>(task: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Audio lock task timed out after ${ms}ms`));
    }, ms);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    try {
      Promise.resolve(task()).then(
        (value) => finish(() => resolve(value)),
        (error) => finish(() => reject(error)),
      );
    } catch (error) {
      finish(() => reject(error));
    }
  });
}
