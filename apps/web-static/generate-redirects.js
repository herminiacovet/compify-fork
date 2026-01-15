#!/usr/bin/env node

/**
 * Generate _redirects file dynamically based on environment variables
 * This ensures the backend URL is never hardcoded
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get backend URL from environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

console.log(`🔧 Generating _redirects file with BACKEND_URL: ${BACKEND_URL}`);

// Generate _redirects content
const redirectsContent = `# Compify MVP Routing Configuration
# This file configures URL routing and proxying for Cloudflare Pages
# Generated dynamically from BACKEND_URL environment variable

# Backend page routes - proxy to backend server
/login    ${BACKEND_URL}/login    200
/register ${BACKEND_URL}/register 200
/dashboard ${BACKEND_URL}/dashboard 200

# API and Authentication form routes - proxy to backend server
/auth/*  ${BACKEND_URL}/auth/:splat  200
/api/*   ${BACKEND_URL}/api/:splat   200

# Design system assets - serve from static files
/design-system/*  /shared/design-system/:splat  200

# Sandbox routes - serve from static files in sandbox directory
/sandbox/*  /sandbox/:splat  200
/sandbox    /sandbox/index.html  200

# Health check proxy (for monitoring)
/health  ${BACKEND_URL}/health  200

# Trailing slash redirects for consistency
/about   /about/   301
/rules   /rules/   301
/timeline /timeline/ 301
/sponsors /sponsors/ 301
/faq     /faq/     301

# SPA fallback for client-side routing (if needed)
# /*  /index.html  404
`;

// Write to public directory
const outputPath = join(__dirname, 'public', '_redirects');
writeFileSync(outputPath, redirectsContent, 'utf8');

console.log(`✅ _redirects file generated at: ${outputPath}`);
console.log(`📍 Backend URL: ${BACKEND_URL}`);
