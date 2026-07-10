import AsyncStorage from '@react-native-async-storage/async-storage';

const LEES_KEY = 'lekkeleer:lees:completed';

export async function loadLeesCompleted(weekIndex: number): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(`${LEES_KEY}:${weekIndex}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export async function saveLeesCompleted(weekIndex: number, completed: Set<number>): Promise<void> {
  try {
    await AsyncStorage.setItem(`${LEES_KEY}:${weekIndex}`, JSON.stringify([...completed]));
  } catch {
    // ignore storage errors
  }
}

/**
 * Wipe all LekkeLeer progress (every week's completed sentences). Returns how many stored keys
 * were removed so the caller can give feedback. Used by the Debug "Reset progress" action.
 */
export async function clearAllProgress(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith('lekkeleer:'));
    if (ours.length) await AsyncStorage.multiRemove(ours);
    return ours.length;
  } catch {
    return 0;
  }
}
