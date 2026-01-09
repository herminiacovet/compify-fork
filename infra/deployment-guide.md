# Compify MVP Deployment Guide

This guide provides step-by-step instructions for deploying the Compify MVP to production environments.

## Overview

The Compify MVP consists of three independently deployable applications:

1. **Static Site** - Astro-based marketing site (Cloudflare Pages)
2. **Backend Server** - Go HTTP server (Render/Leapcell)
3. **Game Sandbox** - Phaser.js games (CDN/Static hosting)

## Prerequisites

- Node.js 18+ and npm
- Go 1.21+
- Git repository with your code
- Accounts on deployment platforms:
  - Cloudflare (for static site and CDN)
  - Render.com or Leapcell (for backend)

## Quick Start

1. **Prepare deployment artifacts:**
   ```bash
   npm run deploy:prep
   ```

2. **Follow platform-specific instructions below**

## Platform-Specific Deployment

### 1. Static Site - Cloudflare Pages

#### Setup Steps:

1. **Connect Repository:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → "Connect to Git"
   - Select your repository

2. **Configure Build Settings:**
   - **Framework preset:** None
   - **Build command:** `npm run build:static`
   - **Build output directory:** `apps/web-static/dist`
   - **Root directory:** Leave empty (monorepo setup)

3. **Environment Variables:**
   ```
   NODE_VERSION=18
   NPM_VERSION=9
   BACKEND_URL=https://your-backend-url.com
   SANDBOX_URL=https://your-sandbox-url.com
   SITE_URL=https://your-domain.com
   ```

4. **Custom Domain (Optional):**
   - Go to your project → Custom domains
   - Add your domain and configure DNS

#### Configuration Files:
- Use `infra/cloudflare-pages.toml` for advanced configuration
- Copy to repository root if needed

### 2. Backend Server - Render.com

#### Setup Steps:

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your Git repository

2. **Configure Service:**
   - **Name:** `compify-backend`
   - **Environment:** `Go`
   - **Build Command:** `cd apps/backend && go build -o ../../dist/compify-backend ./cmd`
   - **Start Command:** `./dist/compify-backend`
   - **Plan:** Free

3. **Environment Variables:**
   ```
   PORT=10000
   ENVIRONMENT=production
   SESSION_SECRET=your-secure-session-secret
   CORS_ORIGINS=https://your-domain.com,https://your-sandbox-domain.com
   STATIC_SITE_URL=https://your-domain.com
   SANDBOX_URL=https://your-sandbox-domain.com
   SECURE_COOKIES=true
   CSRF_SECRET=your-csrf-secret
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW=60
   LOG_LEVEL=info
   LOG_FORMAT=json
   CACHE_TTL_SECONDS=300
   STATIC_CACHE_TTL_SECONDS=31536000
   HEALTH_CHECK_TIMEOUT=5s
   ```

4. **Health Check:**
   - Path: `/health`
   - Enabled by default

#### Alternative: Leapcell

1. **Create Application:**
   - Use `infra/leapcell-deploy.json` configuration
   - Deploy via CLI or dashboard

2. **Configure Secrets:**
   - Set `SESSION_SECRET` and `CSRF_SECRET` in secrets manager

### 3. Game Sandbox - CDN Deployment

#### Option A: Cloudflare Pages (Recommended)

1. **Create Separate Project:**
   - Follow same steps as static site
   - **Build command:** `cd apps/sandbox && npm run build`
   - **Build output directory:** `apps/sandbox/dist`

2. **Environment Variables:**
   ```
   NODE_VERSION=18
   NPM_VERSION=9
   VITE_BACKEND_URL=https://your-backend-url.com
   VITE_STATIC_SITE_URL=https://your-domain.com
   VITE_ENVIRONMENT=production
   ```

#### Option B: Any Static Hosting

1. **Build locally:**
   ```bash
   cd apps/sandbox
   npm run build
   ```

2. **Upload `dist/` folder to your CDN/hosting service**

3. **Configure cache headers** (use `infra/sandbox-cdn.toml` as reference)

## Environment Configuration

### Production Environment Variables

Copy `infra/production.env.template` to `.env.production` and fill in values:

```bash
# Backend Server
PORT=8080
ENVIRONMENT=production
SESSION_SECRET=generate-secure-random-string
CORS_ORIGINS=https://yourdomain.com,https://sandbox.yourdomain.com
STATIC_SITE_URL=https://yourdomain.com
SANDBOX_URL=https://sandbox.yourdomain.com

# Security
SECURE_COOKIES=true
CSRF_SECRET=generate-another-secure-random-string
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Caching
CACHE_TTL_SECONDS=300
STATIC_CACHE_TTL_SECONDS=31536000
HEALTH_CHECK_TIMEOUT=5s
```

### Generating Secrets

Use a secure random generator for secrets:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Go
go run -c "package main; import \"crypto/rand\"; import \"encoding/base64\"; import \"fmt\"; func main() { b := make([]byte, 32); rand.Read(b); fmt.Println(base64.StdEncoding.EncodeToString(b)) }"
```

## DNS Configuration

### Recommended Setup:

- **Main site:** `yourdomain.com` → Cloudflare Pages (static site)
- **API:** `api.yourdomain.com` → Render/Leapcell (backend)
- **Sandbox:** `sandbox.yourdomain.com` → Cloudflare Pages (games)

### DNS Records:

```
yourdomain.com          CNAME   your-pages-project.pages.dev
api.yourdomain.com      CNAME   your-backend.onrender.com
sandbox.yourdomain.com  CNAME   your-sandbox-project.pages.dev
```

## Monitoring and Maintenance

### Health Checks

- **Backend:** `https://api.yourdomain.com/health`
- **Static Site:** Automatic via Cloudflare
- **Sandbox:** Asset loading verification

### Performance Monitoring

1. **Cloudflare Analytics** for static sites
2. **Render/Leapcell dashboards** for backend metrics
3. **Real User Monitoring** via browser tools

### Log Monitoring

- Backend logs available in deployment platform dashboards
- Configure log aggregation if needed
- Set up alerts for error rates and response times

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check Node.js/Go versions match requirements
   - Verify all dependencies are installed
   - Check build commands are correct

2. **CORS Errors:**
   - Verify `CORS_ORIGINS` environment variable
   - Check domain configuration
   - Ensure HTTPS is used in production

3. **Session Issues:**
   - Verify `SESSION_SECRET` is set
   - Check `SECURE_COOKIES` setting
   - Ensure domains match between frontend and backend

4. **Cache Issues:**
   - Clear Cloudflare cache if needed
   - Check cache headers configuration
   - Verify asset versioning is working

### Getting Help:

1. Check deployment platform logs
2. Verify environment variables are set correctly
3. Test each component independently
4. Check network connectivity between components

## Security Checklist

- [ ] All secrets are generated securely and stored safely
- [ ] HTTPS is enabled on all domains
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] No sensitive data in client-side code
- [ ] Environment variables are not committed to Git

## Cost Optimization

### Free Tier Limits:

- **Cloudflare Pages:** 500 builds/month, unlimited bandwidth
- **Render.com:** 750 hours/month, 512MB RAM
- **Leapcell:** Check current free tier limits

### Optimization Tips:

1. Use aggressive caching for static assets
2. Optimize images and assets
3. Monitor usage to stay within free tiers
4. Consider CDN for global performance

## Backup and Recovery

### Important Data:

- Environment variables and secrets
- Custom domain configurations
- Deployment configurations

### Backup Strategy:

1. Keep deployment configurations in Git
2. Document environment variables securely
3. Regular testing of deployment process
4. Monitor for service availability

## Updates and Maintenance

### Deployment Process:

1. **Development:** Test changes locally
2. **Staging:** Deploy to preview environments
3. **Production:** Deploy using established process
4. **Monitoring:** Watch for issues post-deployment

### Rollback Strategy:

- Git-based deployments allow easy rollbacks
- Keep previous deployment artifacts
- Test rollback process regularly

---

For additional help or questions, refer to the platform-specific documentation:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Render.com Docs](https://render.com/docs)
- [Leapcell Docs](https://docs.leapcell.io/)