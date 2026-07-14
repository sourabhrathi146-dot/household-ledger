# Household Ledger — installable offline app with Google Drive backup

A PWA (installable web app) for tracking household expenses. Works fully
offline once installed, stores data on your phone, and can optionally back
up to your own Google Drive so you don't lose it if the phone is lost.

## Files in this folder

- `index.html` — the entire app (UI + logic)
- `sw.js` — service worker, makes it work offline. Its `CACHE_NAME` version
  number must be bumped every time `index.html` changes (see "Updating" below)
- `manifest.json` — makes it installable as a home-screen app
- `icon.svg` — the app icon

## One-time setup — GitHub Pages (5 minutes)

1. Go to https://github.com/new and create a repository, e.g. `household-ledger`.
   Public is fine, no paid plan needed.
2. On the repo page: "Add file" → "Upload files" → upload all four files
   above. Commit.
3. Repo **Settings → Pages** → under "Build and deployment", set
   **Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. Wait ~1 minute. The app is live at:
   `https://<your-username>.github.io/<repo-name>/`

## Install it on your phone

1. Open that URL in your phone's browser.
2. **Android (Chrome):** ⋮ menu → "Install app" (or "Add to Home screen").
3. **iPhone (Safari):** Share icon → "Add to Home Screen".
4. Open the app once while online so the service worker caches everything.
5. From then on it opens and works with zero internet.

## Google Drive backup — one-time setup (~5–10 minutes)

This is optional but recommended. Without it, your only backup is the
manual **Export backup** button.

1. Go to https://console.cloud.google.com → create a new project (any name).
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → User type **External** →
   fill in app name + your email → **Test users**: add your own Gmail →
   save through to the end.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → Application type **Web application**.
   - **Authorized JavaScript origins**: add `https://<your-username>.github.io`
     (just the domain, no path)
   - **Authorized redirect URIs**: add
     `https://<your-username>.github.io/<repo-name>/` (with the trailing
     slash, including the repo folder name)
   - Click **Create**, copy the **Client ID** (ends in
     `.apps.googleusercontent.com`). You do **not** need the Client Secret.
5. In `index.html`, find this line near the top of the `<script>` block:
   ```js
   const GOOGLE_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
   ```
   Replace it with your real Client ID. Re-upload `index.html` to GitHub.
6. On your phone, open the app's menu (hamburger icon, top right) →
   **Connect Google Drive**. First time, you'll see an "unverified app"
   warning — that's expected for a personal project; tap **Advanced → Go to
   Household Ledger (unsafe)** to continue.

Once connected, every add/edit/delete auto-syncs to a single file named
`household-ledger-backup.json` in your Drive (visible in your normal Drive,
not hidden). If you ever lose the phone, install the app fresh on a new one
and use **Restore from Drive** in the menu.

Sign-in occasionally expires and may ask you to reconnect — this is a real
limitation of a backend-less app (Google doesn't allow permanent silent
sign-in without a server). It's a single tap, not a big deal.

## What's in the menu (hamburger icon, top right)

- **Google Drive**: Connect / Sync now / Restore latest from Drive / Disconnect
- **Manual backup**: Export backup (.json) / Import backup (.json) — works
  with zero internet, zero sign-in. Worth using occasionally even with Drive
  connected, as an extra safety net.
- **Export**: Export to Excel (.csv) — every entry you've ever logged, all
  months, opens directly in Excel or Google Sheets.

## Updating the app in future

Whenever you change `index.html` (or ask Claude to), **you must also bump
the version number** in `sw.js`:
```js
const CACHE_NAME = "household-ledger-v8"; // increment this each update
```
Otherwise your phone will keep showing the old cached version. After
uploading both files to GitHub, fully close the browser tab (or uninstall/
reinstall the home-screen icon) so it picks up the new cache.

## Notes

- Data lives on the phone (and in Drive, if connected). There's no real-time
  sync between multiple phones/people — it's built for one person's use.
- If Google's OAuth setup ever needs redoing (policy changes, new device,
  etc.), bring this folder's `index.html` to a fresh Claude conversation and
  describe the exact error — the fix doesn't depend on this specific chat.
