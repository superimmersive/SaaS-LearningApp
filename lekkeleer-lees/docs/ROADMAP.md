# LekkeLeer – Roadmap

A phased plan from MVP to monetization, including the Expo (React Native) port and subscription tiers.

---

## Current phase: MVP

**Status:** Early access, gathering feedback.

**Done:**
- 8 weeks Afrikaans reading (Lees saam)
- Tap-to-hear, Speel (karaoke), Begin Lees (speech recognition)
- Supabase sync, progress, stats
- In-app feedback → Discord
- TTS cache (IndexedDB)
- Breadcrumb picker (Term › Week › Subject › Activity)

**In progress / next:**
- [ ] Woorde flashcard section (`words.html` + `words.js`)
- [ ] Stability and polish based on feedback

---

## Phase 1: MVP completion

**Goal:** Solid free tier before monetization.

| Item | Notes |
|------|------|
| Woorde flashcard section | Afrikaans word + TTS, flip for English, week selector |
| Unlock Term 2–4 content | As content is ready |
| English activities | When content is ready |
| Spell woorde | When content is ready |
| Bug fixes & UX polish | From user feedback |

### Curriculum structure expansion

Expand from Afrikaans reading only to full subject/activity structure:

```
Term 1 → Week 1 → Afrikaans
  - Lees sinne (reading sentences) — CURRENT
  - Spell woorde (spelling words)

Term 1 → Week 1 → English (locked)
  - Reading sentences
  - Spelling words

Term 1 → Week 1 → Maths/Wiskunde (locked)
  - Addition, subtraction, multiply, divide
```

**Key decisions:**
- Navigation: tab-based (subject row + activity row) vs card-based landing page
- Data structure: nested CURRICULUM object (term > week > subject > activity)
- Reuse: reading engine shared for Afrikaans & English (swap TTS voice + recognition lang)
- Spelling: new interaction mode (reuse tap-to-hear)
- Maths: new interaction type (problem cards, input/answer flow)

---

## Phase 2: Auth & Lumi Plus foundation

**Goal:** Enable parent subscriptions (Lumi Plus).

| Item | Notes |
|------|------|
| Supabase Auth | Email/password or magic link for parents |
| Subscription state | Stripe or RevenueCat integration |
| Paywall logic | Gate premium features behind subscription |
| Free vs Plus feature split | Define what stays free vs paid |

**Lumi Plus features (from monetization strategy):**
- Full content library
- iOS + Android native app
- Offline mode (cached audio)
- Progress dashboard
- Priority feature access (annual)
- Founding family badge (annual)

---

## Phase 3: Expo / React Native port

**Goal:** Native iOS and Android apps for Lumi Plus subscribers.

| Item | Notes |
|------|------|
| Expo project setup | `expo init` or `create-expo-app` |
| Shared core | Extract TTS, speech, content, sync into shared modules |
| React Native Web | Keep web app in same repo if desired |
| Native TTS | `expo-speech` or Azure Speech SDK |
| Native speech recognition | Fix iOS limitation (no Web Speech API) |
| Offline caching | Native storage for audio + content |
| Supabase client | Same backend, add auth + subscription checks |
| App Store / Play Store | Listing, screenshots, metadata |

**Why Expo:**
- Single codebase for iOS + Android
- Over-the-air updates
- Easier native module integration
- Good path from web to native

---

## Phase 4: School licences

**Goal:** Annual school tiers with teacher dashboard.

| Item | Notes |
|------|------|
| Multi-tenant model | Schools, classes, learners |
| Teacher admin dashboard | Beyond current admin; class/learner views |
| Per-learner progress | Already have sentence_results; add school/class linkage |
| Class-wide stats & exports | Medium tier |
| Grade-level reporting | Large tier |
| Onboarding sessions | Medium tier |
| Custom content requests | Large tier |
| Dedicated account manager | Large tier |
| SLA-backed uptime | Large tier |

---

## Monetization tiers (reference)

### School licences – annual, per school

| Tier | Price | Learners | Key features |
|------|-------|----------|--------------|
| Small | R8,500/yr | Up to 100 | CAPS content, Afrikaans + English, teacher dashboard, per-learner progress, email support |
| Medium | R16,000/yr | 101–400 | + Multi-class, class stats/exports, priority support, onboarding |
| Large | R26,000/yr | 401+ | + Grade-level reporting, custom content, dedicated account manager, SLA |

### Parent subscription – Lumi Plus

| Plan | Price | Key features |
|------|-------|--------------|
| Monthly | R79/mo | Full content, iOS + Android app, offline mode, progress dashboard |
| Annual | R599/yr | Same + priority feature access, founding family badge (≈ R49.90/mo, 37% savings) |

---

## Suggested timeline (high level)

```
MVP completion     →  Woorde, polish, more content
       ↓
Auth + Lumi Plus   →  Supabase Auth, Stripe/RevenueCat, paywall
       ↓
Expo port          →  Native apps for Lumi Plus
       ↓
School licences    →  Multi-tenant, teacher dashboard, school tiers
```

---

## Open questions

- [ ] Stripe vs RevenueCat for subscriptions?
- [ ] Keep web app free forever, or freemium with limits?
- [ ] School licence: separate app or same app with role-based access?
- [ ] Content pipeline: who creates Term 2–4, English, Maths?

---

*Last updated: 2026-03-09*
