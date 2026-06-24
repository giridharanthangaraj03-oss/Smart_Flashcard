# Render Deployment Guide - All Services

Complete guide to deploy Gisul (Frontend + Backend + NLP) on Render.

## Architecture

```
┌─────────────────────────────────┐
│   Frontend (React + Vite)       │
│  smart-flashcard-frontend       │
│   Renders: index.html           │
│   Route: https://gisul-frontend │
└──────────────┬──────────────────┘
               │ API calls to /api
               │
┌──────────────▼──────────────────┐
│  Backend (Node.js + Express)    │
│  smart-flashcard-backend        │
│  Route: https://gisul-backend   │
└──────────────┬──────────────────┘
               │ Calls NLP service
               │
┌──────────────▼──────────────────┐
│   NLP Service (FastAPI)         │
│  smart-flashcard-nlp            │
│  Route: https://gisul-nlp       │
└─────────────────────────────────┘
```

---

## Prerequisites

1. **Render Account**: [render.com](https://render.com)
2. **GitHub Repository**: Connected to Render
3. **MongoDB Atlas**: Connection string ready
4. **Environment Variables**: Prepared

---

## Deployment Steps

### Option 1: Deploy Using root `render.yaml` (Recommended)

#### Step 1: Update Environment Variables
Before deploying, update the configuration files:

1. **Frontend** - Update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend-service.onrender.com/api
   ```

2. **Backend** - Update `backend/.env`:
   ```env
   NLP_SERVICE_URL=https://your-nlp-service.onrender.com
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=<your-mongodb-atlas-uri>
   ```

#### Step 2: Push Changes to GitHub
```bash
git add render.yaml backend/render.yaml frontend/.env.production
git commit -m "chore: update Render deployment configuration for all-on-Render setup"
git push origin main
```

#### Step 3: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Select **"Blueprint"**
3. Select your GitHub repository
4. Render will auto-detect `render.yaml` from root
5. Click **"Deploy"**

Render will create all three services automatically:
- Frontend Web Service
- Backend Web Service  
- NLP Web Service
- MongoDB database

---

### Option 2: Manual Service Creation

#### Service 1: Deploy Backend
1. Create new **Web Service** on Render
2. Select your GitHub repository
3. Configure:
   - **Name**: `smart-flashcard-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NLP_SERVICE_URL=https://smart-flashcard-nlp.onrender.com
     NODE_ENV=production
     PORT=3000
     MONGODB_URI=<your-mongodb-uri>
     ```
4. Click **"Deploy"**

#### Service 2: Deploy NLP Service
1. Create new **Web Service** on Render
2. Select your GitHub repository
3. Configure:
   - **Name**: `smart-flashcard-nlp`
   - **Root Directory**: `nlp-service`
   - **Runtime**: Python 3.12
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `gunicorn -w 2 -b 0.0.0.0:8000 app:app`
   - **Environment Variables**:
     ```
     NLP_LIGHTWEIGHT=0
     PYTHONUNBUFFERED=1
     ```
4. Click **"Deploy"**

#### Service 3: Deploy Frontend
1. Create new **Web Service** on Render
2. Select your GitHub repository
3. Configure:
   - **Name**: `smart-flashcard-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://smart-flashcard-backend.onrender.com/api
     NODE_ENV=production
     ```
4. Click **"Deploy"**

---

## Important Notes

### Service URLs
After deployment, each service gets a Render URL:
- **Frontend**: `https://smart-flashcard-frontend.onrender.com`
- **Backend**: `https://smart-flashcard-backend.onrender.com`
- **NLP**: `https://smart-flashcard-nlp.onrender.com`

Update environment variables if service names differ.

### SPA Routing
Frontend Vite dev server with SPA fallback:
- All non-file paths route to `index.html`
- React Router handles client-side navigation
- Page refresh on any route returns the app, not 404

### Health Checks
Each service has a health check endpoint:
- **Backend**: `GET /api/health` (returns 200/503)
- **NLP Service**: `GET /health` (returns 200/503)
- **Frontend**: `GET /` (returns index.html)

### Cold Start Handling
- Render free tier: Services sleep after 15 min inactivity
- First request after sleep takes 30-50 seconds
- Backend implements retry logic for NLP service cold starts
- Health monitoring on frontend shows service status

### Memory Limits
- **Render free tier**: 512MB per service
- **NLP Service**: ~400MB with spaCy model
- **Backend**: ~150-200MB with Express
- **Frontend**: ~50MB (static files only)

---

## Post-Deployment Testing

### 1. Check Service Health
```bash
# Backend health
curl https://smart-flashcard-backend.onrender.com/api/health

# NLP Service health
curl https://smart-flashcard-nlp.onrender.com/health
```

### 2. Test Frontend
- Visit: `https://smart-flashcard-frontend.onrender.com`
- Try refreshing page at different routes (e.g., `/profile`)
- Should not return 404

### 3. Create Test Flashcards
1. Sign up on frontend
2. Create flashcard set with study material
3. Verify answers are contextually derived from questions
4. Check Service Health section shows all services healthy

### 4. Monitor Logs
- Render Dashboard → Service → Logs
- Check for any errors or warnings

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend shows 404 on refresh | Check `vercel.json` not interfering; ensure Vite build works locally |
| API calls failing | Verify `VITE_API_URL` environment variable in frontend service |
| NLP Service timeout | Increase timeout; check memory usage; enable lightweight mode |
| Cold start errors | Backend includes retry logic; wait for logs to confirm startup |
| Service health shows offline | Check health endpoints responding; verify environment variables |

---

## Environment Variable Checklist

### Frontend (`VITE_API_URL`)
- [ ] Set to backend service URL
- [ ] Format: `https://service-name.onrender.com/api`
- [ ] No trailing slash

### Backend (`NLP_SERVICE_URL`)
- [ ] Set to NLP service URL
- [ ] Format: `https://service-name.onrender.com`
- [ ] No `/api` path

### Backend (`MONGODB_URI`)
- [ ] Connection string from MongoDB Atlas
- [ ] Includes username and password
- [ ] Network access allowed from Render

### NLP Service
- [ ] `PYTHONUNBUFFERED=1` for immediate log output
- [ ] `NLP_LIGHTWEIGHT=0` for full model (or `1` for lightweight)

---

## Rollback & Updates

### To rollback a service:
1. Render Dashboard → Service
2. Click **"Rollback"**
3. Select previous deployment

### To update code:
1. Push changes to GitHub
2. Render auto-detects and redeploys
3. Or manually trigger redeploy from dashboard

---

## Cost Optimization

- **Free tier**: 1 month of 750 compute hours per month
- **Three services**: ~225 hours/month if always running
- **Recommendation**: Use free tier for development/testing
- **Production**: Consider paid plan for reliability

---

## Support

- **Render Status**: https://status.render.com
- **Documentation**: https://render.com/docs
- **Community**: Render Discord community

