/**
 * TTS Proxy — Azure Speech REST API
 * Keeps the Azure API key server-side. Client sends SSML, receives audio.
 */

const AZURE_REGION = "westeurope";
const AZURE_ENDPOINT = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const OUTPUT_FORMAT = "audio-24khz-96kbitrate-mono-mp3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
      status: 204,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const key = Deno.env.get("AZURE_SPEECH_KEY");
  if (!key) {
    console.error("AZURE_SPEECH_KEY not set");
    return jsonResponse({ error: "TTS service not configured" }, 500);
  }

  let body: { ssml?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const ssml = body?.ssml;
  if (!ssml || typeof ssml !== "string") {
    return jsonResponse({ error: "Missing or invalid ssml" }, 400);
  }

  if (ssml.length > 50_000) {
    return jsonResponse({ error: "SSML too long" }, 400);
  }

  try {
    const azureRes = await fetch(AZURE_ENDPOINT, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
        "User-Agent": "LekkeLeer-TTS/1.0",
      },
      body: ssml,
    });

    if (!azureRes.ok) {
      const text = await azureRes.text();
      console.error("Azure TTS error:", azureRes.status, text);
      return jsonResponse(
        { error: "TTS synthesis failed", details: text.slice(0, 200) },
        azureRes.status
      );
    }

    const audio = await azureRes.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    console.error("TTS proxy error:", err);
    return jsonResponse({ error: "TTS request failed" }, 500);
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(obj: object, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
  });
}
