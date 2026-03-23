const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { createAdapterFromEnv } = require('./db');
const { parseKey, getStoreMeta } = require('./db/storeConfig');

// Load .env file for local development, but don't fail on Vercel where env vars are set in dashboard
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });

const app = express();
const port = Number(process.env.PORT || 8080);
const provider = (process.env.DB_PROVIDER || 'indexeddb').toLowerCase();
const dbAdapter = createAdapterFromEnv(process.env);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider,
    remoteEnabled: provider === 'mongodb' || provider === 'postgresql'
  });
});

app.get('/api/config', (_req, res) => {
  // Only expose non-secret runtime config needed by browser code.
  console.log("In API CONFIG::",process.env.DB_PROVIDER);
  
  res.json({
    DB_PROVIDER: process.env.DB_PROVIDER || 'indexeddb',
    DB_API_BASE_URL: process.env.DB_API_BASE_URL || '/api',
    GOOGLE_DRIVE_ENABLED: process.env.GOOGLE_DRIVE_ENABLED || 'false',
    GOOGLE_DRIVE_OAUTH_CLIENT_ID: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID || '',
    GOOGLE_DRIVE_SCOPES: process.env.GOOGLE_DRIVE_SCOPES || 'https://www.googleapis.com/auth/drive.file',
    GOOGLE_DRIVE_ROOT_FOLDER: process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'UrbanAxis Media',
    GOOGLE_DRIVE_STORE_LOCAL_CACHE: process.env.GOOGLE_DRIVE_STORE_LOCAL_CACHE || 'false',
    MEDIA_STORAGE_PROVIDER: process.env.MEDIA_STORAGE_PROVIDER || 'gdrive',
    MONGODB_STORE_BASE64_FILES: process.env.MONGODB_STORE_BASE64_FILES || 'false'
  });
});

function requireRemoteDb(req, res, next) {
  if (!dbAdapter) {
    res.status(400).json({
      error: 'DB_PROVIDER is not a remote provider. Set DB_PROVIDER=mongodb or DB_PROVIDER=postgresql for server persistence.'
    });
    return;
  }
  next();
}

app.get('/api/db/:store', requireRemoteDb, async (req, res) => {
  try {
    const { store } = req.params;
    const filter = { ...req.query };
    const data = await dbAdapter.getAll(store, filter);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch store records' });
  }
});

app.get('/api/db/:store/:id', requireRemoteDb, async (req, res) => {
  try {
    const { store, id } = req.params;
    const key = parseKey(store, id);
    const data = await dbAdapter.get(store, key);
    if (!data) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch record' });
  }
});

app.post('/api/db/:store', requireRemoteDb, async (req, res) => {
  try {
    const { store } = req.params;
    const key = await dbAdapter.add(store, req.body || {});
    res.status(201).json({ key });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to insert record' });
  }
});

app.put('/api/db/:store/:id', requireRemoteDb, async (req, res) => {
  try {
    const { store, id } = req.params;
    const payload = { ...(req.body || {}) };
    const key = parseKey(store, id);
      const meta = getStoreMeta(store);
      if (typeof payload[meta.keyPath] === 'undefined') payload[meta.keyPath] = key;
    const resultKey = await dbAdapter.put(store, payload);
    res.json({ key: resultKey });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to upsert record' });
  }
});

app.delete('/api/db/:store/:id', requireRemoteDb, async (req, res) => {
  try {
    const { store, id } = req.params;
    const key = parseKey(store, id);
    await dbAdapter.delete(store, key);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete record' });
  }
});

app.delete('/api/db/:store', requireRemoteDb, async (req, res) => {
  try {
    const { store } = req.params;
    const filter = { ...req.query };
    await dbAdapter.clear(store, filter);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to clear store records' });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API route not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

async function start() {
  if (dbAdapter) {
    await dbAdapter.init();
    console.log(`[db] Connected using provider: ${provider}`);
  } else {
    console.log('[db] Running in local IndexedDB mode (no server persistence enabled).');
  }

  app.listen(port, () => {
    console.log(`[server] Running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('[startup] Failed to start server:', error);
  process.exit(1);
});
