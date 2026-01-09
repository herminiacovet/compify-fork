# Sandbox Deployment Guide

## Static Asset Deployment

The Compify Game Sandbox is designed to be deployed as static assets to any CDN or static hosting service.

### Build Process

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build for production:**
   ```bash
   npm run build:prod
   ```

3. **Preview locally:**
   ```bash
   npm run preview
   ```

### Deployment Targets

#### Cloudflare Pages
- Upload the `dist/` folder contents
- Set build command: `npm run build:prod`
- Set output directory: `dist`
- No environment variables needed

#### Netlify
- Connect to Git repository
- Build command: `npm run build:prod`
- Publish directory: `dist`

#### AWS S3 + CloudFront
- Upload `dist/` contents to S3 bucket
- Configure CloudFront distribution
- Set proper cache headers for assets

#### GitHub Pages
- Build locally and push `dist/` to `gh-pages` branch
- Or use GitHub Actions for automated deployment

### Key Features for Static Deployment

✅ **No Server Dependencies**
- Pure client-side JavaScript
- No API calls or database connections
- No server-side rendering

✅ **Optimized Assets**
- Minified JavaScript bundles
- Content-based hashing for cache busting
- Separate vendor chunks for better caching

✅ **CDN Ready**
- Relative asset paths
- Proper cache headers
- Optimized for global distribution

✅ **Browser Compatibility**
- ES2018 target for wide browser support
- Fallback error handling
- Progressive enhancement

### File Structure After Build

```
dist/
├── index.html              # Main entry point
├── assets/
│   ├── main.[hash].js      # Game code
│   ├── phaser.[hash].js    # Phaser.js library
│   └── main.[hash].css     # Styles
└── manifest.json           # PWA manifest
```

### Performance Optimizations

- **Code Splitting**: Phaser.js loaded as separate chunk
- **Tree Shaking**: Unused code eliminated
- **Minification**: All assets minified for production
- **Caching**: Content-based hashing for optimal caching

### Testing Deployment

1. Build the project: `npm run build:prod`
2. Serve locally: `npm run preview`
3. Test in different browsers
4. Verify no console errors
5. Check network tab for proper asset loading

### Troubleshooting

**Game doesn't load:**
- Check browser console for errors
- Verify all assets are accessible
- Ensure proper MIME types for .js files

**Performance issues:**
- Enable gzip compression on server
- Set proper cache headers
- Use CDN for global distribution

**Mobile issues:**
- Test responsive scaling
- Verify touch controls work
- Check for memory limitations