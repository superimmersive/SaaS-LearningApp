# Lumi — Supabase Setup Guide

One-time setup. Takes about 10 minutes.
Free tier is plenty for beta (500MB, 50k monthly active users).

---

## Step 1 — Create your Supabase project

1. Go to https://supabase.com and sign in (GitHub login is easiest)
2. Click "New project"
3. Name it: `lumi-beta`
4. Choose a strong database password (save it somewhere safe)
5. Region: **Europe (Frankfurt)** — closest to South Africa with good latency
6. Click "Create new project" — takes ~2 minutes to provision

---

## Step 2 — Create the database tables

Go to **SQL Editor** in the left sidebar. You can run the scripts from the `supabase/` folder:

- `supabase/01_tables.sql` — creates all tables (safe to re-run, uses `if not exists`)
- `supabase/02_rls.sql` — RLS policies (run after tables)

See `supabase/01_tables.sql` and `supabase/02_rls.sql` for the full SQL.

---

## Step 3 — Set up Row Level Security (RLS)

Run `supabase/02_rls.sql` in the SQL Editor. See that file for policies.

---

## Step 4 — Get your API keys

1. In Supabase, go to **Settings → API**
2. Copy **Project URL** and **anon public key**
3. Open `db.js` and replace the placeholder values at the top

---

## Step 4b — TTS proxy (Azure Speech key)

1. Create an Azure Speech resource (West Europe)
2. Deploy: `npm run deploy:tts` or `.\scripts\deploy-tts.ps1`
3. Set secret: `npx supabase secrets set AZURE_SPEECH_KEY=your_key --project-ref taiwqvydfhlkyjguunrb`

---

## Step 5 — Feedback (Discord)

1. Deploy: `npm run deploy:feedback`
2. Set secret: `DISCORD_FEEDBACK_WEBHOOK` with your Discord webhook URL

---

## File checklist

```
lekkeleer-lees/
  index.html, about.html, stats.html, admin.html
  app.js, db.js, user.js, stats.js, admin.js, ttsCache.js
  styles.css
  supabase/01_tables.sql, 02_rls.sql, ...
  docs/SUPABASE_SETUP.md   ← this file ✓
```
