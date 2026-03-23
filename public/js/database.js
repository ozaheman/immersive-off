/* START OF FILE js/database.js */

/**
 * @module DB
 * A self-contained module for all IndexedDB operations.
 * Explicitly attached to window to support both module and non-module contexts.
 */
(function () { // Wrap in IIFE to avoid const redeclaration errors if loaded twice

    let db;
    const DB_NAME = 'UrbanAxisUnifiedDB';
    const DB_VERSION = 10;

    const STORES = {
        PROJECTS: 'projects',
        SITE_DATA: 'siteData',
        FILES: 'files',
        HR_DATA: 'hrData',
        SETTINGS: 'settings',
        OFFICE_EXPENSES: 'officeExpenses',
        FINANCIAL_TEMPLATES: 'financialTemplates',
        HOLIDAYS: 'holidays',
        STAFF_LEAVES: 'staffLeaves',
        DESIGN_SCRUM: 'designScrum',
        BULLETIN: 'bulletin',
        // New Stores required by your modules
        VENDORS: 'vendors',
        REFERRAL_ACCOUNTS: 'referralAccounts',
        OTHER_ACCOUNTS: 'otherAccounts',
        ASSETS: 'assets',
        LETTER_DRAFTS: 'letterDrafts',
        SENT_LETTERS: 'sentLetters',
        RECIPIENT_HISTORY: 'recipientHistory'
    };

    const STORE_META = {
        [STORES.PROJECTS]: { keyPath: 'jobNo', autoIncrement: false },
        [STORES.SITE_DATA]: { keyPath: 'jobNo', autoIncrement: false },
        [STORES.FILES]: { keyPath: 'id', autoIncrement: true },
        [STORES.HR_DATA]: { keyPath: 'id', autoIncrement: true },
        [STORES.SETTINGS]: { keyPath: 'id', autoIncrement: false },
        [STORES.OFFICE_EXPENSES]: { keyPath: 'id', autoIncrement: true },
        [STORES.FINANCIAL_TEMPLATES]: { keyPath: 'id', autoIncrement: false },
        [STORES.HOLIDAYS]: { keyPath: 'id', autoIncrement: true },
        [STORES.STAFF_LEAVES]: { keyPath: 'id', autoIncrement: true },
        [STORES.DESIGN_SCRUM]: { keyPath: 'jobNo', autoIncrement: false },
        [STORES.BULLETIN]: { keyPath: 'id', autoIncrement: true },
        [STORES.VENDORS]: { keyPath: 'id', autoIncrement: true },
        [STORES.REFERRAL_ACCOUNTS]: { keyPath: 'id', autoIncrement: true },
        [STORES.OTHER_ACCOUNTS]: { keyPath: 'id', autoIncrement: true },
        [STORES.ASSETS]: { keyPath: 'id', autoIncrement: true },
        [STORES.LETTER_DRAFTS]: { keyPath: 'id', autoIncrement: true },
        [STORES.SENT_LETTERS]: { keyPath: 'id', autoIncrement: true },
        [STORES.RECIPIENT_HISTORY]: { keyPath: 'id', autoIncrement: true }
    };

    let activeDbProvider = 'indexeddb';

    const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
    const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
    const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
    let envLoadPromise = null;

    function parseDotEnv(text) {
        const parsed = {};
        String(text || '').split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const idx = trimmed.indexOf('=');
            if (idx < 0) return;
            const key = trimmed.slice(0, idx).trim();
            if (!key) return;
            let value = trimmed.slice(idx + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            parsed[key] = value;
        });
        return parsed;
    }

    async function ensureRuntimeEnvLoaded() {
        if (window.__ENV__ && Object.keys(window.__ENV__).length > 0) {
            console.log('[DB] Environment already loaded:', Object.keys(window.__ENV__));
            return;
        }
        if (envLoadPromise) return envLoadPromise;

        envLoadPromise = (async () => {
            // Load config from backend API endpoint (only secure source for environment variables)
            try {
                console.log('[DB] 🔄 Loading runtime configuration from /api/config...');
                const cfgRes = await fetch('/api/config', { cache: 'no-store' });
                
                if (!cfgRes.ok) {
                    console.error('[DB] ❌ Failed to load config: Server returned status', cfgRes.status);
                    throw new Error(`HTTP ${cfgRes.status}`);
                }
                
                const cfg = await cfgRes.json();
                if (!cfg || typeof cfg !== 'object' || Object.keys(cfg).length === 0) {
                    console.error('[DB] ❌ Config endpoint returned empty or invalid response:', cfg);
                    throw new Error('Empty config response');
                }
                
                window.__ENV__ = { ...(window.__ENV__ || {}), ...cfg };
                console.log('[DB] ✅ Runtime config loaded successfully. Keys:', Object.keys(cfg).join(', '));
                console.log('[DB] Config values:', {
                    DB_PROVIDER: cfg.DB_PROVIDER,
                    DB_API_BASE_URL: cfg.DB_API_BASE_URL,
                    GOOGLE_DRIVE_ENABLED: cfg.GOOGLE_DRIVE_ENABLED,
                    GOOGLE_DRIVE_ROOT_FOLDER: cfg.GOOGLE_DRIVE_ROOT_FOLDER,
                    MEDIA_STORAGE_PROVIDER: cfg.MEDIA_STORAGE_PROVIDER,
                    MONGODB_STORE_BASE64_FILES: cfg.MONGODB_STORE_BASE64_FILES
                });
            } catch (error) {
                console.error('[DB] ❌ CRITICAL: Could not load runtime config from /api/config:', error.message);
                console.error('[DB] ⚠️ App will not function properly without config. Check:');
                console.error('[DB]    1. Server is running (curl http://localhost:8080/api/health)');
                console.error('[DB]    2. PORT environment variable (default: 8080)');
                console.error('[DB]    3. .env file exists and contains DB_PROVIDER and other required vars');
                window.__ENV__ = {};
            }
        })();

        return envLoadPromise;
    }

    function getEnvValue(key, fallback = '') {
        const fromWindowEnv = window.__ENV__ && window.__ENV__[key];
        if (typeof fromWindowEnv !== 'undefined' && fromWindowEnv !== null && String(fromWindowEnv).trim() !== '') {
            console.log(`[DB] ✓ Config "${key}" = "${String(fromWindowEnv).trim()}"`);
            return String(fromWindowEnv).trim();
        }

        const fromMeta = document.querySelector(`meta[name="${key}"]`)?.getAttribute('content');
        if (fromMeta && String(fromMeta).trim() !== '') {
            console.log(`[DB] ✓ Config "${key}" found in <meta> tag = "${String(fromMeta).trim()}"`);
            return String(fromMeta).trim();
        }

        if (fallback) {
            console.log(`[DB] ⚠️ Config "${key}" not found, using fallback = "${fallback}"`);
        } else {
            console.warn(`[DB] ❌ Config "${key}" not found and no fallback provided`);
        }
        return fallback;
    }

    function asBoolean(value, fallback = false) {
        if (value === null || typeof value === 'undefined' || value === '') return fallback;
        const normalized = String(value).toLowerCase().trim();
        return ['1', 'true', 'yes', 'on'].includes(normalized);
    }

    function getDbProvider() {
        return getEnvValue('DB_PROVIDER', 'indexeddb').toLowerCase();
    }

    function isRemoteProvider() {
        const provider = getDbProvider();
        return provider === 'mongodb' || provider === 'postgresql';
    }

    function getDbApiBaseUrl() {
        return getEnvValue('DB_API_BASE_URL', '/api').replace(/\/$/, '');
    }

    function getStoreMeta(storeName) {
        return STORE_META[storeName] || { keyPath: 'id', autoIncrement: true };
    }

    function normalizeKeyType(storeName, key) {
        const meta = getStoreMeta(storeName);
        if (meta.autoIncrement) {
            const asNumber = Number(key);
            return Number.isFinite(asNumber) ? asNumber : key;
        }
        return key;
    }

    function hasMeaningfulValue(value) {
        return !(value === null || typeof value === 'undefined' || value === '');
    }

    function isDuplicateKeyRemoteError(error) {
        const details = `${error?.responseText || ''} ${error?.message || ''}`.toLowerCase();
        const status = Number(error?.status);
        return status === 409 || /duplicate key|e11000|already exists|unique constraint/.test(details);
    }

    async function allocateRemoteAutoIncrementKey(storeName, keyPath) {
        const rows = await remoteGetAll(storeName);
        let max = 0;
        for (const row of rows || []) {
            const value = Number(row?.[keyPath]);
            if (Number.isFinite(value) && value > max) {
                max = value;
            }
        }
        return max + 1;
    }

    async function remoteDbRequest(method, path, body, options = {}) {
        const allowNotFound = Boolean(options.allowNotFound);
        const response = await fetch(`${getDbApiBaseUrl()}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: typeof body === 'undefined' ? undefined : JSON.stringify(body)
        });

        if (!response.ok) {
            const message = await response.text().catch(() => `HTTP ${response.status}`);
            const isLikelyStaticServer404 = response.status === 404 && /file not found|error response/i.test(message);
            if (isLikelyStaticServer404) {
                throw new Error(
                    `Remote DB API not found at ${getDbApiBaseUrl()}${path}. ` +
                    `Your frontend is likely running on a static server (for example python http.server) instead of the Node API server. ` +
                    `Run the app using \"npm start\" and open that server origin, or set DB_PROVIDER=indexeddb for static-only mode.`
                );
            }

            // Missing records are valid for optional settings/documents.
            if (allowNotFound && response.status === 404) {
                return { data: null, notFound: true };
            }

            const error = new Error(`Remote DB request failed (${response.status}): ${message}`);
            error.status = response.status;
            error.responseText = message;
            throw error;
        }

        if (response.status === 204) return null;
        return response.json();
    }

    async function remoteGet(storeName, key) {
        const payload = await remoteDbRequest(
            'GET',
            `/db/${encodeURIComponent(storeName)}/${encodeURIComponent(String(normalizeKeyType(storeName, key)))}`,
            undefined,
            { allowNotFound: true }
        );
        return payload?.data || null;
    }

    async function remoteGetAll(storeName, filter = {}) {
        const query = new URLSearchParams();
        Object.entries(filter || {}).forEach(([k, v]) => {
            if (typeof v !== 'undefined' && v !== null) query.set(k, String(v));
        });
        const suffix = query.toString() ? `?${query.toString()}` : '';
        const payload = await remoteDbRequest('GET', `/db/${encodeURIComponent(storeName)}${suffix}`);
        return payload?.data || [];
    }

    async function remotePut(storeName, data) {
        const meta = getStoreMeta(storeName);
        const keyValue = data?.[meta.keyPath];
        if (typeof keyValue === 'undefined' || keyValue === null || keyValue === '') {
            throw new Error(`Remote put requires ${meta.keyPath} for store ${storeName}.`);
        }
        const payload = await remoteDbRequest('PUT', `/db/${encodeURIComponent(storeName)}/${encodeURIComponent(String(normalizeKeyType(storeName, keyValue)))}`, data);
        return payload?.key;
    }

    async function remoteAdd(storeName, data) {
        const meta = getStoreMeta(storeName);
        const keyPath = meta.keyPath || 'id';
        const payload = { ...data };
        const hadExplicitKey = hasMeaningfulValue(payload[keyPath]);
        const maxAttempts = (!hadExplicitKey && meta.autoIncrement) ? 3 : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (!hadExplicitKey && meta.autoIncrement) {
                payload[keyPath] = await allocateRemoteAutoIncrementKey(storeName, keyPath);
            }

            try {
                const result = await remoteDbRequest('POST', `/db/${encodeURIComponent(storeName)}`, payload);
                return hasMeaningfulValue(result?.key) ? result.key : payload[keyPath];
            } catch (error) {
                if (!isDuplicateKeyRemoteError(error)) {
                    throw error;
                }

                const canRetryWithNewKey = !hadExplicitKey && meta.autoIncrement && attempt < maxAttempts;
                if (canRetryWithNewKey) {
                    continue;
                }

                // Intentional fixed-key inserts should behave idempotently in remote mode.
                if (hadExplicitKey && hasMeaningfulValue(payload[keyPath])) {
                    return remotePut(storeName, payload);
                }

                throw error;
            }
        }

        throw new Error(`Remote add failed for ${storeName}.`);
    }

    async function remoteDelete(storeName, key) {
        await remoteDbRequest('DELETE', `/db/${encodeURIComponent(storeName)}/${encodeURIComponent(String(normalizeKeyType(storeName, key)))}`);
    }

    async function remoteClear(storeName, filter = {}) {
        const query = new URLSearchParams();
        Object.entries(filter || {}).forEach(([k, v]) => {
            if (typeof v !== 'undefined' && v !== null) query.set(k, String(v));
        });
        const suffix = query.toString() ? `?${query.toString()}` : '';
        await remoteDbRequest('DELETE', `/db/${encodeURIComponent(storeName)}${suffix}`);
    }

    function toSafeSegment(value, fallback = 'unknown') {
        return String(value || fallback)
            .trim()
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .slice(0, 120) || fallback;
    }

    function parseDataUrl(dataUrl) {
        const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/i.exec(dataUrl || '');
        if (!match) {
            throw new Error('Invalid data URL format.');
        }
        const mimeType = match[1] || 'application/octet-stream';
        const payload = match[2] || '';
        const binary = atob(payload);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return { blob: new Blob([bytes], { type: mimeType }), mimeType };
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Failed to read blob as data URL.'));
            reader.readAsDataURL(blob);
        });
    }

    const DriveSync = (() => {
        let scriptLoadPromise = null;
        let tokenClient = null;
        let accessToken = '';
        let tokenExpiresAt = 0;
        let rootFolderId = '';
        const folderCache = new Map();

        function isEnabled() {
            return asBoolean(getEnvValue('GOOGLE_DRIVE_ENABLED', 'false'));
        }

        function shouldCacheDataUrl() {
            return asBoolean(getEnvValue('GOOGLE_DRIVE_STORE_LOCAL_CACHE', 'false'));
        }

        function getScopes() {
            return getEnvValue('GOOGLE_DRIVE_SCOPES', 'https://www.googleapis.com/auth/drive.file');
        }

        function getClientId() {
            return getEnvValue('GOOGLE_DRIVE_OAUTH_CLIENT_ID', '');
        }

        function getRootFolderName() {
            return getEnvValue('GOOGLE_DRIVE_ROOT_FOLDER', 'UrbanAxis Media');
        }

        async function ensureGoogleIdentityScript() {
            if (window.google?.accounts?.oauth2) return;
            if (scriptLoadPromise) return scriptLoadPromise;

            scriptLoadPromise = new Promise((resolve, reject) => {
                const existing = document.querySelector('script[data-gdrive-gis="1"]');
                if (existing) {
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')), { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.dataset.gdriveGis = '1';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
                document.head.appendChild(script);
            });

            return scriptLoadPromise;
        }

        async function ensureTokenClient() {
            if (tokenClient) return tokenClient;
            const clientId = getClientId();
            if (!clientId) {
                throw new Error('Missing GOOGLE_DRIVE_OAUTH_CLIENT_ID.');
            }

            await ensureGoogleIdentityScript();

            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: getScopes(),
                callback: () => { }
            });
            return tokenClient;
        }

        async function getAccessToken() {
            if (accessToken && Date.now() < tokenExpiresAt - 15 * 1000) {
                return accessToken;
            }

            const client = await ensureTokenClient();

            return new Promise((resolve, reject) => {
                client.callback = (response) => {
                    if (response?.error) {
                        const rawError = String(response.error || 'oauth_error');
                        const rawDescription = String(response.error_description || '');
                        const isMismatch = /redirect_uri_mismatch|origin_mismatch/i.test(`${rawError} ${rawDescription}`);
                        if (isMismatch) {
                            const origin = window.location.origin;
                            reject(new Error(
                                `Google OAuth configuration mismatch detected (${rawError}). ` +
                                `Add this origin to Google Cloud OAuth client Authorized JavaScript origins: ${origin}. ` +
                                `Use a Web application OAuth client and ensure Google Drive API is enabled.`
                            ));
                            return;
                        }
                        reject(new Error(rawDescription || rawError));
                        return;
                    }

                    accessToken = response.access_token;
                    const expirySeconds = Number(response.expires_in || 3600);
                    tokenExpiresAt = Date.now() + expirySeconds * 1000;
                    resolve(accessToken);
                };

                client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
            });
        }

        async function apiFetch(url, options = {}) {
            const token = await getAccessToken();
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', `Bearer ${token}`);

            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
            }
            return response;
        }

        function escapeDriveQueryValue(value) {
            return String(value).replace(/'/g, "\\'");
        }

        async function ensureFolder(name, parentId) {
            const safeName = toSafeSegment(name, 'folder');
            const cacheKey = `${parentId || 'root'}::${safeName}`;
            if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);

            const parentFilter = parentId ? `'${parentId}' in parents and ` : '';
            const query = `${parentFilter}mimeType='${DRIVE_FOLDER_MIME}' and trashed=false and name='${escapeDriveQueryValue(safeName)}'`;
            const listUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1&supportsAllDrives=true`;
            const listResponse = await apiFetch(listUrl, { method: 'GET' });
            const listPayload = await listResponse.json();

            const existing = listPayload.files && listPayload.files[0];
            if (existing?.id) {
                folderCache.set(cacheKey, existing.id);
                return existing.id;
            }

            const createResponse = await apiFetch(`${DRIVE_API_BASE}/files?supportsAllDrives=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: safeName,
                    mimeType: DRIVE_FOLDER_MIME,
                    parents: parentId ? [parentId] : undefined
                })
            });
            const created = await createResponse.json();
            folderCache.set(cacheKey, created.id);
            return created.id;
        }

        async function ensureBaseFolder() {
            if (rootFolderId) return rootFolderId;
            rootFolderId = await ensureFolder(getRootFolderName(), null);
            return rootFolderId;
        }

        async function resolveUploadFolder(fileData) {
            let currentParent = await ensureBaseFolder();
            const pathSegments = [
                toSafeSegment(fileData.source || 'misc-source', 'misc-source'),
                toSafeSegment(fileData.jobNo || 'global', 'global'),
                toSafeSegment(fileData.category || 'uncategorized', 'uncategorized'),
                toSafeSegment(fileData.subCategory || 'general', 'general')
            ];

            for (const segment of pathSegments) {
                currentParent = await ensureFolder(segment, currentParent);
            }

            return {
                folderId: currentParent,
                folderPath: [getRootFolderName(), ...pathSegments].join('/')
            };
        }

        async function uploadDataUrlFile(fileData) {
            if (!isEnabled()) return null;
            if (!fileData?.dataUrl) return null;

            const { folderId, folderPath } = await resolveUploadFolder(fileData);
            const parsed = parseDataUrl(fileData.dataUrl);
            const mimeType = fileData.fileType || parsed.mimeType || 'application/octet-stream';
            const fileName = toSafeSegment(fileData.name || `upload_${Date.now()}`, `upload_${Date.now()}`);

            const boundary = `urbanaxis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const metadata = {
                name: fileName,
                mimeType,
                parents: [folderId]
            };

            const preamble = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
            const middle = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
            const closing = `\r\n--${boundary}--`;
            const body = new Blob([preamble, middle, parsed.blob, closing], {
                type: `multipart/related; boundary=${boundary}`
            });

            const uploadResponse = await apiFetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink&supportsAllDrives=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body
            });

            const payload = await uploadResponse.json();
            return {
                id: payload.id,
                name: payload.name,
                mimeType: payload.mimeType || mimeType,
                webViewLink: payload.webViewLink || '',
                webContentLink: payload.webContentLink || '',
                folderPath
            };
        }

        async function downloadFileAsDataUrl(fileId) {
            if (!isEnabled() || !fileId) return null;
            const response = await apiFetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, {
                method: 'GET'
            });
            const blob = await response.blob();
            return blobToDataUrl(blob);
        }

        async function deleteFile(fileId) {
            if (!isEnabled() || !fileId) return;
            await apiFetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
                method: 'DELETE'
            });
        }

        return {
            isEnabled,
            shouldCacheDataUrl,
            uploadDataUrlFile,
            downloadFileAsDataUrl,
            deleteFile
        };
    })();

    // ... [KEEP ALL THE INTERNAL FUNCTIONS: init, seedFinancialTemplates, makeRequest, mergeLists, mergeFiles as written in previous response] ...
    // For brevity in this fix block, I will include the critical wrapper and assignment.

    // (Paste the full content of database.js here, but ensure the end matches below)

    function init() {
        return new Promise((resolve, reject) => {
            const openDatabase = () => {
                activeDbProvider = getDbProvider();
                console.log('[DB] Initializing database with provider:', activeDbProvider);

                if (isRemoteProvider()) {
                    console.log('[DB] Using remote provider. Checking health at /health...');
                    remoteDbRequest('GET', '/health')
                        .then(async (healthData) => {
                            console.log('[DB] ✅ Remote DB health check passed:', healthData);
                            if (typeof window.FINANCIAL_DATA !== 'undefined') {
                                console.log('[DB] Seeding financial templates...');
                                await seedFinancialTemplates();
                            }
                            resolve();
                        })
                        .catch((err) => {
                            console.error('[DB] ❌ Remote DB health check failed:', err.message);
                            reject(err);
                        });
                    return;
                }

                console.log(`[DB] Opening IndexedDB: ${DB_NAME} v${DB_VERSION}...`);
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = (event) => {
                    console.error("[DB] ❌ IndexedDB error:", event.target.error);
                    reject(event.target.error);
                };

                request.onupgradeneeded = (event) => {
                    console.log('[DB] onupgradeneeded triggered - creating stores...');
                    db = event.target.result;
                    const createStore = (name, options, indices = []) => {
                        if (!db.objectStoreNames.contains(name)) {
                            const store = db.createObjectStore(name, options);
                            indices.forEach(index => {
                                store.createIndex(index.name, index.keyPath, { unique: index.unique });
                            });
                        }
                    };

                    createStore(STORES.PROJECTS, { keyPath: 'jobNo' });
                    createStore(STORES.SITE_DATA, { keyPath: 'jobNo' });
                    createStore(STORES.FILES, { keyPath: 'id', autoIncrement: true }, [
                        { name: 'jobNo_source', keyPath: ['jobNo', 'source'], unique: false },
                        { name: 'jobNo_subCategory', keyPath: ['jobNo', 'subCategory'], unique: false }
                    ]);
                    createStore(STORES.HR_DATA, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.SETTINGS, { keyPath: 'id' });
                    createStore(STORES.OFFICE_EXPENSES, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.FINANCIAL_TEMPLATES, { keyPath: 'id' });
                    createStore(STORES.HOLIDAYS, { keyPath: 'id', autoIncrement: true }, [
                        { name: 'by_country_year', keyPath: ['countryCode', 'year'], unique: false }
                    ]);
                    createStore(STORES.STAFF_LEAVES, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.DESIGN_SCRUM, { keyPath: 'jobNo' });
                    createStore(STORES.BULLETIN, { keyPath: 'id', autoIncrement: true });
                    // New Stores
                    createStore(STORES.VENDORS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.REFERRAL_ACCOUNTS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.OTHER_ACCOUNTS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.ASSETS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.LETTER_DRAFTS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.SENT_LETTERS, { keyPath: 'id', autoIncrement: true });
                    createStore(STORES.RECIPIENT_HISTORY, { keyPath: 'id', autoIncrement: true }, [
                        { name: 'by_name', keyPath: 'name', unique: true }
                    ]);
                    console.log('[DB] Stores created');
                };

                request.onsuccess = async (event) => {
                    db = event.target.result;
                    console.log('[DB] ✅ IndexedDB opened successfully');
                    // If Financial Data exists globally, seed it
                    if (typeof window.FINANCIAL_DATA !== 'undefined') {
                        console.log('[DB] Seeding financial templates...');
                        await seedFinancialTemplates();
                    }
                    resolve();
                };
            };

            console.log('[DB] init() called - loading environment...');
            ensureRuntimeEnvLoaded().finally(openDatabase);
        });
    }

    async function seedFinancialTemplates() {
        const existing = isRemoteProvider()
            ? await remoteGetAll(STORES.FINANCIAL_TEMPLATES)
            : await makeRequest(STORES.FINANCIAL_TEMPLATES, 'readonly', store => store.getAll());

        if (existing.length !== 0 || !window.FINANCIAL_DATA) return;

        if (isRemoteProvider()) {
            for (const key in window.FINANCIAL_DATA) {
                await remotePut(STORES.FINANCIAL_TEMPLATES, { id: key, data: window.FINANCIAL_DATA[key] });
            }
            return;
        }

        if (!db) return;
        const writeTx = db.transaction(STORES.FINANCIAL_TEMPLATES, 'readwrite');
        const writeStore = writeTx.objectStore(STORES.FINANCIAL_TEMPLATES);
        for (const key in window.FINANCIAL_DATA) {
            writeStore.put({ id: key, data: window.FINANCIAL_DATA[key] });
        }
        return new Promise(resolve => writeTx.oncomplete = resolve);
    }

    function makeRequest(storeName, mode, action) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("Database not initialized.");
            if (!db.objectStoreNames.contains(storeName)) {
                console.error(`Object store '${storeName}' not found.`);
                return resolve([]);
            }
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = action(store);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => resolve(event.target.result);
        });
    }
    // --- HELPER: Collaborative List Merging ---
    // Merges two arrays of objects based on a unique key (e.g., 'id').
    // If incoming item exists, update it. If not, add it.
    function mergeLists(existingList = [], incomingList = [], uniqueKey = 'id') {
        const mergedMap = new Map();

        // 1. Add existing items to map
        existingList.forEach(item => {
            if (item && item[uniqueKey]) mergedMap.set(String(item[uniqueKey]), item);
        });

        // 2. Merge incoming items (Overwrite existing if ID matches, implies newer data from import)
        incomingList.forEach(item => {
            if (item && item[uniqueKey]) mergedMap.set(String(item[uniqueKey]), item);
        });

        return Array.from(mergedMap.values());
    }

    // --- HELPER: Merge Files ---
    // Avoids duplication by checking Name + Category + Source
    async function mergeFiles(jobNo, source, incomingFiles) {
        if (!incomingFiles || incomingFiles.length === 0) return;

        // Get existing files
        const existingFiles = await publicAPI.getFiles(jobNo, source);

        for (const file of incomingFiles) {
            // Check if this specific file already exists
            const exists = existingFiles.some(ex =>
                ex.name === file.name &&
                ex.category === file.category &&
                ex.subCategory === file.subCategory
            );

            if (!exists) {
                await publicAPI.addFile({
                    jobNo: jobNo,
                    source: source,
                    category: file.category || null,
                    subCategory: file.subCategory || null,
                    name: file.name,
                    fileType: file.type || file.fileType,
                    dataUrl: file.data || file.dataUrl,
                    expiryDate: file.expiryDate || null,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async function persistFileRecord(fileData) {
        const normalized = {
            ...fileData,
            source: fileData.source || 'master',
            category: fileData.category || null,
            subCategory: fileData.subCategory || null,
            expiryDate: fileData.expiryDate || null,
            timestamp: fileData.timestamp || new Date().toISOString(),
            fileType: fileData.fileType || fileData.type || 'application/octet-stream'
        };

        const mediaStorageProvider = getEnvValue('MEDIA_STORAGE_PROVIDER', 'gdrive').toLowerCase();
        const useMongoDbBase64 = asBoolean(getEnvValue('MONGODB_STORE_BASE64_FILES', 'false'));

        if (mediaStorageProvider === 'mongodb' && useMongoDbBase64) {
            // MongoDB base64 storage: require dataUrl
            if (!normalized.dataUrl) {
                throw new Error('Base64 file data required for MongoDB storage.');
            }
            normalized.storageMethod = 'mongodb-base64';
        } else if (DriveSync.isEnabled() && normalized.dataUrl) {
            // Google Drive storage
            try {
                const uploaded = await DriveSync.uploadDataUrlFile(normalized);
                if (uploaded?.id) {
                    normalized.driveFileId = uploaded.id;
                    normalized.driveFolderPath = uploaded.folderPath || null;
                    normalized.driveWebViewLink = uploaded.webViewLink || null;
                    normalized.driveWebContentLink = uploaded.webContentLink || null;
                    normalized.storageMethod = 'gdrive';
                    if (!DriveSync.shouldCacheDataUrl()) {
                        delete normalized.dataUrl;
                    }
                }
            } catch (error) {
                console.warn('Google Drive upload failed. Falling back to IndexedDB dataUrl storage.', error);
                normalized.storageMethod = 'indexeddb-only';
            }
        } else {
            // Fallback: IndexedDB only
            normalized.storageMethod = normalized.storageMethod || 'indexeddb-only';
        }

        return publicAPI.add(STORES.FILES, normalized);
    }

    async function hydrateFileRecord(file, shouldHydrate = true) {
        if (!file) return file;
        if (!shouldHydrate) return file;
        if (file.dataUrl) return file;

        const storageMethod = file.storageMethod || (file.driveFileId ? 'gdrive' : 'indexeddb-only');
        
        try {
            if (storageMethod === 'mongodb-base64') {
                // For MongoDB base64 storage, file should already have dataUrl in database
                // If missing, it's a data integrity issue - log warning and return
                if (!file.dataUrl) {
                    console.warn(`[DB] MongoDB base64 file ${file.id} missing dataUrl. Integrity check failed.`);
                    return file;
                }
                return file;
            } else if (storageMethod === 'gdrive' && DriveSync.isEnabled() && file.driveFileId) {
                // For Google Drive storage, fetch from Drive API
                const dataUrl = await DriveSync.downloadFileAsDataUrl(file.driveFileId);
                if (!dataUrl) {
                    console.warn(`[DB] Google Drive download failed for file ${file.id || file.driveFileId}.`);
                    return file;
                }
                return { ...file, dataUrl };
            } else if (storageMethod === 'indexeddb-only') {
                // For IndexedDB-only storage, dataUrl should already be present
                if (!file.dataUrl) {
                    console.warn(`[DB] IndexedDB file ${file.id} missing dataUrl.`);
                }
                return file;
            }
            
            return file;
        } catch (error) {
            console.warn(`[DB] File hydration failed for file ${file.id}. StorageMethod: ${storageMethod}. Error:`, error);
            return file;
        }
    }

    async function removeFileRecord(id) {
        const file = await publicAPI.get(STORES.FILES, id);
        if (!file) return;

        if (DriveSync.isEnabled() && file.driveFileId) {
            try {
                await DriveSync.deleteFile(file.driveFileId);
            } catch (error) {
                console.warn(`Google Drive delete failed for file ${file.driveFileId}. Proceeding with local deletion.`, error);
            }
        }

        return publicAPI.delete(STORES.FILES, id);
    }
    // --- Public API Object ---
    const publicAPI = {
        init,
        STORES, // Expose store names for external use if needed
        getActiveProvider: () => activeDbProvider,

        // --- Generic CRUD Methods ---
        get: async (storeName, key) => {
            if (isRemoteProvider()) {
                return remoteGet(storeName, key);
            }
            return makeRequest(storeName, 'readonly', store => store.get(key));
        },
        getAll: async (storeName) => {
            if (isRemoteProvider()) {
                return remoteGetAll(storeName);
            }
            return makeRequest(storeName, 'readonly', store => store.getAll());
        },
        put: async (storeName, data) => {
            const payload = { ...data, lastSync: new Date().toISOString() };
            if (isRemoteProvider()) {
                return remotePut(storeName, payload);
            }
            return makeRequest(storeName, 'readwrite', store => {
                // Robustness: If the keyPath property is null/undefined, remove it to allow auto-increment
                const kp = store.keyPath;
                if (kp && (payload[kp] === null || payload[kp] === undefined)) {
                    delete payload[kp];
                }
                return store.put(payload);
            });
        },
        add: async (storeName, data) => {
            const payload = { ...data };
            if (isRemoteProvider()) {
                return remoteAdd(storeName, payload);
            }
            return makeRequest(storeName, 'readwrite', store => {
                const kp = store.keyPath;
                if (kp && (payload[kp] === null || payload[kp] === undefined)) {
                    delete payload[kp];
                }
                return store.add(payload);
            });
        },
        delete: async (storeName, key) => {
            if (isRemoteProvider()) {
                return remoteDelete(storeName, key);
            }
            return makeRequest(storeName, 'readwrite', store => store.delete(key));
        },
        clear: async (storeName, filter) => {
            if (isRemoteProvider()) {
                return remoteClear(storeName, filter || {});
            }
            return makeRequest(storeName, 'readwrite', store => store.clear());
        },

        // --- Project Methods ---
        getProject: (jobNo) => publicAPI.get(STORES.PROJECTS, jobNo),
        getAllProjects: () => publicAPI.getAll(STORES.PROJECTS),
        putProject: (projectData) => publicAPI.put(STORES.PROJECTS, projectData),

        // --- Settings Methods ---
        getSetting: (id) => publicAPI.get(STORES.SETTINGS, id),
        putSetting: (data) => publicAPI.put(STORES.SETTINGS, data),
        // --- Verification Methods ---
        // FIX: Added verifyMasterLogin which aliases to verifyPassword to solve the error
        verifyMasterLogin: async (role, inputPassword) => {
            return await publicAPI.verifyPassword(role, inputPassword);
        },
        verifyPassword: async (role, inputPassword) => {
            const standardizedRole = (role || '').toLowerCase().replace(/\s+/g, ''); // Standardize role
            //alert ('role1:' + role);
            // const settings = await publicAPI.get(STORES.SETTINGS, 'access_control');
            // alert ('settings :' + settings);

            //console.log('settings.passwords:');
            //console.log(settings['arch']);
            //alert('settings.passwords[role] :' + settings.passwords[role]);
            try {
                const settings = await publicAPI.get(STORES.SETTINGS, 'access_control');
                //alert ('role:' + role);
                //alert ('settings.passwords[role]:' + settings.passwords[role]);
                //alert ('settings.passwords:' + settings.passwords);
                if (settings && settings.passwords && settings.passwords[standardizedRole]) {
                    console.log(settings);
                    console.log(settings.passwords);
                    return settings.passwords[standardizedRole] === inputPassword;
                }
                const defaultPass = {
                    'site': 'site_eng@12345',
                    'siteeng': 'site_eng@12345',
                    'arch': 'arch@12345',
                    'str': 'str@12345',
                    'mep': 'mep@12345',
                    'pm': 'pm@12345',
                    'contractor': 'contractor@12345', 'client': 'client@12345',
                    'hr': 'hr@12345',
                    'admin': 'admin@12345',
                    'proc': 'proc@12345', // Default for vendor management
                    'design': 'design@12345' // Default for design center
                }[standardizedRole];
                return inputPassword === defaultPass || inputPassword === 'admin@12345';
            } catch (e) {
                console.error("Password verification error:", e);
                const fallbackPass = {
                    'admin': 'admin@12345'
                }[standardizedRole];
                return inputPassword === fallbackPass || inputPassword === 'admin@12345';
            }
        },

        // --- Site Data Methods ---
        getSiteData: (jobNo) => publicAPI.get(STORES.SITE_DATA, jobNo),
        getAllSiteData: () => publicAPI.getAll(STORES.SITE_DATA),
        putSiteData: (data) => publicAPI.put(STORES.SITE_DATA, data),

        // --- HR & Expense Methods ---
        getAllHRData: () => publicAPI.getAll(STORES.HR_DATA),
        addHRData: (data) => publicAPI.add(STORES.HR_DATA, data),
        putHRData: (data) => publicAPI.put(STORES.HR_DATA, data),
        deleteHRData: (id) => publicAPI.delete(STORES.HR_DATA, id),
        getOfficeExpenses: () => publicAPI.getAll(STORES.OFFICE_EXPENSES),
        addOfficeExpense: (data) => publicAPI.add(STORES.OFFICE_EXPENSES, data),
        // --- NEW: Referral & Other Accounts Methods (Fixes HR JS errors) ---
        getAllReferralAccounts: () => publicAPI.getAll(STORES.REFERRAL_ACCOUNTS),
        addReferralAccount: (data) => publicAPI.add(STORES.REFERRAL_ACCOUNTS, data),
        deleteReferralAccount: (id) => publicAPI.delete(STORES.REFERRAL_ACCOUNTS, id),

        getAllOtherAccounts: () => publicAPI.getAll(STORES.OTHER_ACCOUNTS),
        addOtherAccount: (data) => publicAPI.add(STORES.OTHER_ACCOUNTS, data),
        deleteOtherAccount: (id) => publicAPI.delete(STORES.OTHER_ACCOUNTS, id),

        // --- Financial Template Methods ---
        getAllAssets: () => publicAPI.getAll(STORES.ASSETS),
        addAsset: (data) => publicAPI.add(STORES.ASSETS, data),
        putAsset: (data) => publicAPI.put(STORES.ASSETS, data),
        deleteAsset: (id) => publicAPI.delete(STORES.ASSETS, id),
        getFinancialTemplate: (id) => publicAPI.get(STORES.FINANCIAL_TEMPLATES, id),

        // --- Scrum Methods ---
        getScrumData: (jobNo) => publicAPI.get(STORES.DESIGN_SCRUM, jobNo),
        getAllScrumData: () => publicAPI.getAll(STORES.DESIGN_SCRUM),
        putScrumData: (data) => publicAPI.put(STORES.DESIGN_SCRUM, data),

        // --- Letter Management Methods ---
        getAllLetterDrafts: () => publicAPI.getAll(STORES.LETTER_DRAFTS),
        putLetterDraft: (data) => publicAPI.put(STORES.LETTER_DRAFTS, data),
        deleteLetterDraft: (id) => publicAPI.delete(STORES.LETTER_DRAFTS, id),

        getAllSentLetters: () => publicAPI.getAll(STORES.SENT_LETTERS),
        addSentLetter: (data) => publicAPI.add(STORES.SENT_LETTERS, data),
        deleteSentLetter: (id) => publicAPI.delete(STORES.SENT_LETTERS, id),

        // --- Recipient History Methods ---
        getRecentRecipients: async (limit = 20) => {
            const rx = await publicAPI.getAll(STORES.RECIPIENT_HISTORY);
            return rx.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed)).slice(0, limit);
        },
        addRecentRecipient: async (recipient) => {
            if (!recipient.name) return;
            const all = await publicAPI.getAll(STORES.RECIPIENT_HISTORY);
            const existing = all.find(r => r.name === recipient.name);
            const data = existing ? { ...existing, ...recipient } : { ...recipient };
            data.lastUsed = new Date().toISOString();
            return publicAPI.put(STORES.RECIPIENT_HISTORY, data);
        },

        /**
         * MODIFICATION: New data retrieval function for the Design Center.
         * Fetches Scrum data and enriches it with assignee and project info.
         * @param {string} [jobNo] - The job number of a specific project. If null, fetches data for all projects.
         * @returns {Promise<{staff: Array<Object>, scrumData: Object}>} An object containing the staff list and the processed scrum data.
         */
        getScrumBoardData: async (jobNo) => {
            // 1. Fetch all staff members and create a lookup map
            const staffList = await publicAPI.getAll(STORES.HR_DATA);
            const staffMap = new Map(staffList.map(s => [s.id, s.name]));

            const addAssigneeName = (task) => ({
                ...task,
                assigneeName: task.assigneeId ? (staffMap.get(task.assigneeId) || 'Unassigned') : 'Unassigned'
            });

            if (jobNo) {
                // 2a. Fetch scrum data for a single project
                const scrumData = await publicAPI.get(STORES.DESIGN_SCRUM, jobNo);
                if (scrumData && scrumData.tasks) {
                    scrumData.tasks = scrumData.tasks.map(addAssigneeName);
                }
                return { staff: staffList, scrumData: scrumData || { jobNo, tasks: [] } };
            } else {
                // 2b. Fetch scrum data for all projects and create a cumulative view
                const allScrumData = await publicAPI.getAll(STORES.DESIGN_SCRUM);
                const cumulativeTasks = allScrumData.flatMap(projectScrum => {
                    if (projectScrum && Array.isArray(projectScrum.tasks)) {
                        return projectScrum.tasks.map(task => ({
                            ...addAssigneeName(task),
                            jobNo: projectScrum.jobNo // Add jobNo to each task
                        }));
                    }
                    return [];
                });

                const cumulativeScrumData = {
                    jobNo: 'All Projects',
                    tasks: cumulativeTasks
                };

                return { staff: staffList, scrumData: cumulativeScrumData };
            }
        },


        // --- MODIFICATION: New helper function to create Scrum tasks ---
        createScrumTaskFromSiteEvent: async (jobNo, { name, department, plannedDuration = 7, status = 'To Do', relatedRfiId = null }) => {
            if (!jobNo || !name || !department) {
                console.error("Missing required data for Scrum task creation.");
                return;
            }
            let scrumData = await publicAPI.getScrumData(jobNo);
            if (!scrumData) {
                scrumData = { jobNo, tasks: [] };
            }

            const maxId = scrumData.tasks.reduce((max, task) => Math.max(max, task.id), 999);
            const today = new Date();
            //const dueDate = new Date(today.setDate(today.getDate() + plannedDuration)).toISOString().split('T')[0];
            const dueDate = new Date(new Date().setDate(today.getDate() + plannedDuration)).toISOString().split('T')[0];
            const newTask = {
                id: maxId + 1,
                name: name,
                status: status,
                department: department,
                plannedDuration: plannedDuration,
                dueDate: dueDate,
                assigneeId: null,
                dateAdded: new Date().toISOString().split('T')[0],
                relatedRfiId: relatedRfiId // Adde
            };

            scrumData.tasks.push(newTask);
            await publicAPI.putScrumData(scrumData);
            console.log(`Scrum task created for ${jobNo}: "${name}"`);

            // Log to bulletin for visibility
            if (window.App && window.App.Bulletin) {
                window.App.Bulletin.log('Task Auto-Generated', `New task "<strong>${name}</strong>" created for project <strong>${jobNo}</strong>.`);
            }
        },

        // --- Bulletin Methods ---
        addBulletinItem: (item) => publicAPI.add(STORES.BULLETIN, item),
        getBulletinItems: async (limit = 50) => {
            const items = await publicAPI.getAll(STORES.BULLETIN);
            return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
        },

        // --- Holiday Methods ---
        getHolidays: async (countryCode, year) => {
            const items = await publicAPI.getAll(STORES.HOLIDAYS);
            return items.filter(h => h.countryCode === countryCode && String(h.year) === String(year));
        },
        addHolidays: (holidays, countryCode, year) => {
            return Promise.all((holidays || []).map(h => publicAPI.add(STORES.HOLIDAYS, { ...h, countryCode, year })));
        },
        getAllHolidays: () => publicAPI.getAll(STORES.HOLIDAYS),

        // --- Unified File Methods ---
        addFile: (fileData) => persistFileRecord(fileData),
        deleteFile: (id) => removeFileRecord(id),
        getFileById: async (id, skipHydration = false) => {
            const file = await publicAPI.get(STORES.FILES, id);
            return hydrateFileRecord(file, !skipHydration);
        },
        // --- FIX: Corrected getFiles to handle null jobNo + lazy hydration ---
        getFiles: async (jobNo, source, skipHydration = false) => {
            // If source is omitted, return all files for the job.
            if (typeof source === 'undefined' || source === null) {
                const allFiles = await publicAPI.getAll(STORES.FILES);
                const filteredByJob = (jobNo === null || typeof jobNo === 'undefined')
                    ? allFiles
                    : allFiles.filter(file => file.jobNo === jobNo);
                return Promise.all(filteredByJob.map(file => hydrateFileRecord(file, !skipHydration)));
            }

            // If jobNo is null/undefined, we can't use the compound index to query only by 'source'.
            // The correct approach is to get all files and filter them in JavaScript.
            if (jobNo === null || typeof jobNo === 'undefined') {
                const allFiles = await publicAPI.getAll(STORES.FILES);
                const filtered = allFiles.filter(file => file.source === source);
                return Promise.all(filtered.map(file => hydrateFileRecord(file, !skipHydration)));
            }
            // For provider portability, filter in JS instead of relying on IndexedDB indexes.
            const files = (await publicAPI.getAll(STORES.FILES)).filter(file => file.jobNo === jobNo && file.source === source);
            return Promise.all(files.map(file => hydrateFileRecord(file, !skipHydration)));
        },
        getFilesByCategory: (jobNo, source, category, skipHydration = false) => {
            return publicAPI.getFiles(jobNo, source, skipHydration)
                .then(files => files.filter(file => file.category === category));
        },
        getAllFiles: async (skipHydration = false) => {
            const files = await publicAPI.getAll(STORES.FILES);
            return Promise.all(files.map(file => hydrateFileRecord(file, !skipHydration)));
        },
        clearFilesBySource: async (jobNo, source) => {
            const files = await publicAPI.getFiles(jobNo, source);
            if (files.length === 0) return;
            for (const file of files) {
                await removeFileRecord(file.id);
            }
        },

        // --- COLLABORATIVE PROCESSING HELPERS ---

        /**
         * Merges imported project data with existing data.
         * Preserves existing documents unless specifically overwritten.
         * Merges Scrum tasks.
         */
        processProjectImport: async (project) => {
            const { masterDocuments, scrumTasks, ...importedData } = project;

            // 1. Merge Project Details
            const existingProject = await publicAPI.getProject(importedData.jobNo);
            const mergedProject = existingProject ? { ...existingProject, ...importedData } : importedData;

            // Merge Invoices separately to ensure no data loss
            if (existingProject && existingProject.invoices && importedData.invoices) {
                mergedProject.invoices = mergeLists(existingProject.invoices, importedData.invoices, 'no');
            }

            await publicAPI.putProject(mergedProject);

            // 2. Merge Master Files (Non-destructive)
            if (masterDocuments?.length) {
                await mergeFiles(importedData.jobNo, 'master', masterDocuments);
            }

            // 3. Ensure Site Data Exists (Create if new, Keep if exists)
            const existingSiteData = await publicAPI.getSiteData(importedData.jobNo);
            if (!existingSiteData) {
                const boqTemplateReq = await publicAPI.getFinancialTemplate('boq');
                const boqTemplate = boqTemplateReq ? boqTemplateReq.data : [];
                await publicAPI.putSiteData({
                    jobNo: importedData.jobNo, status: 'Pending Start', progress: 0,
                    boq: JSON.parse(JSON.stringify(boqTemplate)),
                    mom: [], paymentCertificates: [], scheduleOverrides: []
                });
            }

            // 4. Merge Scrum Tasks
            let mergedScrumTasks = scrumTasks || [];
            if (!scrumTasks) {
                // If import has no tasks, but we need defaults
                const defaultScrumTasks = (typeof DESIGN_SCRUM_TEMPLATE !== 'undefined' ? DESIGN_SCRUM_TEMPLATE : []).map(task => ({
                    ...task, status: 'Up Next', assigneeId: null, dueDate: null, startDate: null,
                    completedDate: null, dateAdded: new Date().toISOString().split('T')[0]
                }));
                mergedScrumTasks = defaultScrumTasks;
            }

            const existingScrumData = await publicAPI.getScrumData(importedData.jobNo);
            if (existingScrumData && existingScrumData.tasks) {
                // Merge existing tasks with imported ones (Imported wins if IDs match)
                mergedScrumTasks = mergeLists(existingScrumData.tasks, mergedScrumTasks, 'id');
            }

            await publicAPI.putScrumData({ jobNo: importedData.jobNo, tasks: mergedScrumTasks });
        },

        /**
         * Merges site update data (logs, files) with existing data.
         * Allows multiple users to contribute logs to the same project.
         */
        processSiteUpdateImport: async (update) => {
            const { siteFiles, ...importedSiteData } = update;

            // 1. Fetch Existing Site Data
            let existingSiteData = await publicAPI.getSiteData(update.jobNo) || { jobNo: update.jobNo };

            if (!existingSiteData) {
                existingSiteData = { jobNo: update.jobNo }; // Fallback
            }

            // 2. Merge Lists (Non-destructive)
            // We use 'id' or 'ref' to detect duplicates/updates. 
            // New items from different users are appended.
            const mergedSiteData = { ...existingSiteData, ...importedSiteData };

            // Specifically merge arrays that might be contributed to by different people
            if (existingSiteData.rfiLog || importedSiteData.rfiLog) {
                mergedSiteData.rfiLog = mergeLists(existingSiteData.rfiLog || [], importedSiteData.rfiLog || [], 'id');
            }
            if (existingSiteData.materialLog || importedSiteData.materialLog) {
                mergedSiteData.materialLog = mergeLists(existingSiteData.materialLog || [], importedSiteData.materialLog || [], 'id');
            }
            if (existingSiteData.mom || importedSiteData.mom) {
                // MoM usually doesn't have ID, might use date+ref, assuming 'date' for now or index based logic elsewhere.
                // If strict merging needed, add IDs to MoM creation. For now, we append if new.
                // Simple strategy: Combine and Dedupe by Ref string
                const exMom = existingSiteData.mom || [];
                const impMom = importedSiteData.mom || [];
                // Simple concat for now, sophisticated logic requires Unique IDs on MoMs
                // mergedSiteData.mom = [...exMom, ...impMom]; // This duplicates. 
                // Better:
                mergedSiteData.mom = mergeLists(exMom, impMom, 'ref');
            }
            if (existingSiteData.statusLog || importedSiteData.statusLog) {
                mergedSiteData.statusLog = mergeLists(existingSiteData.statusLog || [], importedSiteData.statusLog || [], 'date');
            }

            await publicAPI.putSiteData(mergedSiteData);

            // 3. Merge Site Files (Photos, Docs)
            if (siteFiles?.length) {
                await mergeFiles(update.jobNo, 'site', siteFiles);
            }
        }
    };

    // EXPOSE TO WINDOW
    window.DB = publicAPI;

})();