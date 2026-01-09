# Caching Strategy for Compify MVP

## Overview

This document outlines the comprehensive caching strategy implemented across all three applications in the Compify monorepo to optimize performance and reduce costs.

## Backend Server Caching (Go)

### Cache Headers by Content Type

#### Static Assets (CSS, JS, Images)
- **Cache-Control**: `public, max-age=31536000, immutable`
- **Expires**: 1 year from request
- **Rationale**: Static assets with content hashes can be cached indefinitely

#### Health Endpoints (/health, /status)
- **Cache-Control**: `public, max-age=60`
- **Rationale**: Health checks can be cached briefly to reduce server load

#### API Endpoints (/api/*)
- **Cache-Control**: `no-cache, no-store, must-revalidate`
- **Pragma**: `no-cache`
- **Expires**: `0`
- **Rationale**: Dynamic API data should never be cached

#### Dashboard Pages (/dashboard/*)
- **Cache-Control**: `private, max-age=300`
- **ETag**: Generated for conditional requests
- **Rationale**: User-specific content with short private caching

#### Authentication Pages (/login, /register, /auth/*)
- **Cache-Control**: `no-cache, no-store, must-revalidate`
- **Pragma**: `no-cache`
- **Expires**: `0`
- **Rationale**: Security-sensitive pages should never be cached

#### Default Dynamic Content
- **Cache-Control**: `public, max-age=300, s-maxage=600`
- **ETag**: Generated for conditional requests
- **Rationale**: 5 minutes browser cache, 10 minutes CDN cache

### ETag Implementation

- Generated for all non-static, non-API content
- Simple implementation based on path and timestamp
- Supports HTTP 304 Not Modified responses
- Reduces bandwidth usage for unchanged content

## Static Site Caching (Astro)

### Build Configuration

#### Asset Optimization
- Content-based hashing for all assets
- Custom assets directory (`_assets`) for better organization
- CSS and JS minification enabled
- HTML compression enabled

#### Cache Headers
- **Static Assets** (`/_assets/*`): `public, max-age=31536000, immutable`
- **Favicon** (`/favicon.ico`): `public, max-age=31536000`
- **HTML Pages** (`/*.html`): `public, max-age=3600, s-maxage=7200`

### CDN Configuration (Cloudflare Pages)

```
# _headers file for Cloudflare Pages
/_assets/*
  Cache-Control: public, max-age=31536000, immutable
  
/favicon.ico
  Cache-Control: public, max-age=31536000
  
/*.html
  Cache-Control: public, max-age=3600, s-maxage=7200
  
/*.css
  Cache-Control: public, max-age=31536000, immutable
  
/*.js
  Cache-Control: public, max-age=31536000, immutable
```

## Sandbox Caching (Phaser.js)

### Build Configuration

#### Asset Optimization
- Content-based hashing for cache busting
- Phaser.js separated into its own chunk
- ES2018 target for broad browser support
- CSS code splitting enabled

#### Development vs Production
- **Development**: No caching (`no-cache, no-store, must-revalidate`)
- **Production**: Aggressive caching for static assets

#### Cache Headers (Production)
- **JavaScript Files**: `public, max-age=31536000, immutable`
- **CSS Files**: `public, max-age=31536000, immutable`
- **Assets**: `public, max-age=31536000, immutable`
- **HTML**: `public, max-age=3600`

## CDN Strategy

### Cloudflare Configuration

#### Static Site (compify.com)
- Origin: Cloudflare Pages
- Cache everything for 1 hour minimum
- Purge cache on deployment
- Gzip/Brotli compression enabled

#### Sandbox (sandbox.compify.com)
- Origin: Cloudflare Pages or CDN
- Cache static assets for 1 year
- Cache HTML for 1 hour
- Game assets cached indefinitely with versioning

#### Backend API (api.compify.com)
- Origin: Backend server (Render/Leapcell)
- Respect origin cache headers
- No caching for authentication endpoints
- Short-term caching for health checks

### Cache Invalidation Strategy

#### Automatic Invalidation
- Static assets: Content hash changes trigger automatic invalidation
- HTML pages: Deploy triggers cache purge
- API responses: No caching, always fresh

#### Manual Invalidation
- Emergency cache purge available via Cloudflare dashboard
- Selective purge by URL pattern
- Full site purge for major updates

## Performance Optimizations

### Browser Caching
- Leverage browser cache for static assets (1 year)
- Short-term caching for dynamic content (5 minutes)
- Private caching for user-specific content

### CDN Caching
- Longer CDN cache times than browser cache
- Edge caching reduces origin server load
- Geographic distribution improves global performance

### Conditional Requests
- ETag support for 304 Not Modified responses
- Reduces bandwidth usage
- Improves perceived performance

## Monitoring and Metrics

### Key Performance Indicators
- Cache hit ratio (target: >90% for static assets)
- Time to First Byte (TTFB) (target: <200ms)
- Page load times (target: <2s on 3G)
- CDN bandwidth usage

### Monitoring Tools
- Cloudflare Analytics for CDN performance
- Backend server logs for cache effectiveness
- Browser DevTools for client-side caching verification

## Cost Optimization

### Bandwidth Reduction
- Aggressive caching reduces origin requests
- Compression reduces transfer sizes
- CDN edge caching minimizes backend load

### Server Resource Optimization
- Cached responses reduce CPU usage
- ETag support reduces unnecessary processing
- Health check caching reduces monitoring overhead

## Security Considerations

### Cache Poisoning Prevention
- No caching for authentication endpoints
- Private caching for user-specific content
- Secure headers prevent cache manipulation

### Content Security
- No sensitive data in cached responses
- Proper cache control for different content types
- Regular cache purging for security updates

## Implementation Checklist

- [x] Backend cache middleware implemented
- [x] Static site cache headers configured
- [x] Sandbox build optimization enabled
- [x] CDN cache policies documented
- [x] ETag support for conditional requests
- [x] Environment-specific cache strategies
- [ ] Production CDN configuration deployed
- [ ] Cache monitoring dashboard setup
- [ ] Performance testing completed

## Future Enhancements

### Advanced Caching
- Redis-based server-side caching
- Database query result caching
- Session data caching optimization

### Performance Monitoring
- Real User Monitoring (RUM) integration
- Automated performance testing
- Cache effectiveness analytics

### Dynamic Optimization
- Adaptive cache TTL based on content popularity
- Intelligent cache warming
- Predictive cache invalidation