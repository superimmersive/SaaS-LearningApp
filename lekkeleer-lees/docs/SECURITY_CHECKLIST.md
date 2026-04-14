# LekkeLeer – Security Checklist

## Quick checklist

| Action | Priority | Status |
|--------|----------|--------|
| Move Azure TTS key behind a backend | High | ✅ Done |
| Add .gitignore for env files with secrets | Medium | ✅ Done |
| Add a short privacy note in About | Medium | ⬜ Todo |
| Protect or hide the Admin dashboard | Medium | ✅ Done (URL token) |
| Review Supabase RLS (who can read what) | Medium | ✅ Done |
| Add rate limiting for feedback | Low | ⬜ Todo |

---

## What's already in good shape

| Item | Status |
|------|--------|
| HTTPS on GitHub Pages | ✅ |
| No passwords or sensitive PII | ✅ |
| Supabase RLS enabled | ✅ |
| Anonymous users with UUIDs (no account takeover) | ✅ |
| Microphone only used when user explicitly starts reading | ✅ |
| Azure TTS key server-side (Supabase Edge Function) | ✅ |

---

## Security risks for users (testers)

### 1. Microphone access

**Risk:** The app requests microphone permission for speech recognition.

**Mitigation:** Browsers show a permission prompt; users must approve. Use HTTPS (e.g. GitHub Pages) so the prompt appears. No audio is sent to your servers; it goes to the browser's speech API (e.g. Google).

---

### 2. Data stored about them

**Risk:** You store: user ID, display name, sessions, sentence results, feedback.

**Mitigation:** No passwords or sensitive PII. Consider a short privacy note (e.g. in About) explaining what you store and why.

---

### 3. Third-party services

**Risk:** Azure TTS (your backend), Google speech recognition (browser), Google Fonts.

**Mitigation:** Mention these in your About/Privacy section so testers know which services are used.

---

### 4. Link sharing

**Risk:** Links are plain URLs; no auth.

**Mitigation:** For early testing this is usually fine. If you want to limit access, you could add a simple shared password or token in the URL (e.g. `?token=xyz`), validated by a small backend or Supabase Edge Function.

---

## Next steps

1. **Privacy note** – Add a short note in About explaining stored data and third-party services.
2. **Rate limiting** – Optional: limit feedback submissions per user/session to reduce abuse.
