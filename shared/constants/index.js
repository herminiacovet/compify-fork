// Shared constants for Compify MVP
export const SITE_CONFIG = {
  name: 'Compify',
  description: 'Competition website with mini-games',
  url: 'https://compify.com',
  author: 'Compify Team'
};

// Routing configuration for all applications
export const ROUTES = {
  // Static site routes (marketing pages)
  STATIC: {
    HOME: '/',
    ABOUT: '/about',
    RULES: '/rules',
    TIMELINE: '/timeline',
    SPONSORS: '/sponsors',
    FAQ: '/faq'
  },
  
  // Backend routes (authentication and dashboard)
  BACKEND: {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    LOGOUT: '/auth/logout',
    API_AUTH: '/api/auth'
  },
  
  // Sandbox routes (games)
  SANDBOX: {
    ROOT: '/',
    GAMES: '/games'
  }
};

// Environment-aware URL builders
export const getBackendURL = (isDev = false) => {
  if (typeof process !== 'undefined' && process.env) {
    if (isDev) {
      return process.env.BACKEND_URL || 'http://localhost:8080';
    }
    return process.env.BACKEND_URL || 'https://api.compify.com';
  }
  // Fallback for browser environments
  return isDev ? 'http://localhost:8080' : 'https://api.compify.com';
};

export const getStaticSiteURL = (isDev = false) => {
  if (typeof process !== 'undefined' && process.env) {
    if (isDev) {
      return process.env.STATIC_SITE_URL || 'http://localhost:4321';
    }
    return process.env.STATIC_SITE_URL || 'https://compify.com';
  }
  // Fallback for browser environments
  return isDev ? 'http://localhost:4321' : 'https://compify.com';
};

export const getSandboxURL = (isDev = false) => {
  if (typeof process !== 'undefined' && process.env) {
    if (isDev) {
      return process.env.SANDBOX_URL || 'http://localhost:5173';
    }
    return process.env.SANDBOX_URL || 'https://sandbox.compify.com';
  }
  // Fallback for browser environments
  return isDev ? 'http://localhost:5173' : 'https://sandbox.compify.com';
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout'
  },
  dashboard: {
    profile: '/dashboard/profile',
    status: '/dashboard/status',
    announcements: '/dashboard/announcements'
  }
};

export const GAME_CONFIG = {
  width: 800,
  height: 600,
  backgroundColor: '#2c3e50'
};

// HTTP Status codes for consistent responses
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Cache control headers for different content types
export const CACHE_HEADERS = {
  STATIC_ASSETS: 'public, max-age=31536000, immutable', // 1 year
  DYNAMIC_CONTENT: 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  PRIVATE: 'private, max-age=0'
};