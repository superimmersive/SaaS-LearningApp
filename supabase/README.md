# Supabase SQL scripts

Run these in **Supabase → SQL Editor** in order.

| File | When to use |
|------|-------------|
| `01_tables.sql` | Fresh project — creates all tables |
| `02_rls.sql` | After tables — enables RLS and policies |
| `03_feedback_fix.sql` | If feedback table exists but inserts fail |
| `04_stats_queries.sql` | Reference — copy queries as needed (read-only) |

**Fresh setup:** Run `01_tables.sql` then `02_rls.sql`.

**Feedback broken, table already exists:** Run `03_feedback_fix.sql` only.

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `functions/tts-proxy` | Proxies TTS to Azure Speech REST API (keeps key server-side) |
| `functions/feedback-to-discord` | Forwards feedback to Discord webhook |

**TTS:** `npm run deploy:tts` — Secret: `AZURE_SPEECH_KEY`  
**Feedback:** `npm run deploy:feedback` — Secret: `DISCORD_FEEDBACK_WEBHOOK`
