# Coolify Deployment Guide - Nutika EJT

This guide explains how to deploy the **Nutika Elektrivõrgu Juhtimiskeskus (Smart Power Grid Control Center)** application to **Coolify**, a modern self-hosted alternative to Heroku/Render.

---

## Overview

The Nutika EJT application is fully containerized using **Docker Compose**, orchestrating the following services:
1. **`app-backend`**: Express API + TypeScript server running in Bun.
2. **`app-frontend`**: React + Vite UI compiled in Bun and served via Nginx.
3. **`redis`**: Cache and session store.
4. **`prometheus`**: Scrapes and exports performance metrics.
5. **`grafana`** / **`loki`**: Log aggregation and visualization dashboards.

Because of this complete containerization, deploying to Coolify takes just a few clicks!

---

## Prerequisites

Before starting, ensure you have:
1. **Coolify Instance**: A running self-hosted Coolify server on your VPS.
2. **GitHub Repository**: A fork or clone of the `nutika-ejt` project on GitHub.
3. **Neon PostgreSQL Database**: A hosted PostgreSQL instance (provided by Neon).
4. **Telegram Bot Token** (Optional): Bot credentials for real-time notifications.

---

## ⚠️ CRITICAL DEPLOYMENT GOTCHAS (Read First!)

### 1. Fully Automated Database Initialization
You **DO NOT** need to SSH into your server to run database migrations or seed default users!
The backend `Dockerfile` has an automated startup command:
```dockerfile
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && (bun run dist/seed.js || true) && bun run dist/index.js"]
```
This means as soon as the backend container starts on Coolify, it will:
* Sync your PostgreSQL database schema to Neon.
* Seed the default `admin@nutika.ee` / `user@nutika.ee` accounts.
* Startup the server.

### 2. Vite Build-Time Environment Variables
Vite builds static JavaScript files. This means that frontend variables—most importantly **`VITE_API_URL`**—**MUST be present in Coolify's environment variables BEFORE you click Deploy!**
If you do not configure `VITE_API_URL` first, the frontend will compile with a default fallback and will fail to communicate with the backend API.

---

## Step 1: Create a Coolify Project

1. Log into your Coolify Dashboard.
2. Go to **Projects** → **New Project**.
3. Name it `Nutika EJT` and click **Create**.

---

## Step 2: Add a Docker Compose Resource

1. Inside your new project, click **New Resource** → **Docker Compose**.
2. Select **GitHub** (or Git Repository).
3. Connect your GitHub account and select your `nutika-ejt` repository.
4. Set the **Branch** to `main`.
5. Under **Compose File Path**, specify `./docker-compose.yaml` (or leave as root `/`).
6. Click **Save**.

---

## Step 3: Configure Environment Variables

In your Docker Compose resource settings in Coolify, go to the **Secrets** or **Environment Variables** panel and add the following keys.

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_nYpSgDxQ37Uk@ep-little-dream-apv718f4-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Application Security
JWT_SECRET=generate-a-strong-32-character-random-string-here

# Telegram Notifications (Optional - leaves empty or add values)
TELEGRAM_BOT_TOKEN=8955879700:AAGKkUvze9z4HB0Iz56jeGIMZQtfu0-GAds
TELEGRAM_CHAT_ID=1171786442

# Frontend Build Configurations (MUST BE PRESENT BEFORE BUILD!)
VITE_API_URL=https://api.yourdomain.com      # URL of your backend API
VITE_APP_NAME=Nutika Elektrivõrgu Juhtimiskeskus

# Core Settings
NODE_ENV=production
PORT=5000
LOKI_ENABLED=false
```

---

## Step 4: Configure Domains and Routing

In the Coolify resource configurations:

1. **Frontend Routing**:
   * Map your frontend domain (e.g. `nutika.yourdomain.com` or `http://your-server-ip:80`) to the **`app-frontend`** service.
   * Coolify will automatically provision free SSL certificates via Let's Encrypt for HTTPS.

2. **Backend API Routing**:
   * Map your backend domain (e.g. `api.yourdomain.com` or `http://your-server-ip:5000`) to the **`app-backend`** service.
   * Ensure your `VITE_API_URL` environment variable matches this backend domain.

---

## Step 5: Deploy!

1. Click the **Deploy** button in the top right corner of the Coolify dashboard.
2. Coolify will:
   * Download your repository.
   * Pull Docker base images (`bun:1-alpine`, `nginx:alpine`, `redis:7-alpine`).
   * Compile the React client with your configured `VITE_API_URL`.
   * Start the Redis, Prometheus, and Loki services.
   * Start the backend container, which instantly pushes migrations and seeds your PostgreSQL database.
3. Access your frontend URL once the build succeeds (usually 2–3 minutes).

---

## Default Administrative Credentials

Once deployed and seeded, you can sign in with:
* 👑 **MASTER Administrator**: `admin@nutika.ee` / Password: `admin123`
* 👤 **STANDARD Regular User**: `user@nutika.ee` / Password: `user123`

> [!CAUTION]
> Log in and change these passwords immediately inside the Dashboard to secure your instance!

---

## Monitoring and Logs in Coolify

### 1. Real-Time Logs
* To view logs, go to your Coolify resource → **Logs**. You can filter by service (`app-backend`, `app-frontend`) to see active API requests, database queries, and automation cycles.

### 2. Prometheus Metrics
* Scraped metrics are exported at the `/metrics` endpoint. You can configure dashboards in Grafana to track HTTP latencies, CPU/Memory utilization, and active device switching counts.

### 3. Health Checks
* The backend exposes `/health` which returns `200 OK` status and timestamp. Coolify automatically performs health checks and restarts any degraded container.

---

**Your Smart Power Grid Control Center is now live on Coolify! 🏠⚡**
