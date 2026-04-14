# LekkeLeer

Afrikaans reading practice app for Grade 1–3 learners. Dashboard shows activities per week (Lees saam, Spell woorde). Tap words to hear them, read aloud with speech recognition, and track progress week by week.

## Quick start

```bash
cd lekkeleer-lees
python -m http.server 8080
# Open http://localhost:8080
```

## Project structure

```
lekkeleer-lees/
├── index.html, dashboard.html, words.html, about.html, stats.html, admin.html  # App pages
├── app.js, dashboard.js, words.js, db.js, user.js, stats.js, admin.js         # Core logic
├── ttsCache.js                                     # TTS audio cache
├── styles.css                                       # Shared styles
├── docs/                                            # Documentation
│   ├── CONFIG.md                    # Secrets & config reference
│   ├── FEEDBACK_TROUBLESHOOTING.md  # Feedback debugging
│   ├── NGROK_SETUP.md               # Mobile testing (HTTPS)
│   ├── ROADMAP.md                   # Phased roadmap & monetization
│   ├── SECURITY_CHECKLIST.md        # Security notes
│   ├── SUPABASE_SETUP.md            # One-time Supabase setup
│   └── features.txt                 # Feature reference for prompts
├── scripts/
│   └── deploy-tts.ps1               # Deploy TTS Edge Function
├── supabase/                        # SQL migrations & Edge Functions
└── package.json
```

## Deploy

- **TTS:** `npm run deploy:tts`
- **Feedback:** `npm run deploy:feedback`

## Docs

See the `docs/` folder for setup, config, troubleshooting, and roadmap.
