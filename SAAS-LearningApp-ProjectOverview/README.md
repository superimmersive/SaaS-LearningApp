# LekkeLeer — Project Overview

A fresh, modern visual overview of the LekkeLeer project: what it is, the roadmap, the activity library, pricing, and proposals.

**Audience:** Quick orientation, planning, funders, collaborators, future you.

## Local preview

```bash
cd SAAS-LearningApp-ProjectOverview
python -m http.server 8081
# Open http://localhost:8081
```

Or open `index.html` directly in a browser.

## Tech

- Static HTML + CSS + a little vanilla JS — no build step.
- Fonts: Baloo 2 (display) + Nunito (body), matching the LekkeLeer app.
- Brand palette pulled from `lekkeleer-lees/styles.css` (sky / navy / yellow).
- **Light & dark themes** via a toggle in the nav (remembered in `localStorage`, defaults to system preference).
- **One shared navigation + footer**, injected by `js/site.js`, so the nav can never drift between pages. To add/rename a page, edit the `PAGES` / `PHASES` arrays in that file.

## Structure

```
SAAS-LearningApp-ProjectOverview/
├── index.html          # Landing page (hero, learning moments, hub, journey)
├── overview.html       # What LekkeLeer is, audience, status
├── roadmap.html        # One-page phased plan + visual timeline
├── activity-lib.html   # Filterable activity library
├── phase-1.html        # MVP completion
├── phase-2.html        # Auth & accounts foundation
├── phase-3.html        # Expo / React Native port
├── phase-4.html        # Lumi Plus (parent subscriptions)
├── phase-5.html        # Lumi Schools (school licences)
├── monetization.html   # Pricing: Lumi Plus & Lumi Schools
├── proposals.html      # Funding proposals
├── css/styles.css      # Design system
├── js/site.js          # Shared nav/footer, theme toggle, drawer, filters, reveal
└── README.md
```

## Source of truth

- **Roadmap:** `lekkeleer-lees/docs/ROADMAP.md` — keep `roadmap.html` and the phase pages in sync.
- **Proposals:** `SaaS_LearningApp/Proposals/`.
- **Main app:** `lekkeleer-lees/`.

## Deploy to GitHub Pages

1. Push this folder to a repo.
2. **Settings → Pages → Deploy from a branch.**
3. Branch: `main`, folder: `/ (root)`. Your site will be at `https://<username>.github.io/<repo>/`.

## Updating

- **Content:** edit the relevant page. Phase numbering is **1 MVP · 2 Auth · 3 Expo/Native · 4 Lumi Plus · 5 Lumi Schools** — keep it consistent across `roadmap.html`, the phase pages, and the hub on `index.html`.
- **Navigation:** edit `PAGES` / `PHASES` in `js/site.js` only.
- **Styling:** edit CSS custom properties at the top of `css/styles.css` (light theme under `:root`, dark theme under `:root[data-theme="dark"]`).
