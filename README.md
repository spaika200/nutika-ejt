# Nutika Elektrivõrgu Juhtimiskeskus (Smart Power Grid Control Center)

This repository contains the complete full-stack implementation of the Smart Power Grid Control Center.

## Infrastructure & Setup

The application is built to be run inside Docker and deployed to a Coolify instance.

### Tech Stack
*   **Backend:** Node.js (Express) + TypeScript + Prisma ORM
*   **Frontend:** React (Vite) + Tailwind CSS
*   **Database:** PostgreSQL
*   **Caching & Messaging:** Redis
*   **Monitoring:** Prometheus, Grafana, and Loki

### Local Development Setup

To run the application locally, you will need Docker and Docker Compose installed.

1.  **Clone the repository.**
2.  **Start the infrastructure:**
    ```bash
    docker-compose up -d
    ```
    This will start the Postgres database, Redis, Prometheus, Grafana, Loki, and both the backend and frontend containers.
3.  **Database Migration (Inside the backend container):**
    ```bash
    docker-compose exec app-backend npx prisma migrate dev --name init
    ```
4.  **Access the applications:**
    *   Frontend UI: `http://localhost:80`
    *   Backend API: `http://localhost:5000`
    *   Grafana Dashboards: `http://localhost:3000` (Default login: `admin` / `admin`)

## Project Modules Implementation

### 1. User Management
The backend implements JWT-based authentication with bcrypt password hashing. The `Role` enum in the Prisma schema differentiates between `MASTER` (admin) and `STANDARD` users.

### 2. Device Management
Devices are stored in the Postgres database and associated with users. The schema supports different connection types (`IP`, `API`, `MQTT`). A mock service simulates connection testing and ON/OFF toggling, logging every action to the `DeviceLog` table.

### 3. Control Center & Elering API
The backend periodically fetches the 24-hour Nord Pool exchange prices from the public Elering API.
A background worker (simulated in `cron` or `setInterval`) evaluates the active devices. If the current Nord Pool price exceeds a device's `thresholdPrice`, and the device does not have `manualOverride` set, the system automatically sends an `OFF` command. When prices drop, it sends an `ON` command.

### 4. Client Value-Add Features
*   **Savings Report:** Calculates hypothetical savings by comparing the device's actual active time (during cheap hours) against a fixed electricity rate.
*   **Future Forecast:** The frontend visualizes the next 24 hours of prices and highlights when automated devices are scheduled to toggle off.
*   **Holiday Mode:** A single global flag that temporarily forces all `isCritical: false` devices to OFF.

### 5. Monitoring & Reliability
*   The backend exports metrics using `prom-client` on `/metrics`, which are scraped by Prometheus.
*   Logs are formatted as structured JSON using `winston` and sent to Loki.
*   Strict validation is performed on all API endpoints.

## Deployment to Coolify
1. Create a new project in Coolify.
2. Select "Docker Compose" deployment.
3. Connect your GitHub repository using a GitHub App integration.
4. Coolify will read the `docker-compose.yml` file and provision the containers.
5. Set your environment variables (`JWT_SECRET`, database passwords) in the Coolify Secrets panel, overriding the defaults in the compose file.
