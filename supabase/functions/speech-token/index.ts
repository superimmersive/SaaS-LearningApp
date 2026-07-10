/**
 * Azure Speech token proxy.
 * Keeps the subscription key server-side and returns a short-lived token to the app.
 */

// Region is configurable so we can move closer to users (e.g. "southafricanorth") to cut
// STT streaming latency. NOTE: AZURE_SPEECH_KEY must belong to a resource in this same region —
// the issueToken endpoint validates the key per-region. The region is also returned to the
// client below, so the mobile/web SDKs automatically stream to the matching region.
const AZURE_REGION = Deno.env.get("AZURE_SPEECH_REGION") ?? "westeurope";
const TOKEN_ENDPOINT = `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

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
    return jsonResponse({ error: "Speech service not configured" }, 500);
  }

  try {
    const azureRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Length": "0",
      },
    });

    if (!azureRes.ok) {
      const text = await azureRes.text();
      console.error("Azure token error:", azureRes.status, text);
      return jsonResponse(
        { error: "Speech token request failed", details: text.slice(0, 200) },
        azureRes.status,
      );
    }

    const token = await azureRes.text();
    return jsonResponse({ token, region: AZURE_REGION, expiresInSeconds: 540 }, 200);
  } catch (err) {
    console.error("Speech token proxy error:", err);
    return jsonResponse({ error: "Speech token request failed" }, 500);
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
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
