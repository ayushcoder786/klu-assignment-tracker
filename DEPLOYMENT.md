# KLU Assignment Tracker — Production Deployment Guide

This guide details the complete production deployment procedure for the **KLU Assignment Tracker** PWA and Spring Boot backend.

---

## 1. System Architecture

```
                                  ┌─────────────────────────────┐
                                  │   KLU University Moodle     │
                                  │ (lms.kluniversity.in/login) │
                                  └──────────────▲──────────────┘
                                                 │
                                                 │ Moodle Web Services
                                                 │ (token.php / REST)
                                                 ▼
┌──────────────────────────┐    HTTPS / WSS    ┌─────────────────────────────┐
│    Frontend PWA          │ ────────────────► │    Backend Web Service      │
│  (Vercel / Netlify /     │ ◄──────────────── │  (Spring Boot / Java 25     │
│   Render Static Site)    │    REST / JSON    │   on Render / Railway / VM) │
└──────────────────────────┘                   └──────────────┬──────────────┘
       ▲            ▲                                         │
       │            │                                         │
  Web  │            │ Push                                    │
  Push │            │ Payload                                 │ Spring Data
       │            │                                         │ MongoDB
┌──────┴────────────┴──────┐                   ┌──────────────▼──────────────┐
│  Browser / OS Notification│                   │    MongoDB Atlas Cluster    │
│  Service (FCM / Mozilla) │                   │  (Database: assignment_db)  │
└──────────────────────────┘                   └─────────────────────────────┘
```

---

## 2. Recommended Production Hosting Platforms

| Component | Recommended Platform | Why | Cost |
|---|---|---|---|
| **Frontend (PWA)** | **Vercel** or **Netlify** or **Render Static Site** | Automatic HTTPS (mandatory for Service Worker & Web Push), global CDN edge routing, SPA rewrite support out of the box via `vercel.json` / `_redirects`. | Free tier available |
| **Backend (API)** | **Render Web Service** or **Railway** or **Fly.io** | Supports Java 25 / Docker containers, zero-downtime deploys, environment variables management, native TLS termination. | Free / Low-cost tiers |
| **Database** | **MongoDB Atlas** | Managed replica set, automatic backups, IP access controls, connection pooling. | Free M0 tier |

---

## 3. Environment Variables Reference

### Backend (`backend/assignment-tracker`)

Set these environment variables in your cloud hosting provider (e.g. Render Dashboard -> Environment):

| Variable Name | Required | Default / Example | Description |
|---|:---:|---|---|
| `PORT` | Optional | `8081` | Port the server listens on (cloud providers like Render inject this automatically). |
| `MONGODB_URI` | **Required** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/klu_assignment_tracker?authSource=admin` | MongoDB Atlas connection string. |
| `MONGODB_DATABASE` | Optional | `klu_assignment_tracker` | Name of the MongoDB database. |
| `JWT_SECRET` | **Required** | Strong random 256-bit string | Secret key for signing student JWTs (`openssl rand -base64 32`). |
| `JWT_EXPIRATION_MS` | Optional | `86400000` (24h) | JWT validity duration in milliseconds. |
| `FRONTEND_URL` | **Required** | `https://klu-tracker.vercel.app` | Allowed CORS origin for the frontend (comma-separated if multiple). |
| `VAPID_PUBLIC_KEY` | **Required** | 87-char Base64url EC key | VAPID public key for Web Push. |
| `VAPID_PRIVATE_KEY` | **Required** | 44-char Base64url EC key | VAPID private key (NEVER commit to Git). |
| `VAPID_SUBJECT` | Optional | `mailto:admin@yourdomain.com` | Mailto URI identifying push notification sender. |
| `LMS_TOKEN_URL` | Optional | `https://lms.kluniversity.in/login/token.php` | KLU Moodle official token endpoint. |
| `LMS_REST_URL` | Optional | `https://lms.kluniversity.in/webservice/rest/server.php` | KLU Moodle REST Web Services endpoint. |
| `SYNC_INTERVAL_MINUTES` | Optional | `30` | Interval in minutes for background assignment synchronization. |

---

### Frontend (`frontend`)

Set these environment variables in your frontend deployment provider (e.g. Vercel Project Settings -> Environment Variables):

| Variable Name | Required | Example | Description |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | **Required in Prod** | `https://klu-tracker-api.onrender.com` | URL of your deployed backend (no trailing slash). |

---

## 4. Step-by-Step Deployment Instructions

### Step A: Generate Production VAPID Keys
Run the VAPID key generator once:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.4"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
./mvnw compile exec:java -Dexec.mainClass=com.klu.assignmenttracker.GenerateVapidKeys
```
Save the public and private keys safely for the environment variables setup.

---

### Step B: Deploy the Backend (Render Example)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your Git repository (or deploy via Docker using `backend/assignment-tracker/Dockerfile`).
3. Set **Root Directory** to `backend/assignment-tracker`.
4. If using Native Environment:
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/assignment-tracker-0.0.1-SNAPSHOT.jar`
5. Add the Environment Variables listed in Section 3 above (`MONGODB_URI`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `FRONTEND_URL`).
6. Deploy and copy your backend URL (e.g. `https://klu-tracker-api.onrender.com`).
7. Verify health: `curl https://klu-tracker-api.onrender.com/actuator/health` -> `{"status":"UP"}`.

---

### Step C: Deploy the Frontend (Vercel Example)
1. In [Vercel Dashboard](https://vercel.com), click **Add New...** -> **Project**.
2. Select your repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://klu-tracker-api.onrender.com`
8. Click **Deploy**.
9. Update the backend's `FRONTEND_URL` environment variable with your new Vercel domain (e.g. `https://klu-tracker.vercel.app`).

---

## 5. Security Checklist

- [x] HTTPS enforced on frontend (required by Web Push and PWA Service Worker).
- [x] `VAPID_PRIVATE_KEY` stored exclusively as environment variable.
- [x] LMS student passwords never logged, stored in MongoDB, or returned in API responses.
- [x] Moodle tokens stored transiently in-memory with TTL; never persisted to database.
- [x] JWT tokens contain only student ID/email subject; never credentials or tokens.
- [x] Production CORS restricted to `FRONTEND_URL`.
- [x] Actuator endpoints restricted to `health` and `info` with non-sensitive status.
- [x] `.gitignore` verified to block all `.env` files, logs, and build artifacts.
