# Deployment Notes

## Architecture Overview

Compify MVP uses a monorepo architecture with three independently deployable applications:

1. **Static Site** (`apps/web-static`) - Astro-based marketing site
2. **Backend Server** (`apps/backend`) - Go HTTP server with Templ + HTMX
3. **Game Sandbox** (`apps/sandbox`) - Phaser.js browser games

## Deployment Strategy

### Static Site (Cloudflare Pages)
- Deploy from `apps/web-static/dist` after running `npm run build`
- Automatic builds on Git push
- CDN-first delivery for optimal performance
- Cache headers configured via `public/_headers` file
- Static assets cached for 1 year, HTML for 1 hour

### Backend Server (Free-tier cloud services)
- Build single Go binary: `go build -o compify-backend ./cmd`
- Deploy to Render, Railway, or Leapcell
- Environment variables for configuration
- No Docker required for MVP
- Built-in caching middleware for optimal performance

### Game Sandbox (Static Assets)
- Build from `apps/sandbox` using `npm run build`
- Deploy to CDN alongside static site or separate subdomain
- No server dependencies
- Aggressive caching for game assets

## Caching Strategy

### Backend Server Caching
- **Static Assets**: 1 year cache with immutable flag
- **Health Endpoints**: 1 minute cache
- **API Endpoints**: No caching
- **Dashboard Pages**: 5 minutes private cache
- **Auth Pages**: No caching
- **ETag support** for conditional requests

### CDN Caching (Cloudflare)
- **Static Assets**: 1 year cache with content hashing
- **HTML Pages**: 1 hour browser, 2 hours CDN
- **Game Assets**: 1 year cache with versioning
- **Automatic cache invalidation** on deployment

### Performance Targets
- **Cache Hit Ratio**: >90% for static assets
- **TTFB**: <200ms globally
- **Page Load**: <2s on 3G connections

## Environment Variables

### Backend Server
```
PORT=8080
ENVIRONMENT=production
SESSION_SECRET=your-session-secret
DATABASE_URL=your-database-url (if needed)
STATIC_SITE_URL=https://compify.com
SANDBOX_URL=https://sandbox.compify.com
```

### Static Site (Astro)
```
BACKEND_URL=https://api.compify.com
SANDBOX_URL=https://sandbox.compify.com
```

### Sandbox (Vite)
```
VITE_BACKEND_URL=https://api.compify.com
VITE_STATIC_SITE_URL=https://compify.com
```

## Development Setup

1. Install dependencies: `npm run install:all`
2. Start all services: `npm run dev:all`
3. Access:
   - Static site: http://localhost:4321
   - Backend: http://localhost:8080
   - Sandbox: http://localhost:5173

## Build Process

1. Build all: `npm run build:all`
2. Outputs:
   - Static site: `apps/web-static/dist/`
   - Backend binary: `dist/backend`
   - Sandbox: `apps/sandbox/dist/`

## CDN Configuration

### Cloudflare Pages Settings
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Root Directory**: `apps/web-static` (for static site)
- **Node Version**: 18+
- **Environment Variables**: Set BACKEND_URL and SANDBOX_URL

### Cache Purging
- **Automatic**: On deployment via Git push
- **Manual**: Via Cloudflare dashboard
- **Selective**: By URL pattern or tag
- **Emergency**: Full site purge available

## Monitoring and Performance

### Key Metrics
- Cache hit ratios via Cloudflare Analytics
- Response times via backend logs
- Error rates via application monitoring
- User experience via Real User Monitoring

### Health Checks
- Backend: `/health` endpoint
- Static site: Automated uptime monitoring
- Sandbox: Asset loading verification

## Security Considerations

### Cache Security
- No caching for authentication endpoints
- Private caching for user-specific content
- Secure headers on all responses
- Regular cache purging for security updates

### Content Security Policy
- Strict CSP headers on all HTML responses
- Different policies for development vs production
- No inline scripts in production builds