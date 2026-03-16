# Copilot Instructions for UrbanAxis Immersive

## Project Overview
UrbanAxis Immersive is a full-stack web application for unified project and site management. It features a pluggable database architecture supporting IndexedDB (browser-only), MongoDB, and PostgreSQL backends.

**Key Tech Stack:**
- **Backend:** Node.js/Express (server/)
- **Frontend:** Vanilla JavaScript with modular architecture (js/, HTML pages)
- **Databases:** IndexedDB, MongoDB, PostgreSQL
- **Integrations:** Google Drive OAuth for file uploads, Google Services OAuth

## Running & Testing

### Start Development Server
```bash
npm run dev
# Runs with --watch for auto-restart on file changes (Node 18.11+)
# Server starts on PORT (default: 8080 or 8081 from .env)
```

### Start Production Server
```bash
npm start
# Single run: node server/index.js
```

### Configuration
1. Copy `.env.template` to `.env` in the repository root
2. Set `DB_PROVIDER` to one of:
   - `indexeddb` (browser-only, no server persistence)
   - `mongodb` (requires MONGODB_URI and MONGODB_DB_NAME)
   - `postgresql` (requires POSTGRES_URL and POSTGRES_SSL_MODE)
3. Set Google Drive credentials if using Google Drive integration
4. Set `PORT` (default: 8080)

### Health Check
```bash
curl http://localhost:8080/api/health
# Returns: { "ok": true, "provider": "...", "remoteEnabled": true/false }
```

## Architecture

### Database Abstraction Layer
Located in `server/db/`:

- **`index.js`**: Factory function `createAdapterFromEnv()` creates appropriate adapter based on `DB_PROVIDER`
- **`storeConfig.js`**: Centralized store definitions and metadata (17+ stores defined)
- **`adapters/mongoAdapter.js`**: MongoDB implementation
- **`adapters/postgresAdapter.js`**: PostgreSQL implementation

**How it works:**
- Environment selects which adapter to instantiate
- All adapters implement the same interface (getAll, getOne, insert, update, delete)
- Frontend always uses same `/api/db/:store` endpoints
- Adapter layer transparently handles provider switching

### Frontend Architecture

**Multi-page structure:**
- `index.html` - Main project management app (app.js)
- `site_index.html` - Site/office operations
- `client-app.html` - Client portal
- `bim_designer.html`, `design+center.html`, etc. - Specialized dashboards

**Module Pattern:**
Each major feature is a module with clear initialization and render:
```javascript
const MyModule = (() => {
    async function init(config, appContext) { /* setup */ }
    async function render(jobNo, containerElement, context) { /* display */ }
    return { init, render };
})();
```

**Core Modules:**
- Browser-side: `js/database.js` (IndexedDB client)
- Site features: `js/site_modules/` (RFI, MOM, Materials, Bulletin, Budget, etc.)
- Project tabs: `js/project_tabs/` (Letters, Invoices, HR, etc.)

**Key App State (app.js):**
- `App.currentProjectJobNo` - Currently selected project
- `App.DOMElements` - Cached DOM references
- `App.ProjectTabs` - All loaded tab modules
- `App.Bulletin`, `App.DashboardCalendar` - Feature modules

### Data Stores (IndexedDB + Server)
Defined in `server/db/storeConfig.js`. Key stores:

| Store | Key Path | Purpose |
|-------|----------|---------|
| `projects` | jobNo | Project master data |
| `siteData` | jobNo | Site-specific data (BOQ, payments, tasks) |
| `files` | id (auto) | File metadata for Drive uploads |
| `hrData` | id (auto) | Staff, leaves, attendance |
| `designScrum` | jobNo | Design sprint tracking |
| `letterDrafts` | id (auto) | Draft letters |
| `sentLetters` | id (auto) | Sent letters (archive) |

For full list, see `server/db/storeConfig.js` STORES constant.

## Key Conventions

### Const Reassignment Protection
**Issue:** JavaScript const cannot be reassigned. Common in this codebase:
```javascript
// ❌ WRONG - will throw TypeError
let siteData = undefined;
siteData = { jobNo, boq: [] };  // Error if siteData was const

// ✅ RIGHT - create new variable
const validSiteData = siteData || { jobNo, boq: [] };
```
See `BUG_FIXES_2026-02-17.md` for real examples.

### Template Loading Fallback Chain
Letters use fallback loading for flexibility:
```javascript
// Site Index (site_index.html):
const templates = window.SiteLetterTemplates?.LIST || window.LetterTemplates?.LIST || {};

// Project (index.html):
const templates = window.ProjectLetterTemplates?.LIST || window.LetterTemplates?.LIST || {};
```
If templates don't render, check: 1) Script loaded? 2) window.* object exists? 3) .LIST property set?

### Module Initialization Order
Critical: Modules must initialize AFTER `document.addEventListener('DOMContentLoaded', ...)`:
```javascript
// ✅ CORRECT
document.addEventListener('DOMContentLoaded', async () => {
    await DB.init();
    MyModule.init({}, appContext);
});

// ❌ WRONG (will fail if DOM not ready)
MyModule.init({}, appContext);
```

### Environment-Based Provider Selection
```javascript
// Server automatically selects adapter in createAdapterFromEnv()
const provider = env.DB_PROVIDER.toLowerCase();
if (provider === 'mongodb') return new MongoAdapter(...);
if (provider === 'postgresql') return new PostgresAdapter(...);
return null; // falls back to IndexedDB only
```
Always validate DB_PROVIDER is set correctly in .env before starting.

### Google Drive Integration
Requires three environment variables:
- `GOOGLE_DRIVE_ENABLED = true/false`
- `GOOGLE_DRIVE_OAUTH_CLIENT_ID` and `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
- `GOOGLE_DRIVE_ROOT_FOLDER = "UrbanAxis Media"` (folder created in Drive)

Files auto-organize: `<ROOT>/<source>/<jobNo>/<category>/<subCategory>`

## Debugging Tips

### Check Database Provider
```bash
curl http://localhost:8080/api/config | jq '.DB_PROVIDER'
```

### Inspect IndexedDB (Browser Console)
```javascript
// List all stores
Object.values(window.DB?.db.objectStoreNames || [])

// Get all projects
await DB.getAllProjects()

// Get specific store data
const tx = db.transaction(['projects'], 'readonly');
tx.objectStore('projects').getAll()
```

### Template Loading Issues
Check browser console for logs (added in BUG_FIXES_2026-02-17):
```
Letter Management: Loading templates { ... }
Letter Management: Rendered N templates
// OR
Letter Management: No templates found
Letter Management: templates-catalog container not found
```

### Server Logs
Run with `npm run dev` to see:
- Database adapter selected
- API endpoint hits
- Errors from adapters

## Common Patterns

### Adding a New Module
1. Create file in `js/site_modules/myModule.js` or `js/project_tabs/myTab.js`
2. Follow IIFE/module pattern with `init()` and `render()` functions
3. Add initialization in appropriate HTML file's `DOMContentLoaded`
4. Cache DOM elements in `App.DOMElements` for performance
5. Use `await DB.getStore(storeName)` for data access

### Adding a New Store
1. Add store name to STORES object in `server/db/storeConfig.js`
2. Add metadata to STORE_META with keyPath and autoIncrement
3. Implement getter/setter in both MongoAdapter and PostgresAdapter
4. Update `js/database.js` STORES constant for IndexedDB
5. Use `await DB.getStore('yourStore')` in modules

### Making Database Changes
- **IndexedDB (browser):** Increment `DB_VERSION` in `js/database.js`, add logic in `onupgradeneeded`
- **MongoDB/PostgreSQL:** Update adapter implementation in `server/db/adapters/`
- **Server API:** Add/modify endpoints in `server/index.js`

## File Structure Quick Reference
```
immersive-off/
├── server/
│   ├── index.js           # Express app, API routes
│   └── db/
│       ├── index.js       # createAdapterFromEnv() factory
│       ├── storeConfig.js # Store definitions (STORES, STORE_META)
│       └── adapters/      # Pluggable DB implementations
├── js/
│   ├── app.js             # Main project app state & modules
│   ├── client.js          # Client portal app
│   ├── database.js        # IndexedDB abstraction
│   ├── constants.js       # App-wide constants
│   ├── site_modules/      # Site-specific feature modules
│   ├── project_tabs/      # Project-specific feature modules
│   ├── utils.js           # Shared utilities
│   └── lib/               # Third-party or helper libraries
├── css/                   # Stylesheets (style.css main)
├── index.html             # Project management (main app)
├── site_index.html        # Site operations
├── client-app.html        # Client portal
├── .env.template          # Environment variables template
└── package.json           # Dependencies (express, mongodb, pg, dotenv)
```

## Recent Changes
See `BUG_FIXES_2026-02-17.md` for:
- Const reassignment fix in budget module
- Letter template rendering fixes
- Console logging enhancements for debugging
