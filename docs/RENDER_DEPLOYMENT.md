# LabCare Pro - Render Free Tier Deployment Guide

This guide details how to deploy the **LabCare Pro LIMS Backend** on the **Render Free Tier** paired with **MongoDB Atlas Free M0 Cluster**, achieving **100% free hosting with zero ongoing costs**.

---

## Architecture Overview on Free Tier

```
┌─────────────────────────────────┐           ┌────────────────────────────────┐
│   Vercel Free Tier (Frontend)   │           │   Render Free Tier (Backend)   │
│   Next.js React Application     │           │   Node.js / Express TypeScript │
│   https://your-app.vercel.app   │           │   https://labcare.onrender.com │
└────────────────┬────────────────┘           └──────────────┬─────────────────┘
                 │ Cross-Site HTTP-Only Cookies              │
                 │ (SameSite=None; Secure=true)              │ Mongoose TLS Connection
                 ▼                                           ▼
┌─────────────────────────────────┐           ┌────────────────────────────────┐
│   Local Disk Storage Fallback   │           │   MongoDB Atlas (Free M0)      │
│   Render Ephemeral Disk         │           │   512 MB Storage               │
│   storage/uploads/              │           │   Replica Set TLS              │
└─────────────────────────────────┘           └────────────────────────────────┘
```

---

## Step 1: Set Up MongoDB Atlas Free M0 Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Click **Create a Deployment** and select **M0 Shared (Free)**:
   - Cloud Provider: **AWS**
   - Region: Select region closest to your Render service (e.g., `us-east-1` or `frankfurt`).
   - Cluster Name: `labcare-cluster`.
3. Set up **Database Access**:
   - Go to **Database Access** -> **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `labcare_admin`.
   - Password: Generate a secure password (e.g., 32 characters).
   - Database User Privileges: **Read and write to any database**.
4. Set up **Network Access**:
   - Go to **Network Access** -> **Add IP Address**.
   - Select **Allow Access from Anywhere (`0.0.0.0/0`)** since Render free tier uses dynamic IP addresses.
5. Retrieve Connection String:
   - Go to **Database** -> **Connect** -> **Drivers**.
   - Select **Node.js** (version 5.5 or later).
   - Copy connection URI:
     ```
     mongodb+srv://labcare_admin:<password>@labcare-cluster.xxxx.mongodb.net/labcare_pro?retryWrites=true&w=majority&appName=LabCareCluster
     ```

---

## Step 2: Deploy to Render Free Web Service

### Option A: Using `render.yaml` (Infrastructure as Code - Recommended)

1. Push your repository to GitHub or GitLab.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your repository. Render will automatically detect `render.yaml`.
5. Fill in the required environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `SESSION_SECRET`: A 64-character random hex string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - `CORS_ORIGIN`: Your frontend URL (e.g. `https://your-lims.vercel.app` or `*` for testing).
6. Click **Apply**.

### Option B: Manual Web Service Setup

1. Click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure service settings:
   - **Name**: `labcare-pro-backend`
   - **Region**: Same region as your MongoDB cluster (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`).
   - **Branch**: `main`
   - **Root Directory**: (Leave blank if root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ($0/month)

---

## Step 3: Required Environment Variables on Render

In Render Dashboard -> **Environment Variables**, configure the following:

| Variable Name | Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations and secure cookies |
| `PORT` | `10000` | Port automatically provided by Render |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas Free M0 URI |
| `SESSION_SECRET` | *(64-hex string)* | Used for AES-256-GCM encryption & session keys |
| `STORAGE_PROVIDER` | `local` | Uses local disk fallback (zero S3 cloud costs) |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Front-end URL allowed to send credentials |
| `COOKIE_SECURE` | `true` | Required for HTTPS on Render (`*.onrender.com`) |
| `COOKIE_SAME_SITE` | `none` | Required for cross-domain cookies between Render and Vercel |
| `COOKIE_DOMAIN` | *(leave empty)* | Allows cookie binding to the Render domain |
| `LOG_LEVEL` | `info` | Structured JSON log output |
| `DEFAULT_ADMIN_EMAIL` | `admin@yourlab.com` | Initial admin account email |
| `DEFAULT_ADMIN_PASSWORD` | `SecureAdminPassword2026!` | Initial admin password (min 12 chars with complexity) |

---

## Step 4: Cross-Domain Cookie Exchange (Render Backend + Vercel Frontend)

When your frontend runs on `https://your-frontend.vercel.app` and your backend runs on `https://labcare-pro-backend.onrender.com`:

1. **Browsers treat this as cross-origin / third-party context**.
2. To allow the `labcare_access_token` and `labcare_refresh_token` cookies to be sent back and forth:
   - `COOKIE_SAME_SITE=none` **must** be set.
   - `COOKIE_SECURE=true` **must** be set (enforced automatically in production).
   - `CORS_ORIGIN` must match your Vercel URL **exactly** (no trailing slash, e.g. `https://your-frontend.vercel.app`).
   - `Access-Control-Allow-Credentials: true` is enabled by default in LabCare Pro.

---

## Step 5: Handling Free Tier Sleep (Spin-Down)

Render Free Web Services spin down after **15 minutes of inactivity**. The first subsequent request can take 30-50 seconds to boot up.

### Free Keep-Alive Solutions:
1. **UptimeRobot (Free)**:
   - Register at [uptimerobot.com](https://uptimerobot.com).
   - Add New Monitor -> **HTTP(s)**.
   - URL: `https://labcare-pro-backend.onrender.com/health`
   - Monitoring Interval: **Every 10 minutes**.
   - This keeps your free Render backend warm 24/7 at zero cost!
2. **Cron-Job.org (Free)**:
   - Set a scheduled GET request to `https://labcare-pro-backend.onrender.com/health` every 10 minutes.

---

## Step 6: Verifying Deployment

Run the following cURL command against your deployed Render instance:

```bash
# 1. Health check
curl -X GET https://labcare-pro-backend.onrender.com/health

# 2. Login test
curl -i -X POST https://labcare-pro-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@labcarepro.internal","password":"Admin@LabCarePro2026!","rememberMe":true}'
```

Verify that the response returns `200 OK` and includes the two `Set-Cookie` headers:
- `labcare_access_token=...; Path=/; HttpOnly; Secure; SameSite=None`
- `labcare_refresh_token=...; Path=/; HttpOnly; Secure; SameSite=None; Expires=...` (30 days from now)
