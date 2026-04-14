# Feedback troubleshooting

Feedback is sent via the **feedback-to-discord** Edge Function → Discord webhook (not a Supabase table).

If "Your feedback" fails to send, check the following.

## 1. Console errors (F12 → Console)

Open DevTools and try sending feedback. Look for:
- `[Lumi DB] Feedback failed: 404` → Edge Function not deployed
- `[Lumi DB] Feedback failed: 500` → Check `DISCORD_FEEDBACK_WEBHOOK` secret in Supabase
- `[Lumi DB] Feedback network error` → CORS or offline

## 2. Edge Function setup

1. **Deploy:** `npm run deploy:feedback`
2. **Set secret:** In Supabase Dashboard → Edge Functions → feedback-to-discord → Secrets, add `DISCORD_FEEDBACK_WEBHOOK` with your Discord webhook URL
3. **Verify:** Send a test message; it should appear in your Discord channel

## 3. CORS

Feedback is sent from the browser to your Supabase project. Supabase allows CORS from any origin for the anon key. If you host on a custom domain, ensure it's not blocked.

## 4. Name required

Feedback requires a display name. If the user hasn't set one, the app shows "Set your name first" before allowing feedback.
