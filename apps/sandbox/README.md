# Compify Game Sandbox

A simple asteroid shooter game built with Phaser.js for the Compify MVP. This game is designed to be deployed as static assets to any CDN or hosting service.

## 🎮 Game Features

- **Asteroid Shooter**: Classic space shooter gameplay
- **Progressive Difficulty**: Asteroids spawn faster as you progress
- **High Score Tracking**: Local storage-based high score system
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Controls**: Arrow keys to move, Space to shoot, ESC to pause

## 🏗️ Architecture

- **Pure Client-Side**: No server dependencies or API calls
- **Static Asset Deployment**: Optimized for CDN distribution
- **Scene Management**: Proper game state management with Phaser scenes
- **Asset Loading**: Graceful fallbacks for missing assets
- **Performance Optimized**: Code splitting and minification

## 🚀 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Verify deployment readiness
npm run verify
```

### Project Structure

```
src/
├── main.js              # Game entry point
├── scenes/              # Phaser game scenes
│   ├── LoadingScene.js  # Asset loading with progress
│   ├── MenuScene.js     # Main menu
│   ├── GameScene.js     # Core gameplay
│   └── GameOverScene.js # Game over screen
└── utils/
    └── AssetManager.js  # Asset loading utilities
```

## 📦 Deployment

The game is built as static assets and can be deployed to any static hosting service:

### Supported Platforms

- **Cloudflare Pages** ✅
- **Netlify** ✅  
- **Vercel** ✅
- **AWS S3 + CloudFront** ✅
- **GitHub Pages** ✅
- **Any CDN or static host** ✅

### Build Output

```
dist/
├── index.html                    # Entry point
├── assets/
│   ├── main.[hash].js           # Game code
│   ├── phaser.[hash].js         # Phaser.js library
│   └── [other assets]
└── manifest.json                # PWA manifest
```

### Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Verify deployment:**
   ```bash
   npm run verify
   ```

3. **Upload `dist/` contents** to your hosting service

4. **Configure cache headers** (optional but recommended):
   - HTML files: `Cache-Control: public, max-age=0, must-revalidate`
   - JS/CSS files: `Cache-Control: public, max-age=31536000, immutable`

## 🎯 Game Requirements Compliance

This implementation satisfies the following requirements:

- ✅ **4.1**: Simple 2D browser game using Phaser.js
- ✅ **4.2**: Loads and runs independently without authentication
- ✅ **4.3**: Operates in stateless manner without database storage
- ✅ **4.4**: Served as static assets through CDN
- ✅ **4.5**: Isolated from core application logic
- ✅ **9.4**: Uses Phaser.js framework exclusively

## 🔧 Technical Details

### Performance Optimizations

- **Code Splitting**: Phaser.js loaded as separate chunk
- **Tree Shaking**: Unused code eliminated
- **Minification**: All assets minified for production
- **Content Hashing**: Optimal browser caching
- **Relative Paths**: CDN-compatible asset loading

### Browser Compatibility

- **Target**: ES2018+ (covers 95%+ of browsers)
- **Fallbacks**: Graceful error handling for unsupported browsers
- **Mobile**: Touch-friendly responsive design
- **Performance**: Optimized for 3G connections

### Security Features

- **No Server Dependencies**: Pure client-side execution
- **Content Security**: No external API calls or data transmission
- **Local Storage Only**: High scores stored locally
- **Static Assets**: No dynamic server-side processing

## 🐛 Troubleshooting

### Common Issues

**Game doesn't load:**
- Check browser console for JavaScript errors
- Verify all asset files are accessible
- Ensure proper MIME types for .js files

**Performance issues:**
- Enable gzip compression on your server
- Use a CDN for global distribution
- Check for memory leaks in browser dev tools

**Mobile issues:**
- Test touch controls on actual devices
- Verify responsive scaling works correctly
- Check for iOS Safari specific issues

### Development Issues

**Build fails:**
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript/ESLint errors

**Assets not loading:**
- Verify relative paths in vite.config.js
- Check asset file extensions and naming
- Ensure proper import statements

## 📄 License

Part of the Compify MVP project. See main project LICENSE for details.