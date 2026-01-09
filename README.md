# Compify MVP

A competition website built with a monorepo architecture featuring a static marketing site, server-driven backend, and isolated game sandbox.

## Architecture

- **Static Site** (`apps/web-static`) - Astro-based marketing pages with SEO optimization
- **Backend Server** (`apps/backend`) - Go HTTP server with Templ templates and HTMX
- **Game Sandbox** (`apps/sandbox`) - Phaser.js browser games
- **Shared Resources** (`shared/`) - Common assets and constants

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev:all
   ```

3. **Access applications:**
   - Static site: http://localhost:4321
   - Backend: http://localhost:8080
   - Sandbox: http://localhost:3001

## Development

### Individual Services

- **Static site only:** `npm run dev:static`
- **Backend only:** `npm run dev:backend`
- **Sandbox only:** `npm run dev:sandbox`

### Building

- **Build all:** `npm run build:all`
- **Individual builds:** `npm run build:static`, `npm run build:backend`, `npm run build:sandbox`

## Project Structure

```
compify/
├── apps/
│   ├── web-static/        # Astro marketing site
│   ├── backend/           # Go server with Templ + HTMX
│   └── sandbox/           # Phaser.js games
├── shared/
│   ├── assets/            # Common assets
│   └── constants/         # Shared constants
├── infra/                 # Deployment documentation
└── package.json           # Monorepo scripts
```

## Technology Stack

- **Frontend:** Astro (static), HTMX (dynamic)
- **Backend:** Go, Templ templates
- **Games:** Phaser.js
- **Deployment:** Cloudflare Pages (static), free-tier cloud (backend)

## Requirements

- Node.js 18+
- Go 1.21+
- npm or yarn