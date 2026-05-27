# Nutika Elektrivõrgu Juhtimiskeskus (Smart Power Grid Control Center)

**An intelligent energy management dashboard for smart home devices based on real-time Nord Pool electricity prices.**

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Functional Modules](#functional-modules)
- [Technology Stack](#technology-stack)
- [How to Download and Setup (Quick Start)](#how-to-download-and-setup-quick-start)
  - [Step 1: Clone from GitHub](#step-1-clone-from-github)
  - [Step 2: Restoring Backend & Frontend Packages](#step-2-restoring-backend--frontend-packages)
  - [Step 3: Setup Environment Configuration](#step-3-setup-environment-configuration)
  - [Step 4: Sync and Seed Database](#step-4-sync-and-seed-database)
  - [Step 5: Run the Project](#step-5-run-the-project)
- [Project Architecture](#project-architecture)
- [Running Automated Tests](#running-automated-tests)
- [Coolify Deployment](#coolify-deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Nutika EJT** is a complete full-stack web application designed for smart home automation and active energy cost optimization.

The system retrieves real-time 24-hour Nord Pool electricity price forecasts using the public Elering API. Smart home appliances (like water heaters, EV chargers, and heat pumps) are automatically toggled ON or OFF based on user-defined maximum price thresholds. Non-critical devices are paused during high-tariff hours or during vacation mode, generating significant passive energy savings without manual intervention.

---

## Functional Modules

### 1. User Management (User Master) 🆕
* **Multi-User Access**: Secure concurrent system access for multiple users.
* **Role-Based Authorization (RBAC)**:
  * `MASTER` (Administrator): Accesses all devices, system metrics, and logs. Exclusive permission to manage all accounts.
  * `STANDARD` (Regular User): Can only view and control their own registered devices, reports, and settings.
* **Administration Interface (User Master)**: Exclusive to `MASTER` users, allowing them to:
  * View a grid list of all registered accounts.
  * Register new standard or master users.
  * Activate/Deactivate users instantly.
  * Change user role authorization.
  * Permanently delete accounts.
* **Administrative Safeguards**: Strict safety boundaries prevent `MASTER` users from deactivating, demoting, or deleting their own account to avoid system lockout.
* **Access Control**: Modified login endpoints reject deactivated user tokens immediately.

### 2. Device Management
* Full CRUD operations for smart IoT devices.
* Supports 3 connection types:
  * **IP**: Direct local network control (Shelly, Tasmota, etc.) via HTTP relays.
  * **API**: Third-party REST endpoint communication.
  * **MQTT**: Message broker queue topics.
* Connection validation testing before registering a device.
* Real-time status tracking (ONLINE/OFFLINE, ON/OFF).
* Critical device flag: Mark essential devices (e.g. Fridge, Security) to keep them operational during Vacation Mode.
* Manual Override: Instantly take manual control of a device, bypassing automatic price controls.

### 3. Automation Engine
* Evaluates price levels every 60 seconds.
* Matches current Nord Pool price against individual device thresholds.
* Automatically turns devices ON when the price is less than or equal to the threshold, and OFF when it exceeds the threshold.
* Automatically integrates Vacation Mode and Cooldown rules.
* Dispatches real-time Telegram alerts on state changes or price spikes.

### 4. Pricing & Savings Reports
* visualizes the 24-hour Nord Pool forecast using an interactive line chart.
* Stores historical prices in Neon database for tracking and calculations.
* Caches Elering API responses in Memory/Redis for 1 hour to prevent rate limiting.
* **Savings Calculator**: Compares actual automated pricing costs against a standard fixed-rate utility package, calculating savings in Euros and percentages over a 7-day period.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js (or Bun), Express.js 4.x, TypeScript 5.x |
| **Frontend UI** | React 18.x, Vite 5.x, TypeScript, Tailwind CSS 3.x, Recharts |
| **Database** | PostgreSQL (Neon Database) + Prisma ORM |
| **Caching** | Redis 7.x (alpine) |
| **Testing** | Jest, Supertest, Vitest |
| **Logging** | Winston (structured JSON logs) + Loki |
| **Monitoring** | Prometheus metrics (exported at `/metrics`) + Grafana |
| **Deployment** | Docker, Docker Compose, Coolify PaaS |

---

## How to Download and Setup (Quick Start)

Follow these step-by-step instructions to get the application running locally or in production.

### Step 1: Clone from GitHub

First, copy the repository link from GitHub and clone the project to your local machine:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nutika-ejt.git

# Navigate into the project folder
cd nutika-ejt
```

---

### Step 2: Restoring Backend & Frontend Packages

Install the required Node.js package dependencies inside both the backend and frontend directories:

```bash
# 1. Install Backend dependencies
cd backend
npm install

# 2. Install Frontend dependencies
cd ../frontend
npm install
```

---

### Step 3: Setup Environment Configuration

The application requires environment variables for database connectivity, security, and external services.

1. Go back to the root of the project:
   ```bash
   cd ..
   ```
2. Copy the `.env.example` template to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Open the newly created `.env` file and configure the settings:
   * **`DATABASE_URL`**: Fill in your Neon PostgreSQL database connection string.
   * **`JWT_SECRET`**: Set a strong random string (minimum 32 characters) to sign authentication tokens.
   * **`TELEGRAM_BOT_TOKEN`** & **`TELEGRAM_CHAT_ID`**: (Optional) Add your Telegram bot details to receive automated alerts.
   * **`VITE_API_URL`**: Set this to the backend URL (e.g. `http://localhost:5000` for local development).

---

### Step 4: Sync and Seed Database

Push your database models to Neon PostgreSQL and seed initial demo accounts/devices:

```bash
# Navigate to backend directory
cd backend

# 1. Generate local Prisma client
npx prisma generate

# 2. Sync database schema to Neon PostgreSQL
# (Note: On Windows, ensure you run this with DATABASE_URL loaded)
npx prisma db push

# 3. Seed database with default admin/user accounts
npm run seed
```

After seeding, the database is pre-populated with:
* 👑 **MASTER Administrator**: `admin@nutika.ee` / Password: `admin123`
* 👤 **STANDARD Regular User**: `user@nutika.ee` / Password: `user123`
* ⚡ **3 Demo Devices** (Water Heater, Heat Pump, EV Charger)

---

### Step 5: Run the Project

#### Option A: Running with Docker Compose (Recommended)
This starts the backend, frontend, Redis, Prometheus, Grafana, and Loki in orchestrated containers:

```bash
# Navigate to the root directory
cd ..

# Start all Docker services
docker-compose up -d --build

# The application is now running!
# Frontend (UI): http://localhost:80
# Backend (API): http://localhost:5000
# Grafana: http://localhost:3000
```

#### Option B: Running Locally for Development
If you prefer to run the application components manually:

```bash
# 1. In one terminal, start the Backend API:
cd backend
npm run dev

# 2. In another terminal, start the Frontend React app:
cd frontend
npm run dev
```

---

## Running Automated Tests

A comprehensive unit and integration test suite is implemented for maximum stability:

```bash
# Navigate to backend directory
cd backend

# Run the test suite using Jest
npm test
```

The test runner will execute:
1. **Savings Calculator Tests**: Validates historical price math, active hours logic, and savings calculation.
2. **Nord Pool Fetcher Tests**: Validates Elering API integration, response caching, and offline cached fallbacks.
3. **User Management API Tests**: Validates account CRUD, role security middleware, user deactivation, and self-modification protections.

---

## Coolify Deployment

Nutika EJT is designed for automated containerized hosting on **Coolify**:

1. Create a **New Project** in Coolify.
2. Add a **Docker Compose** resource and link your GitHub repository.
3. Configure all secrets (like `DATABASE_URL`, `JWT_SECRET`, and `VITE_API_URL`) in Coolify's Secrets panel.
4. Click **Deploy**. Coolify automatically pulls the repo, builds the production containers, migrates the PostgreSQL database, seeds default users, and serves the app with HTTPS.
5. Refer to [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) for a detailed 13-step setup guide.

---

## API Reference

### Authentication
* `POST /api/auth/register` - Register a new user.
* `POST /api/auth/login` - Authenticate account and return a 24-hour JWT token.

### User Administration (Master Only)
* `GET /api/users` - Retrieve all accounts (excluding passwords).
* `POST /api/users` - Create a new user (role MASTER or STANDARD).
* `PATCH /api/users/:id` - Update user details, change role, or toggle active status.
* `DELETE /api/users/:id` - Delete a user.

### Devices
* `GET /api/devices` - Fetch accessible devices (Master sees all, Standard sees own).
* `POST /api/devices` - Register a new device.
* `POST /api/devices/test-connection` - Validate device connectivity parameters.
* `PATCH /api/devices/:id` - Update status, thresholds, or override settings.
* `DELETE /api/devices/:id` - Remove a device.

### Pricing & System Metrics
* `GET /api/prices` - Fetch 24-hour Nord Pool price timeline.
* `GET /api/savings` - Get calculated savings over the last 7 days.
* `GET /health` - Service health-check.
* `GET /metrics` - Prometheus scrapable metrics.

---

## Troubleshooting

### "Database migration or connection failed"
* Double-check your `DATABASE_URL` in the `.env` file.
* Neon PostgreSQL connection requires `sslmode=require` query parameter at the end of the URL.
* Verify your local machine or server is not blocked by a database firewall.

### "CORS / API Refused connection"
* Ensure your `VITE_API_URL` variable matches the exact IP/domain of the running backend server.
* If using custom domains in production, verify your DNS records and SSL status.

---

**Happy controlling! 🚀**
