# Nutika Elektrivõrgu Juhtimiskeskus (Smart Power Grid Control Center)

**Intelligent management system for smart home devices based on real-time Nord Pool electricity prices.**

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0-blue)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

Nutika EJT is a full-stack web application that automates control of smart home devices based on electricity prices. When Nord Pool prices drop below configured thresholds, devices automatically turn ON. When prices exceed thresholds, devices turn OFF. This maximizes savings on electricity costs.

### Key Features

✅ **Real-time Price Monitoring** - Fetches 24-hour Nord Pool prices from Elering API  
✅ **Automated Device Control** - Turn devices ON/OFF based on price thresholds  
✅ **Manual Override** - Disable automation for specific devices  
✅ **Holiday Mode** - Force all non-critical devices OFF  
✅ **Savings Calculator** - Compare automated vs fixed-rate costs  
✅ **Multiple Device Types** - IP, API, MQTT device support  
✅ **Role-Based Access** - Master/Standard user permissions  
✅ **Telegram Notifications** - Get alerts on device automation  
✅ **Historical Tracking** - Log all device commands for auditing  
✅ **Production Ready** - Prometheus metrics, structured logging, health checks  

---

## Features

### 1. User Management ✅
- JWT-based authentication with 24-hour token expiry
- Bcrypt password hashing (10 rounds)
- Role-Based Access Control (RBAC):
  - **MASTER**: View/manage all devices and users
  - **STANDARD**: View/manage only own devices
- User registration and login endpoints

### 2. Device Management ✅
- Create, read, update, delete IoT devices
- Support for 3 connection types:
  - **IP**: Direct HTTP API to device (Shelly, Tasmota, etc.)
  - **API**: Third-party REST endpoints
  - **MQTT**: Message broker based devices
- Connection testing before adding device
- Device status tracking (ON/OFF)
- Manual override toggle (disables automation)
- Critical device flag (stays on in Holiday Mode)
- Command logging (ON/OFF/STATUS_CHECK)

### 3. Automation Engine ✅
- Runs every 60 seconds
- Fetches current Nord Pool price
- Evaluates all devices with thresholds
- Automatically toggles devices based on:
  - Current price vs threshold
  - Manual override status
  - Holiday mode status
- Sends Telegram notifications on state changes
- Graceful error handling

### 4. Pricing & Forecasting ✅
- Real-time price fetching from Elering API
- 24-hour forecast visualization
- 1-hour caching to reduce API calls
- Graceful fallback to cached prices
- Historical price storage in database

### 5. Savings Report ✅
- Calculates actual savings using historical prices
- Compares automated cost vs fixed-rate packages
- Shows EUR savings and percentage
- Daily/Weekly/Monthly statistics
- Aggregates across all user devices

### 6. Monitoring & Logging ✅
- Prometheus metrics export (`/metrics`)
- Winston structured JSON logging
- Loki log aggregation support
- Health check endpoint (`/health`)
- Request latency tracking

### 7. Frontend Dashboard ✅
- Real-time price chart visualization
- Device status display with manual controls
- Savings statistics display
- Holiday Mode toggle
- Device manager modal (add/edit/delete)
- Responsive design (Tailwind CSS)
- Dark mode theme

---

## Tech Stack

### Backend
- **Runtime**: Bun.js (can use Node.js)
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL (Neon)
- **Cache**: Redis 7.x
- **Auth**: JWT + bcrypt
- **Logging**: Winston + Loki
- **Metrics**: Prometheus client
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.x
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Databases**: PostgreSQL 15 (Neon), Redis 7
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus, Grafana, Loki
- **Deployment**: Coolify (or any Docker-compatible platform)

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (for local development without Docker)

### Local Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/nutika-ejt.git
cd nutika-ejt

# Copy environment template
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET, database URL, telegram token)

# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec app-backend bunx prisma db push --accept-data-loss

# Seed database with demo users and devices
docker-compose exec app-backend bun run dist/seed.js

# View logs
docker-compose logs -f

# Access applications
# Frontend: http://localhost:80
# Backend API: http://localhost:5000
# Grafana: http://localhost:3000 (admin/admin)
```

### Demo Credentials

After seeding:
- **Master User**: `admin@nutika.ee` / `admin123`
- **Standard User**: `user@nutika.ee` / `user123`

⚠️ **Change these passwords in production!**

---

## Project Structure

```
nutika-ejt/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions CI/CD pipeline
│
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express server setup
│   │   ├── seed.ts                   # Database seeding
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts               # Login/Register endpoints
│   │   │   ├── devices.ts            # Device CRUD + Holiday Mode
│   │   │   └── savings.ts            # Savings calculation endpoint
│   │   ├── services/
│   │   │   ├── automation.ts         # Automation cycle (60s)
│   │   │   ├── deviceConnection.ts   # Device control logic
│   │   │   ├── nordpool.ts           # Elering API integration
│   │   │   ├── savings.ts            # Savings calculator
│   │   │   ├── notifications.ts      # Telegram integration
│   │   │   └── globalState.ts        # Holiday mode state
│   │   ├── utils/
│   │   │   └── logger.ts             # Winston logging
│   │   └── __tests__/
│   │       ├── nordpool.test.ts
│   │       └── savings.test.ts
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Router setup
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   └── Login.tsx             # Auth page
│   │   ├── components/
│   │   │   └── DeviceManager.tsx     # Device management modal
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── index.html
│
├── monitoring/
│   ├── Dockerfile
│   └── prometheus.yml                # Prometheus config
│
├── docker-compose.yaml               # Full stack orchestration
├── .env.example                      # Environment template
├── .env                              # Local environment (DO NOT COMMIT)
├── .gitignore
├── README.md                         # This file
├── COOLIFY_DEPLOYMENT.md             # Deployment guide
└── task.md                           # Project tasks/requirements
```

---

## Deployment

### Quick Deployment to Coolify

See [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md) for comprehensive deployment guide.

**TL;DR:**

1. Create Coolify project and add Docker Compose resource
2. Connect GitHub repository
3. Add environment variables (secrets) in Coolify:
   - `DATABASE_URL` (Neon PostgreSQL)
   - `JWT_SECRET` (generate random 32+ char string)
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `VITE_API_URL` (your domain or IP)
4. Deploy and run database migrations
5. Access application at configured domain

---

## Configuration

### Environment Variables

See `.env.example` for all available options. Key variables:

```env
# Database
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection

# Application
NODE_ENV=production
JWT_SECRET=your-secret-key             # Generate 32+ random chars
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000    # Backend API URL
VITE_APP_NAME=Nutika EJT

# Telegram (optional)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Logging
LOG_LEVEL=info
LOKI_ENABLED=false                     # Set true if using Loki
```

### Database Schema

**User**
- id, email (unique), password (hashed), role (MASTER/STANDARD), createdAt, updatedAt

**Device**
- id, name, description, connectionType, connectionParams (JSON), status (boolean)
- thresholdPrice (nullable), isCritical, manualOverride, userId (FK), createdAt, updatedAt

**DeviceLog**
- id, command (ON/OFF/STATUS_CHECK), deviceId (FK), timestamp

**HistoricalPrice**
- id, timestamp, priceEur (EUR/MWh), region (ee), fetchedAt

---

## API Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login, returns JWT token

### Devices
- `GET /api/devices` - List user's devices (paginated)
- `POST /api/devices` - Create device
- `PATCH /api/devices/:id` - Update device (status, threshold, override)
- `DELETE /api/devices/:id` - Delete device
- `POST /api/devices/test-connection` - Test device connection
- `GET /api/devices/holiday` - Get holiday mode status
- `POST /api/devices/holiday` - Toggle holiday mode

### Pricing & Savings
- `GET /api/prices` - Get 24-hour price forecast
- `GET /api/savings` - Calculate savings (last 7 days default)

### Monitoring
- `GET /metrics` - Prometheus metrics
- `GET /health` - Health check

---

## Testing

### Run Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests  
cd frontend
npm run test

# CI/CD pipeline (GitHub Actions)
# Automatically runs on push/PR to main branch
```

### Test Coverage

- Backend: Unit tests for NordPool API, Savings calculator
- Frontend: Component tests (Vitest)
- Integration: API endpoint tests

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution:**
- Verify DATABASE_URL is correct
- Test connection: `psql $DATABASE_URL`
- Ensure Neon database is online

### Frontend Cannot Reach Backend

```
CORS error or connection refused
```

**Solution:**
- Check VITE_API_URL matches backend URL
- Verify backend is running
- Check firewall/port mappings
- Test: `curl http://localhost:5000/health`

### Telegram Notifications Not Sending

**Solution:**
- Verify TELEGRAM_BOT_TOKEN is correct
- Check TELEGRAM_CHAT_ID is numeric ID (not username)
- Verify bot has permission to send messages
- Check logs for errors

### Docker Build Fails

**Solution:**
- Clear Docker cache: `docker-compose down -v`
- Rebuild: `docker-compose up -d --build`
- Check disk space: `docker system df`

---

## Production Checklist

Before deploying to production:

- [ ] Change default JWT_SECRET
- [ ] Change seed user passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure Telegram bot token
- [ ] Test database backups
- [ ] Enable monitoring/alerts
- [ ] Review security settings
- [ ] Set up log retention
- [ ] Document admin procedures

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and commit
4. Push and create Pull Request
5. GitHub Actions will run tests automatically

---

## License

MIT License - see LICENSE file for details

---

## Support

- **Issues**: https://github.com/YOUR_USERNAME/nutika-ejt/issues
- **Discussions**: https://github.com/YOUR_USERNAME/nutika-ejt/discussions
- **Wiki**: https://github.com/YOUR_USERNAME/nutika-ejt/wiki

---

## Changelog

### v1.0.0 (Production Ready)
- ✅ Complete authentication system
- ✅ Device management with multiple connection types
- ✅ Real-time price monitoring
- ✅ Automated device control
- ✅ Savings calculator with historical data
- ✅ Holiday mode
- ✅ Telegram notifications
- ✅ Production-ready monitoring
- ✅ Coolify deployment ready
- ✅ GitHub Actions CI/CD

---

## Roadmap

- [ ] WebSocket real-time updates
- [ ] Mobile app (React Native)
- [ ] Advanced scheduling (per-device)
- [ ] SMS/Email notifications
- [ ] Machine learning price prediction
- [ ] Multi-region support
- [ ] REST API documentation (OpenAPI/Swagger)
- [ ] Admin user management panel

---

**Happy controlling! 🚀**
