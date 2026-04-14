/**
 * Persistent TTS audio cache using IndexedDB.
 * Stores audio blobs and word boundaries so users don't re-synthesize on refresh.
 */

const DB_NAME = 'lekkeleer_tts';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/** @returns {Promise<Set<string>>} all keys stored in IndexedDB */
export async function keys() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve(new Set(req.result));
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[TTS cache] keys failed:', e.message);
    return new Set();
  }
}

/**
 * @param {string} key
 * @returns {Promise<{ blob: Blob, wordBoundaries: Array } | null>}
 */
export async function get(key) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => {
        const row = req.result;
        if (!row?.data) {
          resolve(null);
          return;
        }
        const blob = row.data instanceof Blob
          ? row.data
          : new Blob([row.data], { type: 'audio/wav' });
        resolve({
          blob,
          wordBoundaries: row.wordBoundaries || [],
        });
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[TTS cache] get failed:', e.message);
    return null;
  }
}

/**
 * @param {string} key
 * @param {Blob} blob
 * @param {Array} wordBoundaries
 */
export async function set(key, blob, wordBoundaries = []) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      store.put({ key, data: blob, wordBoundaries });
    });
  } catch (e) {
    console.warn('[TTS cache] set failed:', e.message);
  }
}
