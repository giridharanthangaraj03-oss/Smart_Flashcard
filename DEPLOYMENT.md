# Gisul - Deployment Guide

## Architecture Overview

```
Frontend (React + Vite) ──deployed to──> Vercel
     │
     └──API calls──> Backend (Node.js + Express) ──deployed to──> Render
                         │
                         └──NLP Service (FastAPI) ──deployed to──> Render
```

---

## Fixed Issues

### 1. ✅ SPA Routing - 404 on Page Reload
**Problem**: After deploying to Vercel and refreshing the page on any route (e.g., `/dashboard`, `/profile`), users would get a 404 error.

**Root Cause**: Vercel was treating routes as file requests instead of letting React Router handle them.

**Solution**:
- **vercel.json**: Updated rewrite rule to redirect all non-file paths to `index.html`
- **.vercelignore**: Excludes unnecessary files from build
- **vite.config.js**: Build output set to `dist/` directory

### 2. ✅ API Endpoint Communication
**Problem**: Frontend needs to call the backend API deployed on a different domain (Render).

**Solution**:
- **.env.production**: `VITE_API_URL` points to Render backend
- **.env.local**: Points to localhost for development
- **vite.config.js**: Dev server proxies `/api` to `http://localhost:5000`

### 3. ✅ Service Health Monitoring
**Status**: Integrated into ProfilePage
- Displays Backend, NLP Service, and Database status
- Auto-refreshes every 30 seconds
- Color-coded indicators (green=healthy, amber=degraded, gray=offline)

---

## Local Development Setup

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# NLP Service
cd ../nlp-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Run Locally
```bash
# Terminal 1: Backend (port 5000)
cd backend
npm start

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev

# Terminal 3: NLP Service (port 8000)
cd nlp-service
.venv\Scripts\activate
python app.py
```

The frontend automatically proxies `/api` calls to `http://localhost:5000/api` during development.

---

## Production Deployment

### Frontend (Vercel)

#### Step 1: Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" → Select "Import Git Repository"
3. Select your gisul repository
4. Select "Frontend" as the root directory

#### Step 2: Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```
VITE_API_URL=https://smart-flashcard-backend.onrender.com/api
```

**Note**: Replace `smart-flashcard-backend` with your actual Render backend service name.

#### Step 3: Deploy
- Click "Deploy"
- Vercel automatically runs `npm install` and `npm run build`
- Frontend deployed at `https://your-vercel-app.vercel.app`

### Backend (Render)

#### Step 1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create new "Web Service" from GitHub
3. Select your gisul repository
4. Configure:
   - **Name**: `smart-flashcard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Step 2: Configure Environment Variables
In Render service settings → Environment, add:

```
MONGODB_URI=<your-mongodb-atlas-connection-string>
NLP_SERVICE_URL=http://localhost:8000
NODE_ENV=production
PORT=3000
```

#### Step 3: Deploy
- Click "Deploy"
- Render automatically starts the service
- Backend available at `https://smart-flashcard-backend.onrender.com`

### NLP Service (Render)

#### Step 1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create new "Web Service" from GitHub
3. Select your gisul repository
4. Configure:
   - **Name**: `smart-flashcard-nlp`
   - **Root Directory**: `nlp-service`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:8000 app:app`
   - **Plan**: Free

#### Step 2: Configure Environment Variables
In Render service settings → Environment, add:

```
NLP_LIGHTWEIGHT=0
PYTHONUNBUFFERED=1
```

#### Step 3: Deploy
- Click "Deploy"
- NLP service available at `https://smart-flashcard-nlp.onrender.com`

---

## Post-Deployment Testing

### 1. Check Backend Health
```bash
curl https://smart-flashcard-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "nlp_service": "ok",
  "uptime_seconds": 123
}
```

### 2. Test Flashcard Generation
1. Go to frontend: `https://your-vercel-app.vercel.app`
2. Sign up or login
3. Create flashcards from study material
4. Verify answers are contextually derived from questions

### 3. Verify SPA Routing
1. Navigate to `/profile` or `/dashboard`
2. Refresh page (Ctrl+R or Cmd+R)
3. Should NOT return 404 - React Router should handle it

### 4. Monitor Service Health
1. Go to Profile page
2. Scroll to "Service Health" section
3. Should show:
   - ✅ Backend: Healthy (green)
   - ✅ NLP Service: Healthy (green)
   - ✅ Database: Connected (green)

---

## Troubleshooting

### Issue: 404 on Page Refresh
**Check**:
- ✅ vercel.json is in frontend directory
- ✅ vercel.json has correct rewrite rules
- ✅ Build output is `dist/`

### Issue: API Calls Failing
**Check**:
- ✅ `VITE_API_URL` environment variable set in Vercel
- ✅ Backend service running on Render
- ✅ CORS enabled on backend (should be)

### Issue: NLP Service Errors
**Check**:
- ✅ Backend → Environment variable `NLP_SERVICE_URL` points to correct Render URL
- ✅ NLP service running on Render
- ✅ Memory usage < 512MB (Render free tier limit)

### Issue: Service Health Shows "Offline"
**Check**:
- ✅ Backend `/api/health` endpoint responding
- ✅ NLP service `/health` endpoint responding
- ✅ Database connection string correct

---

## Performance Notes

- **Frontend**: Vite builds optimized SPA with code splitting
- **Backend**: Includes retry logic for NLP service (3 attempts, exponential backoff)
- **NLP Service**: Lightweight mode available via `NLP_LIGHTWEIGHT=1`
- **Health Checks**: Frontend refreshes service status every 30 seconds

---

## Next Steps

1. **Deploy Frontend to Vercel**
   ```bash
   git push origin main
   ```
   Vercel automatically detects changes and redeploys.

2. **Monitor Logs**
   - Vercel: Dashboard → Deployments → View Build Logs
   - Render: Dashboard → Services → View Logs

3. **Test End-to-End**
   - Create flashcard sets
   - Verify answers match questions
   - Refresh page at different routes

4. **Track Metrics**
   - Profile page shows real-time service health
   - Render dashboard shows memory usage
   - Check response times for API endpoints
