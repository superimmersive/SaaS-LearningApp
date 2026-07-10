# LekkeLeer Mobile (Expo)

Native **iOS + Android** app for LekkeLeer. Shares Supabase and Azure TTS (`tts-proxy`) with the web app in `../lekkeleer-lees/`.

## Requirements

- **Node.js 20+** (Expo SDK 54 — works with App Store Expo Go)
- [Expo Go](https://expo.dev/go) on your phone for quick testing, or Android emulator / iOS Simulator

## Quick start

```bash
cd lekkeleer-mobile
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

**Begin Lees** (microphone + Azure speech-to-text) requires a **development build** — see below. Expo Go supports TTS, navigation, and flashcards only.

## Development build (Begin Lees / Azure STT)

Expo Go cannot load `expo-stream-audio` (PCM mic capture for Azure). Install the custom dev client once:

```bash
# Android (APK — sideload on device)
npx eas-cli build -p android --profile development --non-interactive

# iOS (requires Apple Developer account; install via link or TestFlight)
npx eas-cli build -p ios --profile development --non-interactive
```

After installing the dev client on your phone:

```bash
npm run start:dev
```

Scan the QR from the terminal with the **LekkeLeer dev app** (not Expo Go). Allow microphone permission when prompted.

Publish JS updates to the dev channel after code changes:

```bash
npx eas-cli update --branch development --environment production --message "Your message"
```

## Expo project

- **Open in Expo Go:** scan QR on [`../lekkeleer-lees/app.html`](../lekkeleer-lees/app.html) (uses EAS Update channel `main`)
- **Dashboard:** [expo.dev/accounts/superimmersive/projects/lekkeleer](https://expo.dev/accounts/superimmersive/projects/lekkeleer)
- **Project ID:** `831bca44-6312-45fe-976a-f840e6ac2f40`

Publish updates after code changes:

```bash
npx eas-cli update --branch main --environment production --message "Your message"
```

The website download page (`../lekkeleer-lees/app.html`) QR points at the Expo Go link above.

## Project structure

```
app/
  index.tsx    # Dashboard (week picker + activity cards)
  lees.tsx     # Lees saam (sentences, TTS, Begin Lees)
  spell.tsx    # Spell woorde (flashcards, TTS, Begin Lees)
lib/
  content/     # Week data (from web app)
  ttsService.ts
  config.ts    # Supabase URL + anon key
constants/
  theme.ts     # LekkeLeer colors + activity list
```

## Store builds (when ready)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure project: `eas build:configure`
4. Build:
   - Android: `eas build -p android --profile production`
   - iOS: `eas build -p ios --profile production`
5. Submit: `eas submit -p android` / `eas submit -p ios`

Project is linked: `@superimmersive/lekkeleer`.

## Roadmap

- [x] Port Lees saam UI + speech (Azure STT via device)
- [x] Port Spell woorde flashcards + Begin Lees
- [ ] Offline week download (FileSystem cache)
- [ ] Supabase progress sync (same as web)
- [ ] App Store / Play Store links on website (after launch)

## Web app

The browser version lives in [`../lekkeleer-lees/`](../lekkeleer-lees/). Add “Download app” buttons on the website once store listings are live.
