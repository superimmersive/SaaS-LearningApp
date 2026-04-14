# LekkeLeer – Config Reference

Secrets and tokens used in this project. Keep this file private if you share the repo.

---

## Admin dashboard token

**Token:** `ll-admin-2024`

**Used for:** URL protection on `admin.html`. Access: `admin.html?token=ll-admin-2024`

**Where to update:** Change in `admin.js` — `ADMIN_TOKEN` constant. (Admin link is not shown in the app; use direct URL.)

---

## Supabase

- **Project URL:** `https://taiwqvydfhlkyjguunrb.supabase.co`
- **Anon key:** In `db.js` and `admin.js`
- **Secrets (Edge Functions):** `AZURE_SPEECH_KEY` — set via `supabase secrets set`

---

## Azure Speech

- **Region:** West Europe
- **Key:** Stored in Supabase secret `AZURE_SPEECH_KEY` (not in code)

---

## Feedback (Discord)

- **Edge Function:** `feedback-to-discord`
- **Secret:** `DISCORD_FEEDBACK_WEBHOOK` — your Discord webhook URL
- **Deploy:** `npm run deploy:feedback`
