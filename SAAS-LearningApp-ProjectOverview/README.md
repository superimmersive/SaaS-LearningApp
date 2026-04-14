# SaaS Learning App – Project Overview

A visual web-based overview of the LekkeLeer project: roadmap, strategy, content pipeline, school licences, and proposals.

**Audience:** Quick orientation, planning, funders, collaborators, future you.

## Local preview

```bash
cd SAAS-LearningApp-ProjectOverview
python -m http.server 8081
# Open http://localhost:8081
```

Or open `index.html` directly in a browser.

## Deploy to GitHub Pages

1. Push this folder to a new repo: `SAAS-LearningApp-ProjectOverview`
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` (or `master`), folder: `/ (root)`
5. Save – your site will be at `https://<username>.github.io/SAAS-LearningApp-ProjectOverview/`

## Structure

- **index.html** – Hub with links to all topics
- **roadmap.html** – 1:1 match with `lekkeleer-lees/docs/ROADMAP.md`
- **strategy.html** – Monetization (Lumi Plus, school licences)
- **content-pipeline.html** – Curriculum structure (Afrikaans, English, Maths)
- **school-licences.html** – School tiers, teacher dashboard, data model
- **proposals.html** – Funding proposals

## Updating

Content is self-contained. Update `index.html` when roadmap, strategy, or content changes. Sync key points from `lekkeleer-lees/docs/ROADMAP.md` as needed.
