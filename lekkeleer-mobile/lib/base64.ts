const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** React Native (Hermes) may not provide `btoa` — encode MP3 bytes safely. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof globalThis.btoa === 'function') {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    try {
      return globalThis.btoa(binary);
    } catch {
      // fall through to manual encoder
    }
  }

  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += BASE64[a >> 2];
    result += BASE64[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < bytes.length ? BASE64[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < bytes.length ? BASE64[c & 63] : '=';
  }
  return result;
}
