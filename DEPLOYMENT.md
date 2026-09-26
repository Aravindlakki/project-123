# PLACEMEIN CRM - Deployment Guide

This project is configured to deploy with **Vercel** for the Frontend and **Render** for the Backend from your single GitHub repository.

---

## 1. Backend Deployment on Render (Web Service)

1. Go to [render.com](https://render.com/) and sign in.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`placemein-cra-outreach` or your repo name).
4. Configure the settings:
   - **Name**: `placemein-backend`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Region**: Any (e.g. *Oregon, US*)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `SECRET_KEY` = (any random secure secret string)
   - `GEMINI_API_KEY` = *(Optional: your Gemini API key)*
   - `FRONTEND_URL` = *(Optional: your Vercel URL once created, e.g. `https://your-frontend.vercel.app`)*
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, e.g.:
   `https://placemein-backend.onrender.com`

> **Note**: Test your backend health check by visiting:
> `https://your-backend.onrender.com/api/health`

---

## 2. Frontend Deployment on Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in.
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect `Vite` thanks to `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `vite build` or `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **`VITE_API_URL`**: Your Render backend URL from Step 1, e.g.:
     `https://placemein-backend.onrender.com`
   - **`VITE_BASE_PATH`**: `/`
6. Click **Deploy**.
7. Your app is live at `https://your-frontend.vercel.app`!

---

## 3. How the Architecture Works Together

- **Dynamic Routing**: The frontend automatically routes all API requests (`/auth/login`, `/worksheets`, `/crm`, `/jds`, etc.) to your Render backend via `VITE_API_URL`.
- **CORS Pre-Configured**: The Express backend in `server.ts` is configured with credentials and origin reflection for all `*.vercel.app` and custom domains.
- **Resilient Fallback**: Even if the Render free-tier backend is cold-starting (or waking up after inactivity), the frontend client-side store allows immediate offline usage and credential matching without breaking the UI.
- **Hash & SPA Routing**: `vercel.json` and React hash routing handle client-side refreshes seamlessly without 404s.
