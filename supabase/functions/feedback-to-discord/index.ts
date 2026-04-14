/**
 * Feedback to Discord — Forwards user feedback to Discord webhook.
 * No database; just posts to Discord.
 */

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

  const webhookUrl = Deno.env.get("DISCORD_FEEDBACK_WEBHOOK");
  if (!webhookUrl) {
    console.error("DISCORD_FEEDBACK_WEBHOOK not set");
    return jsonResponse({ error: "Feedback service not configured" }, 500);
  }

  let body: { message?: string; userId?: string; displayName?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const message = body?.message?.trim();
  if (!message) {
    return jsonResponse({ error: "Missing or empty message" }, 400);
  }

  if (message.length > 1900) {
    return jsonResponse({ error: "Message too long" }, 400);
  }

  const userId = body?.userId || "—";
  const displayName = body?.displayName || "—";
  const time = new Date().toISOString();

  // Plain text uses full chat width; embeds are fixed-width and feel cramped
  const discordPayload = {
    username: "LekkeLeer Feedback",
    content: [
      "💬 **New feedback**",
      "",
      `> ${message.replace(/\n/g, "\n> ")}`,
      "",
      `**User:** ${displayName}`,
      `**ID:** ${userId}`,
      `**Time:** ${time}`,
    ].join("\n"),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Discord webhook error:", res.status, text);
      return jsonResponse({ error: "Failed to send to Discord" }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error("Feedback proxy error:", err);
    return jsonResponse({ error: "Feedback request failed" }, 500);
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
