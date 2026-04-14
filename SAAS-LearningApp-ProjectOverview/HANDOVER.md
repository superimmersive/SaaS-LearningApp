# Handover – Project Overview (for new agent)

Context for an agent taking over work on this Project Overview site.

---

## What this is

A **visual wiki** for the SaaS Learning App (LekkeLeer) – a static web-based overview for orientation, planning, funders, collaborators, and future reference.

**Audience:** Quick orientation, planning, decision-making, funders, collaborators, future you.

---

## Location & structure

```
SAAS-LearningApp-ProjectOverview/
├── index.html          # Hub – links to all topics
├── roadmap.html        # 1:1 match with lekkeleer-lees/docs/ROADMAP.md
├── strategy.html       # Monetization (Lumi Plus, school licences)
├── content-pipeline.html
├── school-licences.html
├── proposals.html
├── css/styles.css
├── README.md
└── HANDOVER.md         # This file
```

---

## Source of truth

- **Roadmap:** `lekkeleer-lees/docs/ROADMAP.md` – roadmap.html should stay in sync
- **Proposals:** `SaaS_LearningApp/Proposals/` – funding docs live there
- **Main app:** `lekkeleer-lees/` – the actual LekkeLeer reading app

---

## Tech

- Static HTML + CSS, no build step
- Fonts: Baloo 2 + Nunito (matches LekkeLeer)
- Styling: Aligned with LekkeLeer (light theme, navy header, yellow accents)
- Local preview: `python -m http.server 8081` (8080 is used by lekkeleer-lees)
- Deploy: GitHub Pages (push to repo, enable Pages from main branch)

---

## Current state

- Nav: LekkeLeer logo + "Project Overview" badge + links to all pages
- Roadmap page: Full 1:1 content from ROADMAP.md (phases, tables, open questions)
- Strategy: Lumi Plus (R79/mo, R599/yr) + school tiers
- Content pipeline: Curriculum tree (Afrikaans ✓, English, Maths)
- School licences: Small/Medium/Large tiers, teacher dashboard scope
- Proposals: Points to Proposals folder

---

## What to do when ROADMAP.md changes

1. Open `lekkeleer-lees/docs/ROADMAP.md`
2. Update `roadmap.html` to match (sections, tables, phases)
3. If monetization changes, update `strategy.html` and `school-licences.html`

---

## Links (placeholders)

The Links section on index.html has `#` placeholders. Update with real URLs when:
- Live app is deployed
- Repo URL is known
- Proposals folder has a shareable path

---

## Related

- **lekkeleer-lees** – Main app (another agent may focus here)
- **Proposals/** – Funding proposal documents
