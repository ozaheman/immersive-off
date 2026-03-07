# Google Drive Integration Guide

This project now routes media/file storage through `js/database.js` so existing upload flows keep working while files are stored in Google Drive.

## What Was Integrated

- Central file APIs in `window.DB` now use Google Drive when enabled:
  - `DB.addFile(...)`
  - `DB.getFileById(...)`
  - `DB.getFiles(...)`
  - `DB.deleteFile(...)`
  - `DB.clearFilesBySource(...)`
- Folder structure is auto-created in Drive for recognition:
  - `<GOOGLE_DRIVE_ROOT_FOLDER>/<source>/<jobNo>/<category>/<subCategory>`
- Local fallback remains active:
  - If Drive upload/download/delete fails, app falls back to IndexedDB behavior.
- `.env` runtime loading added:
  - `database.js` tries to fetch `/.env` and parse values into `window.__ENV__`.

## Required `.env` Variables

These are now expected in `.env`:

```env
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
GOOGLE_DRIVE_ROOT_FOLDER=UrbanAxis Media
GOOGLE_DRIVE_STORE_LOCAL_CACHE=false
```

Notes:
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` is not used in this browser-only OAuth token flow.
- `GOOGLE_DRIVE_REDIRECT_URI` is not required by the current popup token flow.
- Keep `GOOGLE_DRIVE_STORE_LOCAL_CACHE=false` if you want Drive to be source-of-truth.
- Set it to `true` for offline-friendly previews (larger IndexedDB usage).

## Google Cloud Setup

1. Open Google Cloud Console and select your project.
2. Enable the **Google Drive API**.
3. Configure **OAuth consent screen** (External or Internal, as needed).
4. Create **OAuth 2.0 Client ID** for **Web application**.
5. Add Authorized JavaScript origins, for example:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
  - If you run on VS Code Live Server, also add `http://127.0.0.1:5500` and/or `http://localhost:5500`
6. Put the client ID into `.env` as `GOOGLE_DRIVE_OAUTH_CLIENT_ID`.

## How To Run Locally

Use a local HTTP server from project root so `/.env` can be fetched.

Example:

```bash
cd /Users/shvora/Downloads/immersive-off-main
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/index-v2.html`
- `http://localhost:8080/site_index.html`
- or any page that loads `js/database.js` and uses file uploads.

## Test Plan: Add/Remove Files From Drive

1. Start local server and open one of the pages above.
2. Perform a file upload in any existing upload UI (documents, photos, receipts, etc.).
3. On first upload, sign in to Google and grant Drive permission.
4. Open your Google Drive and verify folder creation:
   - `UrbanAxis Media/...`
   - Source/job/category/subcategory folders should exist.
5. Verify file is visible in UI immediately after upload.
6. Refresh page and confirm file is still retrievable and rendered.
7. Delete the file from the app UI.
8. Confirm file is removed from Drive and from UI.
9. Add a file directly in Drive under the expected folder path:
   - This app does not auto-index external Drive additions into IndexedDB records.
   - For UI visibility, files should be created through app upload flow.

## Behavior Details

- If Drive is enabled and upload succeeds:
  - File metadata is saved in IndexedDB with `driveFileId`.
  - `dataUrl` is optional based on `GOOGLE_DRIVE_STORE_LOCAL_CACHE`.
- If Drive is disabled or fails:
  - App stores/reads `dataUrl` locally as before.

## Troubleshooting

- OAuth popup blocked:
  - Allow popups for localhost.
- `Error 400: redirect_uri_mismatch` (or origin mismatch):
  - In Google Cloud Console, open your OAuth 2.0 Client ID and confirm it is type **Web application**.
  - Add the exact app origin you are using to **Authorized JavaScript origins**.
  - Common values: `http://localhost:8080`, `http://127.0.0.1:8080`, `http://localhost:5500`, `http://127.0.0.1:5500`.
  - Save, wait 1-2 minutes for propagation, hard refresh the app, then retry upload.
- `Google Drive API error (401/403)`:
  - Check OAuth client ID and authorized origins.
  - Confirm Drive API is enabled.
- No `.env` values detected:
  - Ensure app is served over HTTP, not opened with `file://`.
  - Verify `.env` is in project root.
- Upload works but preview missing after refresh:
  - Check network access to Drive download (`alt=media`).
  - Temporarily set `GOOGLE_DRIVE_STORE_LOCAL_CACHE=true` for debugging.
