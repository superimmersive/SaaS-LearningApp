/**
 * Minimal `crypto.getRandomValues` polyfill for libraries that only need UUID entropy.
 * Avoids `react-native-get-random-values`, which requires an extra native module.
 */
type CryptoLike = {
  getRandomValues?: (array: ArrayBufferView | null) => ArrayBufferView | null;
};

const root = globalThis as { crypto?: CryptoLike };

if (!root.crypto) {
  root.crypto = {};
}

if (!root.crypto.getRandomValues) {
  root.crypto.getRandomValues = (array: ArrayBufferView | null) => {
    if (!array) return array;
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}
