# Compify MVP Routing Configuration

This document defines the routing strategy and configuration for the Compify MVP, ensuring seamless navigation between applications while maintaining architectural boundaries.

## Routing Strategy

### Single Domain Approach (Recommended)
Use Cloudflare Pages as the primary domain with proxying to backend services:

```
compify.pages.dev/
├── /                          # Static site (Astro)
├── /about/                    # Static site
├── /rules/                    # Static site  
├── /timeline/                 # Static site
├── /sponsors/                 # Static site
├── /faq/                      # Static site
├── /sandbox/                  # Game sandbox (static files)
├── /auth/*                    # Proxied to backend server
├── /api/*                     # Proxied to backend server
└── /design-system/*           # Shared CSS assets
```

### Multi-Domain Approach (Alternative)
Use separate domains for each service:

```
compify.pages.dev/             # Static marketing site
compify-app.pages.dev/         # Game sandbox
compify-api.onrender.com/      # Backend server
```

## Cloudflare Pages Configuration

### Primary Configuration (_redirects)
Create `apps/web-static/public/_redirects`:

```
# API and Auth routes - proxy to backend
/auth/*  https://compify-api.onrender.com/auth/:splat  200
/api/*   https://compify-api.onrender.com/api/:splat   200

# Design system assets - serve from static files
/design-system/*  /shared/design-system/:splat  200

# Sandbox fallback - serve from static files
/sandbox/*  /sandbox/:splat  200

# SPA fallback for any unmatched routes
/*  /index.html  404
```

### Headers Configuration (_headers)
Create `apps/web-static/public/_headers`:

```
# Security headers for all pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Cache headers for static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache headers for design system
/design-system/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

# Cache headers for sandbox assets
/sandbox/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Short cache for HTML files
/*.html
  Cache-Control: public, max-age=3600, s-maxage=7200

# API proxy headers
/auth/*
  X-Robots-Tag: noindex
  
/api/*
  X-Robots-Tag: noindex
```

## Backend Server Routing

### Go Server Routes
```go
// Static file serving for design system
http.Handle("/design-system/", http.StripPrefix("/design-system/", 
    http.FileServer(http.Dir("./shared/design-system/"))))

// Authentication routes
http.HandleFunc("/auth/login", handleLogin)
http.HandleFunc("/auth/register", handleRegister)
http.HandleFunc("/auth/logout", handleLogout)
http.HandleFunc("/auth/dashboard", handleDashboard)

// API routes
http.HandleFunc("/api/user/profile", handleUserProfile)
http.HandleFunc("/api/announcements", handleAnnouncements)
http.HandleFunc("/api/health", handleHealth)

// Health check
http.HandleFunc("/health", handleHealthCheck)
```

### CORS Configuration
```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Allow requests from static site domain
        origin := r.Header.Get("Origin")
        allowedOrigins := []string{
            "https://compify.pages.dev",
            "https://compify-preview.pages.dev",
            "http://localhost:4321", // Development
        }
        
        for _, allowed := range allowedOrigins {
            if origin == allowed {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                break
            }
        }
        
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        w.Header().Set("Access-Control-Allow-Credentials", "true")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

## Design System Routing

### Static Site Integration (Astro)
In `apps/web-static/src/layouts/Layout.astro`:

```astro
---
// Import design system CSS
import '/shared/design-system/tokens.css';
import '/shared/design-system/base.css';
import '/shared/design-system/components.css';
import '/shared/design-system/layout.css';
import '/shared/design-system/utilities.css';
---
```

### Backend Integration (Go Templates)
In `apps/backend/internal/templates/layout.templ`:

```html
<head>
  <!-- Design System CSS -->
  <link rel="stylesheet" href="/design-system/tokens.css">
  <link rel="stylesheet" href="/design-system/base.css">
  <link rel="stylesheet" href="/design-system/components.css">
  <link rel="stylesheet" href="/design-system/layout.css">
  <link rel="stylesheet" href="/design-system/utilities.css">
</head>
```

### Sandbox Integration
In `apps/sandbox/index.html`:

```html
<head>
  <!-- Design System CSS -->
  <link rel="stylesheet" href="/design-system/tokens.css">
  <link rel="stylesheet" href="/design-system/base.css">
  <link rel="stylesheet" href="/design-system/components.css">
  <link rel="stylesheet" href="/design-system/layout.css">
</head>
```

## Navigation Integration

### Cross-App Navigation
Update navigation components to use consistent routing:

```javascript
// Navigation configuration
const navConfig = {
  // Static site pages
  home: '/',
  about: '/about/',
  rules: '/rules/',
  timeline: '/timeline/',
  sponsors: '/sponsors/',
  faq: '/faq/',
  
  // Sandbox
  sandbox: '/sandbox/',
  
  // Authentication (proxied to backend)
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/auth/dashboard',
  
  // API endpoints (proxied to backend)
  api: '/api/'
};
```

### Astro Navigation Component
Update `apps/web-static/src/components/Navigation.astro`:

```astro
---
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
  { href: '/rules/', label: 'Rules' },
  { href: '/timeline/', label: 'Timeline' },
  { href: '/sponsors/', label: 'Sponsors' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/sandbox/', label: 'Play Games' },
];

const authItems = [
  { href: '/auth/login', label: 'Login', class: 'btn btn-outline' },
  { href: '/auth/register', label: 'Register', class: 'btn btn-primary' },
  { href: '/auth/dashboard', label: 'Dashboard', class: 'btn btn-secondary' },
];
---
```

### Backend Navigation
Update `apps/backend/internal/templates/layout.templ`:

```html
<nav class="nav nav-horizontal">
  <a href="/" class="nav-link">Home</a>
  <a href="/about/" class="nav-link">About</a>
  <a href="/sandbox/" class="nav-link">Games</a>
  <a href="/auth/dashboard" class="nav-link">Dashboard</a>
  <a href="/auth/logout" class="nav-link">Logout</a>
</nav>
```

## Build Process Integration

### Design System Copy Script
Create `scripts/copy-design-system.js`:

```javascript
const fs = require('fs-extra');
const path = require('path');

async function copyDesignSystem() {
  const sourceDir = path.join(__dirname, '../shared/design-system');
  
  // Copy to static site public directory
  const staticTarget = path.join(__dirname, '../apps/web-static/public/shared/design-system');
  await fs.copy(sourceDir, staticTarget);
  console.log('✅ Design system copied to static site');
  
  // Copy to backend static directory
  const backendTarget = path.join(__dirname, '../apps/backend/static/design-system');
  await fs.copy(sourceDir, backendTarget);
  console.log('✅ Design system copied to backend');
  
  // Copy to sandbox public directory
  const sandboxTarget = path.join(__dirname, '../apps/sandbox/public/design-system');
  await fs.copy(sourceDir, sandboxTarget);
  console.log('✅ Design system copied to sandbox');
}

copyDesignSystem().catch(console.error);
```

### Package.json Scripts
Update root `package.json`:

```json
{
  "scripts": {
    "copy-design-system": "node scripts/copy-design-system.js",
    "build:static": "npm run copy-design-system && cd apps/web-static && npm run build",
    "build:backend": "npm run copy-design-system && cd apps/backend && go build -o ../../dist/compify-backend ./cmd",
    "build:sandbox": "npm run copy-design-system && cd apps/sandbox && npm run build",
    "build:all": "npm run build:static && npm run build:backend && npm run build:sandbox",
    "dev:static": "npm run copy-design-system && cd apps/web-static && npm run dev",
    "dev:backend": "npm run copy-design-system && cd apps/backend && go run ./cmd",
    "dev:sandbox": "npm run copy-design-system && cd apps/sandbox && npm run dev"
  }
}
```

## Environment Configuration

### Development Environment
```bash
# Static site
ASTRO_SITE=http://localhost:4321
BACKEND_URL=http://localhost:8080
SANDBOX_URL=http://localhost:5173

# Backend
PORT=8080
CORS_ORIGINS=http://localhost:4321,http://localhost:5173
STATIC_SITE_URL=http://localhost:4321
SANDBOX_URL=http://localhost:5173
```

### Production Environment
```bash
# Static site
ASTRO_SITE=https://compify.pages.dev
BACKEND_URL=https://compify-api.onrender.com
SANDBOX_URL=https://compify.pages.dev/sandbox

# Backend
PORT=10000
CORS_ORIGINS=https://compify.pages.dev
STATIC_SITE_URL=https://compify.pages.dev
SANDBOX_URL=https://compify.pages.dev/sandbox
```

## Testing the Routing

### Local Testing
1. Start all services:
   ```bash
   npm run dev:static    # Port 4321
   npm run dev:backend   # Port 8080
   npm run dev:sandbox   # Port 5173
   ```

2. Test navigation:
   - Static pages: http://localhost:4321/
   - Authentication: http://localhost:4321/auth/login (should proxy to backend)
   - Sandbox: http://localhost:4321/sandbox/
   - Design system: http://localhost:4321/design-system/tokens.css

### Production Testing
1. Deploy all services
2. Test cross-app navigation
3. Verify design system consistency
4. Check CORS functionality
5. Validate caching headers

## Troubleshooting

### Common Issues

**CORS Errors:**
- Verify CORS_ORIGINS environment variable
- Check that origin headers match exactly
- Ensure credentials are handled properly

**Design System Not Loading:**
- Verify copy-design-system script ran
- Check file paths in HTML/templates
- Validate cache headers aren't blocking updates

**Routing Issues:**
- Check _redirects file syntax
- Verify proxy target URLs are correct
- Test with curl to isolate issues

**Authentication Problems:**
- Verify session cookies work across domains
- Check HTTPS/secure cookie settings
- Validate CSRF protection configuration

### Debug Commands
```bash
# Test proxy routing
curl -H "Origin: https://compify.pages.dev" https://compify.pages.dev/auth/login

# Test CORS
curl -H "Origin: https://compify.pages.dev" -H "Access-Control-Request-Method: POST" -X OPTIONS https://compify-api.onrender.com/auth/login

# Test design system
curl https://compify.pages.dev/design-system/tokens.css

# Test health check
curl https://compify-api.onrender.com/health
```

## Security Considerations

1. **HTTPS Only**: All production traffic uses HTTPS
2. **CORS Restrictions**: Only allow trusted origins
3. **Security Headers**: Implement comprehensive security headers
4. **Session Security**: Use secure, httpOnly cookies
5. **Content Security Policy**: Implement CSP headers
6. **Rate Limiting**: Protect API endpoints from abuse

## Performance Optimization

1. **CDN Caching**: Aggressive caching for static assets
2. **Compression**: Enable gzip/brotli compression
3. **Asset Optimization**: Minify CSS and JavaScript
4. **HTTP/2**: Leverage HTTP/2 for better performance
5. **Preloading**: Preload critical resources
6. **Service Workers**: Consider for offline functionality

This routing configuration ensures seamless user experience while maintaining the architectural benefits of independent deployments.