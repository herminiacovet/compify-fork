package server

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// loggingMiddleware logs HTTP requests
func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call the next handler
		next.ServeHTTP(wrapped, r)
		
		// Log the request
		duration := time.Since(start)
		log.Printf("%s %s %d %v %s", 
			r.Method, 
			r.URL.Path, 
			wrapped.statusCode, 
			duration,
			r.RemoteAddr,
		)
	})
}

// corsMiddleware handles CORS headers
func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400")
		
		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

// securityHeadersMiddleware adds security headers
func (s *Server) securityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Content Security Policy for development
		if s.config.Environment == "development" {
			w.Header().Set("Content-Security-Policy", "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'")
		} else {
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")
		}
		
		next.ServeHTTP(w, r)
	})
}

// cachingMiddleware adds appropriate cache headers based on content type and route
func (s *Server) cachingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		
		// Determine cache strategy based on route
		switch {
		case isStaticAsset(path):
			// Static assets: long-term caching with immutable flag
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			w.Header().Set("Expires", time.Now().Add(365*24*time.Hour).Format(http.TimeFormat))
			
		case isHealthEndpoint(path):
			// Health endpoints: short-term caching
			w.Header().Set("Cache-Control", "public, max-age=60")
			
		case isAPIEndpoint(path):
			// API endpoints: no caching for dynamic data
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
			
		case isDashboardEndpoint(path):
			// Dashboard pages: private caching with short TTL
			w.Header().Set("Cache-Control", "private, max-age=300")
			
		case isAuthEndpoint(path):
			// Authentication pages: no caching
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
			
		default:
			// Default: moderate caching for dynamic content
			w.Header().Set("Cache-Control", "public, max-age=300, s-maxage=600")
		}
		
		// Add ETag for conditional requests on dynamic content (but not for health endpoints)
		if !isStaticAsset(path) && !isAPIEndpoint(path) && !isHealthEndpoint(path) {
			etag := generateETag(r)
			w.Header().Set("ETag", etag)
			
			// Check If-None-Match header for 304 responses
			if match := r.Header.Get("If-None-Match"); match == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		
		next.ServeHTTP(w, r)
	})
}

// Helper functions for route classification
func isStaticAsset(path string) bool {
	staticExtensions := []string{".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot"}
	for _, ext := range staticExtensions {
		if len(path) > len(ext) && path[len(path)-len(ext):] == ext {
			return true
		}
	}
	return false
}

func isHealthEndpoint(path string) bool {
	return path == "/health" || path == "/status"
}

func isAPIEndpoint(path string) bool {
	return len(path) > 4 && path[:4] == "/api"
}

func isDashboardEndpoint(path string) bool {
	return len(path) >= 10 && path[:10] == "/dashboard"
}

func isAuthEndpoint(path string) bool {
	return path == "/login" || path == "/register" || (len(path) > 5 && path[:5] == "/auth")
}

// generateETag creates a simple ETag based on request path and current time
func generateETag(r *http.Request) string {
	// Simple ETag generation - in production, this should be more sophisticated
	// based on actual content hash or last-modified time
	hash := fmt.Sprintf("%x", time.Now().Unix())
	return `"` + hash + `"`
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader captures the status code
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}