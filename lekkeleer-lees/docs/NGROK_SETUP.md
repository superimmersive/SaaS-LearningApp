# ngrok setup for mobile testing

Use ngrok to get an HTTPS URL so Chrome on Android allows microphone access.

## 1. One-time setup (authtoken)

1. Sign up at [ngrok.com](https://ngrok.com) (free).
2. Copy your authtoken from the dashboard.
3. Run:
   ```
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

## 2. Start the app and ngrok

**Terminal 1** — start the Python server:
```
cd lekkeleer-lees
python -m http.server 8080
```

**Terminal 2** — start ngrok:
```
ngrok http 8080
```

If `ngrok` is not recognized, use the full path:
```
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http 8080
```

## 3. Use the HTTPS URL

ngrok will show something like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8080
```

Open that **https://** URL on your Android device. Chrome will treat it as secure and allow the microphone.

## Notes

- The ngrok URL changes each time you restart ngrok (unless you have a paid plan).
- Keep both terminals running while testing.
- You may need to accept an ngrok interstitial page the first time you visit.
