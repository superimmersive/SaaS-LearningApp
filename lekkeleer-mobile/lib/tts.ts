import { AZURE_VOICES, SUPABASE_ANON_KEY, SUPABASE_URL, type VoiceName } from './config';

function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildTtsCacheKey(text: string, voice: VoiceName, rate = 1): string {
  return `${voice}|${rate}|${text}`;
}

/** Fetch MP3 audio from Supabase tts-proxy (Azure Speech, server-side key). */
export async function synthesizeSpeech(
  text: string,
  voice: VoiceName = 'Adri',
  rate = 1,
): Promise<ArrayBuffer> {
  const ratePercent = rate === 1 ? '+0%' : `${Math.round((rate - 1) * 100)}%`;
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='af-ZA'>
    <voice name='${AZURE_VOICES[voice]}'>
      <prosody rate='${ratePercent}'>${escapeXml(text)}</prosody>
    </voice>
  </speak>`;

  // Abort a stalled synthesis request. speak()/playWithKaraoke() await this BEFORE taking the
  // audio lock, so without a bound a dead network would hang playback forever and leave the
  // caller's busy flags stuck — silently blocking all further TTS until an app restart.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/tts-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ssml }),
        signal: controller.signal,
      });
    } catch (error) {
      const reason = controller.signal.aborted
        ? 'time-out (15s)'
        : error instanceof Error
          ? error.message
          : String(error);
      throw new Error(`TTS network failed: ${reason}`);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`TTS failed (${res.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`);
    }

    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}
