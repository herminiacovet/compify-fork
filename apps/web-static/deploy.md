# Static Site Deployment Guide

This guide covers deploying the Compify MVP static site to Cloudflare Pages.

## Prerequisites

- Cloudflare account
- Git repository with your code
- Node.js 18+ for local testing

## Cloudflare Pages Deployment

### Method 1: Git Integration (Recommended)

1. **Connect Repository:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → "Connect to Git"
   - Select your repository
   - Choose the branch for production (usually `main` or `master`)

2. **Configure Build Settings:**
   ```
   Framework preset: None (or Astro if available)
   Build command: cd apps/web-static && npm install && npm run build
   Build output directory: apps/web-static/dist
   Root directory: (leave empty)
   ```

3. **Environment Variables:**
   Add these in the Cloudflare Pages dashboard:
   ```
   NODE_VERSION=18
   NPM_VERSION=9
   ASTRO_SITE=https://your-domain.com
   BACKEND_URL=https://api.your-domain.com
   SANDBOX_URL=https://sandbox.your-domain.com
   ```

4. **Deploy:**
   - Click "Save and Deploy"
   - Wait for the build to complete
   - Your site will be available at `https://your-project.pages.dev`

### Method 2: Direct Upload

1. **Build Locally:**
   ```bash
   cd apps/web-static
   npm install
   npm run build
   ```

2. **Upload to Cloudflare Pages:**
   - Go to Cloudflare Pages dashboard
   - Click "Upload assets"
   - Upload the contents of `apps/web-static/dist/`

## Custom Domain Setup

1. **Add Custom Domain:**
   - In your Cloudflare Pages project, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `compify.com`)

2. **DNS Configuration:**
   - Add a CNAME record pointing to your Pages project:
     ```
     compify.com CNAME your-project.pages.dev
     ```
   - Or use Cloudflare's nameservers for full integration

3. **SSL Certificate:**
   - SSL is automatically provisioned by Cloudflare
   - Wait for the certificate to be issued (usually a few minutes)

## Performance Optimization

### Cache Headers

The deployment automatically includes optimized cache headers:

- **Static assets** (`/assets/*`): 1 year cache
- **HTML files**: 1 hour cache with 2-hour CDN cache
- **CSS/JS files**: 1 year cache (with hash-based filenames)

### CDN Configuration

Cloudflare automatically provides:
- Global CDN distribution
- Automatic compression (Gzip/Brotli)
- Image optimization
- Minification

## Security Headers

The following security headers are automatically applied:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Verification

After deployment, verify your site using the verification script:

```bash
# Set your site URL
export SITE_URL=https://your-domain.com

# Run verification
node apps/web-static/verify-deployment.cjs
```

The script checks:
- ✅ All pages are accessible (200 status)
- ✅ Proper HTML structure
- ✅ SEO meta tags presence
- ✅ Security headers
- ✅ Load time performance
- ✅ Navigation functionality

## Troubleshooting

### Build Failures

**Issue:** Build fails with "command not found"
**Solution:** Ensure build command includes `cd apps/web-static &&`

**Issue:** Node.js version errors
**Solution:** Set `NODE_VERSION=18` in environment variables

**Issue:** Missing dependencies
**Solution:** Ensure `npm install` is in the build command

### Deployment Issues

**Issue:** 404 errors on page routes
**Solution:** Check that all pages are in `src/pages/` directory

**Issue:** Assets not loading
**Solution:** Verify `astro.config.mjs` has correct `site` configuration

**Issue:** Slow loading times
**Solution:** Check asset optimization and CDN configuration

### DNS Issues

**Issue:** Domain not resolving
**Solution:** Verify CNAME record points to `your-project.pages.dev`

**Issue:** SSL certificate errors
**Solution:** Wait for certificate provisioning (up to 24 hours)

## Monitoring

### Analytics

Enable Cloudflare Web Analytics:
1. Go to Cloudflare dashboard → Analytics → Web Analytics
2. Add your site
3. Add the analytics script to your site (optional for basic metrics)

### Performance Monitoring

Monitor key metrics:
- **Core Web Vitals** (LCP, FID, CLS)
- **Load times** across different regions
- **Cache hit rates**
- **Bandwidth usage**

### Uptime Monitoring

Set up external monitoring:
- Use services like UptimeRobot or Pingdom
- Monitor main pages: `/`, `/about/`, `/rules/`
- Set up alerts for downtime

## Maintenance

### Updates

1. **Code Changes:**
   - Push to your Git repository
   - Cloudflare Pages automatically rebuilds and deploys

2. **Environment Variables:**
   - Update in Cloudflare Pages dashboard
   - Trigger a new deployment if needed

3. **Cache Purging:**
   - Use Cloudflare dashboard to purge cache if needed
   - Cache automatically updates with new deployments

### Backup

- Git repository serves as primary backup
- Cloudflare maintains deployment history
- Consider periodic exports of analytics data

## Cost Optimization

### Free Tier Limits

Cloudflare Pages free tier includes:
- 500 builds per month
- Unlimited bandwidth
- Unlimited requests
- 100 custom domains

### Optimization Tips

1. **Minimize build frequency:**
   - Use preview deployments for testing
   - Batch changes when possible

2. **Optimize assets:**
   - Use WebP images where supported
   - Minimize CSS and JavaScript
   - Enable compression

3. **Monitor usage:**
   - Check build minutes usage
   - Monitor bandwidth if approaching limits

## Advanced Configuration

### Custom Headers

Add custom headers in `apps/web-static/public/_headers`:

```
/*
  X-Custom-Header: value
  
/api/*
  X-API-Header: api-value
```

### Redirects

Add redirects in `apps/web-static/public/_redirects`:

```
/old-page /new-page 301
/api/* https://api.your-domain.com/:splat 200
```

### Functions (Optional)

For advanced functionality, you can add Cloudflare Pages Functions:

1. Create `functions/` directory in your project
2. Add serverless functions for dynamic behavior
3. Deploy with your static site

## Support

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Community](https://community.cloudflare.com/)