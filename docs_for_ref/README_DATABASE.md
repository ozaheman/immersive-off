# Database Deployment and Provider Switching

This project now supports database provider switching through environment variables.

## Supported Providers

- `indexeddb`: Browser local storage (existing behavior).
- `mongodb`: Remote persistence through a Node API + MongoDB Atlas.
- `postgresql`: Remote persistence through a Node API + PostgreSQL.

The frontend (`js/database.js`) reads `DB_PROVIDER` and automatically switches behavior.
In deployed mode it reads runtime values from `GET /api/config`.

## Architecture

- Frontend still uses `window.DB` methods already used across the app.
- When `DB_PROVIDER=indexeddb`:
  - Uses IndexedDB directly in browser.
- When `DB_PROVIDER=mongodb` or `postgresql`:
  - Frontend calls `/api/db/...` routes.
  - Backend persists data in selected provider.

## New Files Added

- `package.json`
- `server/index.js`
- `server/db/storeConfig.js`
- `server/db/index.js`
- `server/db/adapters/mongoAdapter.js`
- `server/db/adapters/postgresAdapter.js`

## Required `.env` Variables

```env
DB_PROVIDER=mongodb
DB_API_BASE_URL=/api
PORT=8080

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=urbanaxis

# PostgreSQL
POSTGRES_URL=postgresql://<username>:<password>@<host>:5432/<database>
POSTGRES_SSL_MODE=require
```

## Run With MongoDB Atlas

1. Fill `MONGODB_URI` and `MONGODB_DB_NAME` in `.env`.
2. Set `DB_PROVIDER=mongodb`.
3. Install dependencies:

```bash
npm install
```

4. Start server:

```bash
npm start
```

5. Open app via:

```text
http://localhost:8080
```

## Switch to PostgreSQL Later

1. Set `DB_PROVIDER=postgresql`.
2. Fill `POSTGRES_URL`.
3. Keep running `npm start`.

No frontend code changes are required to switch providers.

## API Endpoints (Internal)

- `GET /api/health`
- `GET /api/db/:store`
- `GET /api/db/:store/:id`
- `POST /api/db/:store`
- `PUT /api/db/:store/:id`
- `DELETE /api/db/:store/:id`
- `DELETE /api/db/:store` (optional query filter)

## Notes

- For production, secure server access and lock down origins.
- Do not expose raw DB credentials in browser-only deployment.
- This update keeps external library usage minimal:
  - `express`, `mongodb`, `pg`, `dotenv`
