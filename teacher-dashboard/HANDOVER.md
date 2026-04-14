# Handover – Teacher Dashboard (for dedicated agent)

Context for an agent taking over design and/or implementation of the Lumi Schools Teacher Dashboard.

---

## What this is

The **Teacher Dashboard** is the Lumi Schools interface for teachers. It lets them:
1. **Set homework** – Map out what the class should work on each week (Term › Week › Subject › Activity)
2. **View progress** – See which learners have completed the assigned work (sentences, stars, time)

Conceptually it’s like the **admin portal** (`lekkeleer-lees/admin.html`) but scoped to the teacher’s school/classes only. Same patterns (tables, stats, charts) but filtered by school/class and curriculum-focused.

---

## Location

```
SaaS_LearningApp/
├── lekkeleer-lees/           # Main app (includes admin.html)
├── SAAS-LearningApp-ProjectOverview/
├── Proposals/
└── teacher-dashboard/       # ← This folder (design & specs)
```

---

## Key concepts

### Scope
- **Admin:** Sees all users across the platform
- **Teacher:** Sees only learners in their school (or their classes in Medium tier)

### Two main functions
| Function | Description |
|----------|-------------|
| **Homework mapping** | Teacher sets Term › Week › Subject › Activity as the class focus. Learners see this when they log in at home. |
| **Progress view** | Teacher sees who’s done the assigned work – sentences completed, stars, time per learner. |

### Flow
1. Teacher logs in → Dashboard
2. Sets "This week's focus: Term 1, Week 3, Afrikaans, Lees sinne"
3. Saves/publishes
4. Learners at home open LekkeLeer → see "Your homework: Week 3 – Lees sinne"
5. Learners do activities → progress syncs to teacher's view
6. Teacher sees who’s on track, who’s behind

---

## Tiers (from Lumi Schools)

| Tier | Learners | Teacher dashboard features |
|------|----------|----------------------------|
| **Small** | Up to 100 | List learners, per-learner progress, week filter. Single class or flat list. |
| **Medium** | 101–400 | Multiple classes (1A, 1B, 2A), class stats, CSV/Excel export, homework per class. Onboarding session. |
| **Large** | 401+ | Grade-level reporting, custom content requests, dedicated account manager. |

---

## Data model (planned)

```
schools       → name, licence tier, expiry, capacity
classes       → class name, grade, school_id
school_users  → links teachers to schools
class_learners → links learners to classes
```

**Homework assignment** (to be designed):
- Needs a table or field for "class X, week Y, focus = Term 1 Week 3 Afrikaans Lees sinne"
- Learners fetch this when they log in to know what to practice

---

## Reference: current admin portal

- **File:** `lekkeleer-lees/admin.html`
- **Logic:** `lekkeleer-lees/admin.js`
- **Protected by:** URL token `?token=ll-admin-2024`
- **Shows:** Total users, sentences completed, feedback count, daily active users chart, completions per week, accuracy per week, all users table, recent feedback

Reuse layout patterns (cards, charts, tables) but:
- Filter by school/class
- Add homework picker (Term › Week › Subject › Activity)
- Curriculum columns (week, sentences, stars) instead of raw platform metrics

---

## Suggested next steps

1. **Wireframes** – HTML mockups of main screens (homework picker, progress table)
2. **Specs** – Screen-by-screen spec, tier-by-tier features
3. **Data schema** – Define homework/assignment table(s) for Supabase
4. **Integration** – When to build into lekkeleer-lees vs separate app (open question in ROADMAP)

---

## Related

- **Lumi Schools:** `SAAS-LearningApp-ProjectOverview/phase-5.html`, `monetization.html`
- **Roadmap:** `lekkeleer-lees/docs/ROADMAP.md` Phase 4
- **Overview:** `SAAS-LearningApp-ProjectOverview/overview.html` – in-class, homework, home-schooling

---

*Last updated: 2026-03-09*
