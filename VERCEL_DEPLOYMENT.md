# Vercel Deployment Guide for UrbanAxis Immersive

## Quick Summary

Your project is a **Node.js/Express backend with vanilla JS frontend**. For Vercel deployment:

### Vercel Settings
| Setting | Value |
|---------|-------|
| **Framework** | `Other` (Custom) |
| **Build Command** | (leave empty) |
| **Output Directory** | (leave empty) |
| **Install Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Node.js Version** | `20.x` |

### Files Already Created
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.vercel.example` - Environment variables template

---

## Step-by-Step Deployment

### 1. Commit vercel.json
```bash
git add vercel.json .env.vercel.example
git commit -m "Add Vercel deployment configuration"
git push
```

### 2. Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository: `immersive-off`
4. Click "Import"

### 3. Configure Environment Variables
In Vercel Project Settings > Environment Variables, add:

**For MongoDB (Recommended):**
```
DB_PROVIDER = mongodb
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME = immersive_db
```

**For PostgreSQL:**
```
DB_PROVIDER = postgresql
POSTGRES_URL = postgresql://user:password@host:5432/immersive_db
POSTGRES_SSL_MODE = require
```

**For Both:**
```
PORT = 3000
NODE_ENV = production
DB_API_BASE_URL = /api
```

**Optional - Google Drive:**
```
GOOGLE_DRIVE_ENABLED = true
GOOGLE_DRIVE_OAUTH_CLIENT_ID = your_client_id
GOOGLE_DRIVE_OAUTH_CLIENT_SECRET = your_client_secret
GOOGLE_DRIVE_ROOT_FOLDER = UrbanAxis Media
```

### 4. Deploy
Click "Deploy" and wait for completion (~2-3 minutes)

---

## Database Setup

### Option 1: MongoDB Atlas (Recommended - Free)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create M0 cluster (free tier)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
5. Paste into `MONGODB_URI` in Vercel

### Option 2: PostgreSQL
- **Vercel Postgres**: Free tier available, integrated with Vercel
- **Railway.app**: Free $5/month credit
- **Supabase**: Free PostgreSQL database

---

## Google Drive Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project "UrbanAxis"
3. Enable "Google Drive API"
4. Create OAuth 2.0 credentials (Web application)
5. Add Vercel domain to authorized origins: `https://yourdomain.vercel.app`
6. Copy Client ID and Secret → Vercel env vars

---

## Testing Deployment

Once deployed, test:

```bash
# Health check (should return {"ok":true,...})
curl https://your-app.vercel.app/api/health

# Config check (should return DB_PROVIDER and other settings)
curl https://your-app.vercel.app/api/config

# Home page
curl https://your-app.vercel.app/index.html
```

---

## Project Structure

```
immersive-off/
├── server/
│   ├── index.js              # Express app (entry point)
│   ├── db/
│   │   ├── index.js          # DB adapter factory
│   │   ├── storeConfig.js    # Store definitions
│   │   └── adapters/
│   │       ├── mongoAdapter.js
│   │       └── postgresAdapter.js
├── js/                        # Frontend modules
├── css/                       # Stylesheets
├── *.html                     # HTML pages (static)
├── package.json              # Node.js dependencies
├── vercel.json              # Vercel config
└── .env                     # Local env vars (don't push)
```

---

## Important Notes

### ⚠️ Vercel Limitations
- **Free Tier**: 10-second serverless function timeout
- **Pro Tier**: 60-second timeout (recommended for file uploads)
- **Build Size**: 6GB limit
- **Deployments**: 50/month on free tier, unlimited on pro

### ✅ What Works
- Express server serving static HTML/CSS/JS
- MongoDB and PostgreSQL databases
- Google Drive file uploads
- File uploads up to 25MB
- All API endpoints

### ❌ What Doesn't Work
- IndexedDB server persistence (browser-only)
- Persistent file storage (use external DB/Drive)
- Scheduled tasks (use separate service)

---

## Costs

**Minimum Production Setup:**
- Vercel: $0-20/month
- MongoDB: $0 (Atlas free tier)
- Google Drive: $0 (included with Google account)
- **Total: $0-20/month**

**For Higher Traffic:**
- Vercel Pro: $20/month
- MongoDB Paid: $45+/month
- **Total: $65+/month**

---

## Troubleshooting

### "Cannot find module 'mongodb'" or 'pg'
→ Check that `npm install` ran. Dependencies should be in `package.json`.

### "DB_PROVIDER not set"
→ Add environment variables in Vercel dashboard, redeploy.

### "Failed to connect to MongoDB"
→ Check `MONGODB_URI` is correct. Add Vercel IP to MongoDB whitelist (0.0.0.0/0 for development).

### "CORS errors on Google Drive"
→ Add your Vercel domain to Google OAuth authorized origins.

### "File size exceeds limit"
→ Express is limited to 25MB. Use Google Drive for larger files.

---

## Next Steps

1. ✅ Create `vercel.json` (already done)
2. ✅ Create `.env.vercel.example` (already done)
3. Push changes to GitHub
4. Set up database (MongoDB Atlas or PostgreSQL)
5. Create Vercel project and deploy
6. Configure environment variables
7. Test health endpoint
8. Share Vercel URL!

---

## Support Resources

- [Vercel Docs](https://vercel.com/docs)
- [Express on Vercel](https://vercel.com/docs/runtimes/nodejs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [PostgreSQL on Vercel](https://vercel.com/docs/storage/vercel-postgres)

