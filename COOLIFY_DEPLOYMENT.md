# Coolify Deployment Guide - Nutika EJT

## Overview

This guide explains how to deploy the Nutika Elektrivõrgu Juhtimiskeskus (Smart Power Grid Control Center) application to **Coolify**, a modern self-hosted alternative to Heroku.

---

## Prerequisites

1. **Coolify Instance**: Self-hosted Coolify server (deployed on your VPS/server)
2. **GitHub Repository**: Your fork/clone of the Nutika EJT project
3. **GitHub Personal Access Token** (for private repos)
4. **Neon PostgreSQL Database**: Already configured (provided by user)
5. **Telegram Bot Token**: Already obtained (provided by user)

---

## Step 1: Set Up Your Coolify Instance

### 1.1 Install Coolify on Your Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Coolify (one-liner)
curl -fsSL https://get.coollabs.io/coolify/install.sh | bash

# Follow the installation wizard
# Access Coolify dashboard at: https://your-server-ip:3000
```

### 1.2 Initial Setup

1. Go to `https://your-server-ip:3000`
2. Create admin account
3. Set up SSH key for connecting to your server
4. Configure Docker settings if needed

---

## Step 2: Create a Coolify Project

### 2.1 Create New Project

1. In Coolify dashboard, click **Projects** → **New Project**
2. Name: `Nutika EJT` (or your preferred name)
3. Click **Create**

### 2.2 Add Docker Compose Resource

1. In your project, click **New Resource** → **Docker Compose**
2. Choose **Git**
3. Fill in:
   - **Repository URL**: `https://github.com/YOUR_USERNAME/nutika-ejt.git`
   - **Branch**: `main`
   - **Dockerfile Location**: `./docker-compose.yaml`
   - **Compose File Path**: `.` (root directory)

---

## Step 3: Configure Environment Variables in Coolify

### 3.1 Add Secrets (Environment Variables)

In the Docker Compose resource settings, go to **Secrets** and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_nYpSgDxQ37Uk@ep-little-dream-apv718f4-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

REDIS_URL=redis://redis:6379

JWT_SECRET=your-very-long-random-secret-key-min-32-chars-change-this-in-production

TELEGRAM_BOT_TOKEN=8955879700:AAGKkUvze9z4HB0Iz56jeGIMZQtfu0-GAds

TELEGRAM_CHAT_ID=1171786442

NODE_ENV=production

PORT=5000

LOG_LEVEL=info

LOKI_ENABLED=false

VITE_API_URL=https://your-domain.com  # or http://your-server-ip:5000

VITE_APP_NAME=Nutika Elektrivõrgu Juhtimiskeskus
```

**IMPORTANT**: 
- Change `JWT_SECRET` to a strong random string
- Set `VITE_API_URL` to your actual domain/IP
- Keep all other values as shown

### 3.2 Persist Secrets Securely

1. **DO NOT commit secrets to git** - Coolify keeps them secure
2. Use Coolify's Secrets panel exclusively
3. Never expose secrets in docker-compose.yaml file in git

---

## Step 4: Set Up Custom Domains

### 4.1 Configure Domain/Subdomain

If you have a domain:

1. In Coolify, go to your resource → **Domains**
2. Add your domain (e.g., `nutika.yourdomain.com`)
3. **Generate SSL Certificate** (automatic via Let's Encrypt)
4. Update DNS records to point to your server

If using IP address:
- Use `http://your-server-ip:80` for frontend
- Use `http://your-server-ip:5000` for backend API

### 4.2 Update Frontend Environment Variables

If using custom domain, update the `VITE_API_URL` secret:
```
VITE_API_URL=https://api.yourdomain.com  # or https://your-server-ip:5000
```

---

## Step 5: Configure Port Mappings

In Coolify Docker Compose settings, ensure ports are correctly exposed:

```yaml
# Frontend (Nginx): Port 80 → 80
# Backend (Node): Port 5000 → 5000
```

Coolify will automatically handle reverse proxy and load balancing.

---

## Step 6: Database Initialization

### 6.1 Run Database Migrations

After first deployment, run Prisma migrations:

1. SSH into your server
2. Connect to the running backend container:
   ```bash
   docker-compose exec app-backend bunx prisma db push --accept-data-loss
   ```

3. Seed the database (optional):
   ```bash
   docker-compose exec app-backend bun run dist/seed.js
   ```

### 6.2 Create Initial Users

Default seeded users:
- **Master**: `admin@nutika.ee` / `admin123`
- **Standard**: `user@nutika.ee` / `user123`

Change these passwords after first login!

---

## Step 7: Enable GitHub Webhooks (Auto-Deploy)

### 7.1 Setup GitHub Integration

1. In Coolify, go to **Settings** → **GitHub Integration**
2. Click **Connect GitHub**
3. Authorize Coolify app
4. Select your `nutika-ejt` repository

### 7.2 Enable Auto-Deployment

1. In your Docker Compose resource → **Deployment**
2. Enable **Automatic Deployments**
3. Choose trigger: `On Push to Main Branch`

Now every time you push to `main`, Coolify auto-deploys!

---

## Step 8: Monitoring & Logs

### 8.1 Access Application Logs

1. In Coolify resource → **Logs**
2. View real-time logs from both frontend and backend
3. Check for errors or warnings

### 8.2 Monitor Resource Usage

- CPU, Memory, Disk usage monitoring
- Available in **Resource Metrics**
- Set up alerts if needed

### 8.3 View Database Logs

- Neon PostgreSQL provides web dashboard
- Access at: https://console.neon.tech
- Monitor query performance and connections

---

## Step 9: Backing Up Data

### 9.1 PostgreSQL Backups

Neon PostgreSQL automatically backups:
- Set retention policy in Neon console
- Download backups if needed

### 9.2 Redis Persistence

Redis data is persisted to volume:
```bash
# In Coolify, volumes are automatically managed
# Data persists across restarts
```

### 9.3 Manual Backup

```bash
# Backup PostgreSQL from Neon console
# Or export via pg_dump to local file
pg_dump postgresql://... > backup.sql
```

---

## Step 10: Troubleshooting

### 10.1 Common Issues

**Issue**: Backend container keeps restarting
- Check logs: `docker-compose logs app-backend`
- Verify DATABASE_URL is correct
- Ensure Neon database is online

**Issue**: Cannot connect to database
- Verify DATABASE_URL secret is set
- Test connection with psql
- Check firewall rules on Neon

**Issue**: Frontend shows "API connection failed"
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running: `curl http://localhost:5000/health`

**Issue**: Telegram notifications not working
- Verify TELEGRAM_BOT_TOKEN is correct
- Verify TELEGRAM_CHAT_ID is set (numeric ID)
- Check bot has permission to send messages

### 10.2 Useful Debug Commands

```bash
# SSH into server
ssh user@your-server-ip

# Check running containers
docker-compose ps

# View backend logs
docker-compose logs -f app-backend

# View frontend logs
docker-compose logs -f app-frontend

# Connect to database
docker-compose exec app-backend psql $DATABASE_URL

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app-backend
```

---

## Step 11: Production Best Practices

### 11.1 Security

✅ **Must Do:**
- [ ] Change default JWT_SECRET to strong random value
- [ ] Change default seed user passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Enable authentication on Telegram bot
- [ ] Keep dependencies updated

❌ **Never Do:**
- [ ] Commit secrets to git
- [ ] Use default passwords in production
- [ ] Expose admin endpoints publicly
- [ ] Share API tokens or keys

### 11.2 Performance

- Enable Redis caching (already configured)
- Monitor database query performance
- Set up CDN for static assets if needed
- Use Prometheus for metrics monitoring

### 11.3 Monitoring

- Set up email/Slack alerts for failures
- Monitor application health at `/health`
- Check Prometheus metrics at `/metrics`
- Review logs regularly for errors

---

## Step 12: Updating Your Application

### 12.1 Pull Request Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make changes and commit

3. Push and create pull request

4. GitHub Actions CI/CD runs tests

5. After approval, merge to `main`

6. Coolify auto-deploys within 2-5 minutes

### 12.2 Manual Deployment

If auto-deployment is disabled:

1. In Coolify → Your Resource → **Deploy**
2. Click **Deploy** button
3. Monitor deployment progress in logs

---

## Step 13: Scaling Considerations

### 13.1 Multiple Instances

For high availability:
- Deploy multiple backend instances behind load balancer
- Use single PostgreSQL database (handles connections)
- Redis cache shared between instances

### 13.2 Database Scaling

- Neon PostgreSQL: Upgrade plan as needed
- Monitor connection count and query performance
- Consider read replicas for reporting

---

## Useful Links & Resources

- **Coolify Documentation**: https://coolify.io/docs
- **Neon PostgreSQL**: https://neon.tech
- **Docker Compose Reference**: https://docs.docker.com/compose/compose-file/
- **Prisma ORM**: https://www.prisma.io/docs/
- **Elering API**: https://dashboard.elering.ee/api

---

## Support & Troubleshooting

### Getting Help

1. **Check logs**: Always start with application logs
2. **Verify environment variables**: Double-check all secrets
3. **Test connectivity**: Verify database and API connectivity
4. **Review GitHub Actions**: Check CI/CD pipeline status

### Contact

For issues or questions:
- GitHub Issues: https://github.com/YOUR_USERNAME/nutika-ejt/issues
- Coolify Community: https://github.com/coollabsio/coolify

---

## Next Steps After Deployment

1. ✅ Create initial users with strong passwords
2. ✅ Add your IoT devices through dashboard
3. ✅ Configure price thresholds for automation
4. ✅ Test Telegram notifications
5. ✅ Monitor application for 24 hours
6. ✅ Set up regular backups
7. ✅ Review security settings monthly

---

**Deployment Complete!** 🎉

Your Nutika EJT application is now running on Coolify. Monitor it regularly and keep dependencies updated.
