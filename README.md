# Household Ledger — installable offline app

This is a PWA (installable web app). Once it's set up, it loads with **zero
network** and stores everything in the browser's local storage on your phone.

## One-time setup (5 minutes) — GitHub Pages

1. Go to https://github.com/new and create a new repository, e.g. `household-ledger`.
   Public is fine, no need for a paid plan.
2. On the repo page, click "Add file" → "Upload files", and upload all four
   files from this folder: `index.html`, `manifest.json`, `sw.js`, `icon.svg`.
   Commit the upload.
3. Go to the repo's **Settings → Pages**. Under "Build and deployment", set
   **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)`. Save.
4. Wait about a minute, then your app is live at:
   `https://<your-username>.github.io/household-ledger/`

## Install it on your phone

1. Open that URL in your phone's browser (Chrome on Android, Safari on iOS).
2. **Android (Chrome):** tap the ⋮ menu → "Install app" (or "Add to Home screen").
3. **iPhone (Safari):** tap the Share icon → "Add to Home Screen".
4. Open the app icon from your home screen once while you still have data —
   this lets the service worker cache everything for offline use.
5. From then on, turn off Wi-Fi/data and it still opens and works fully.

## Notes

- Data lives only on that phone, in that installed app. There's no sync
  across devices.
- Use the **Export backup** button occasionally to download a `.json` copy —
  useful if you ever switch phones or reinstall.
- If you ever update the app's code, bump `CACHE_NAME` in `sw.js` (e.g.
  `household-ledger-v2`) so the service worker knows to refresh the cache.
