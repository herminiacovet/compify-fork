package server

import (
	"compify-backend/internal/auth"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"time"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

// StatusResponse represents the detailed status response
type StatusResponse struct {
	Status      string            `json:"status"`
	Service     string            `json:"service"`
	Version     string            `json:"version"`
	Environment string            `json:"environment"`
	Uptime      string            `json:"uptime"`
	GoVersion   string            `json:"go_version"`
	Timestamp   time.Time         `json:"timestamp"`
	Config      map[string]string `json:"config"`
}

var startTime = time.Now()

// handleHealth handles the health check endpoint
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := HealthResponse{
		Status:    "ok",
		Service:   "compify-backend",
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// handleStatus handles the detailed status endpoint
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	uptime := time.Since(startTime)
	
	response := StatusResponse{
		Status:      "ok",
		Service:     "compify-backend",
		Version:     "1.0.0",
		Environment: s.config.Environment,
		Uptime:      uptime.String(),
		GoVersion:   runtime.Version(),
		Timestamp:   time.Now(),
		Config: map[string]string{
			"port":      s.config.Port,
			"log_level": s.config.LogLevel,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// handleRoot handles the root endpoint
func (s *Server) handleRoot(w http.ResponseWriter, r *http.Request) {
	// Handle 404 for unknown paths
	if r.URL.Path != "/" {
		s.handle404(w, r)
		return
	}

	// Redirect to static site home page
	staticSiteURL := s.getStaticSiteURL()
	http.Redirect(w, r, staticSiteURL, http.StatusTemporaryRedirect)
}

// handle404 handles 404 Not Found responses with proper HTML
func (s *Server) handle404(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	
	staticSiteURL := s.getStaticSiteURL()
	sandboxURL := s.getSandboxURL()
	
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - Page Not Found | Compify</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 2rem; background: #f9fafb; color: #374151;
            display: flex; align-items: center; justify-content: center; min-height: 100vh;
        }
        .container { 
            max-width: 500px; text-align: center; background: white; 
            padding: 3rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 { color: #1e40af; margin-bottom: 1rem; font-size: 2rem; }
        p { margin-bottom: 2rem; line-height: 1.6; }
        .links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn { 
            padding: 0.75rem 1.5rem; border-radius: 0.375rem; text-decoration: none;
            font-weight: 500; transition: all 0.2s ease; display: inline-block;
        }
        .btn-primary { background: #1e40af; color: white; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline { color: #1e40af; border: 1px solid #1e40af; background: transparent; }
        .btn-outline:hover { background: #1e40af; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist on the backend server. You might be looking for one of these:</p>
        <div class="links">
            <a href="%s" class="btn btn-primary">Go to Home</a>
            <a href="/login" class="btn btn-outline">Login</a>
            <a href="/dashboard" class="btn btn-outline">Dashboard</a>
            <a href="%s" class="btn btn-outline">Play Games</a>
        </div>
    </div>
</body>
</html>`, staticSiteURL, sandboxURL)
	
	fmt.Fprint(w, html)
}

// handleStaticRedirect handles redirects to static site pages
func (s *Server) handleStaticRedirect(w http.ResponseWriter, r *http.Request) {
	// Extract the page path from the URL
	path := r.URL.Path
	
	// Build the static site URL
	staticSiteURL := s.getStaticSiteURL() + path
	
	// Perform temporary redirect to static site
	http.Redirect(w, r, staticSiteURL, http.StatusTemporaryRedirect)
}

// handleSandboxRedirect handles redirects to sandbox/game pages
func (s *Server) handleSandboxRedirect(w http.ResponseWriter, r *http.Request) {
	// Build the sandbox URL
	sandboxURL := s.getSandboxURL()
	
	// Perform temporary redirect to sandbox
	http.Redirect(w, r, sandboxURL, http.StatusTemporaryRedirect)
}

// getStaticSiteURL returns the static site base URL based on environment
func (s *Server) getStaticSiteURL() string {
	if s.config.Environment == "production" {
		// In production, static site is served from CDN
		return getEnv("STATIC_SITE_URL", "https://compify.com")
	}
	// In development, static site runs on different port
	return getEnv("STATIC_SITE_URL", "http://localhost:4321")
}

// getSandboxURL returns the sandbox base URL based on environment
func (s *Server) getSandboxURL() string {
	if s.config.Environment == "production" {
		// In production, sandbox is served from CDN
		return getEnv("SANDBOX_URL", "https://sandbox.compify.com")
	}
	// In development, sandbox runs on different port
	return getEnv("SANDBOX_URL", "http://localhost:5173")
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// handleRegister handles user registration
func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Parse request body
	var req auth.RegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Get client info
	ipAddress := s.getClientIP(r)
	userAgent := r.UserAgent()

	// Register user
	user, session, err := s.auth.Register(&req, ipAddress, userAgent)
	if err != nil {
		// Handle specific errors
		switch err {
		case auth.ErrUserAlreadyExists:
			s.writeErrorResponse(w, http.StatusConflict, "User already exists", "")
		case auth.ErrPasswordTooShort:
			s.writeErrorResponse(w, http.StatusBadRequest, "Password too short", "Password must be at least 8 characters long")
		case auth.ErrPasswordsDoNotMatch:
			s.writeErrorResponse(w, http.StatusBadRequest, "Passwords do not match", "")
		default:
			if strings.Contains(err.Error(), "email already exists") {
				s.writeErrorResponse(w, http.StatusConflict, "Email already exists", "")
			} else if strings.Contains(err.Error(), "username already exists") {
				s.writeErrorResponse(w, http.StatusConflict, "Username already exists", "")
			} else if strings.Contains(err.Error(), "invalid email") {
				s.writeErrorResponse(w, http.StatusBadRequest, "Invalid email format", "")
			} else if strings.Contains(err.Error(), "invalid username") {
				s.writeErrorResponse(w, http.StatusBadRequest, "Invalid username format", "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens")
			} else {
				s.writeErrorResponse(w, http.StatusInternalServerError, "Registration failed", "")
			}
		}
		return
	}

	// Set session cookie
	s.setSessionCookie(w, session.Token)

	// Return success response
	response := SuccessResponse{
		Success: true,
		Message: "Registration successful",
		Data: map[string]interface{}{
			"user": map[string]interface{}{
				"id":       user.ID,
				"email":    user.Email,
				"username": user.Username,
				"profile":  user.Profile,
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// handleLogin handles user login
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Parse request body
	var req auth.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Get client info
	ipAddress := s.getClientIP(r)
	userAgent := r.UserAgent()

	// Login user
	user, session, err := s.auth.Login(&req, ipAddress, userAgent)
	if err != nil {
		// Handle specific errors
		switch err {
		case auth.ErrInvalidCredentials:
			s.writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials", "")
		default:
			if strings.Contains(err.Error(), "email is required") || strings.Contains(err.Error(), "password is required") {
				s.writeErrorResponse(w, http.StatusBadRequest, "Missing required fields", "")
			} else {
				s.writeErrorResponse(w, http.StatusInternalServerError, "Login failed", "")
			}
		}
		return
	}

	// Set session cookie
	s.setSessionCookie(w, session.Token)

	// Return success response
	response := SuccessResponse{
		Success: true,
		Message: "Login successful",
		Data: map[string]interface{}{
			"user": map[string]interface{}{
				"id":       user.ID,
				"email":    user.Email,
				"username": user.Username,
				"profile":  user.Profile,
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// handleLogout handles user logout
func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Get session token
	sessionToken := s.auth.GetSessionFromRequest(r)

	// Logout user
	if err := s.auth.Logout(sessionToken); err != nil {
		// Log error but don't fail the request
		// Logout should be idempotent
	}

	// Clear session cookie
	s.clearSessionCookie(w)

	// Return success response
	response := SuccessResponse{
		Success: true,
		Message: "Logout successful",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Helper methods

// writeErrorResponse writes a JSON error response
func (s *Server) writeErrorResponse(w http.ResponseWriter, statusCode int, error, message string) {
	response := ErrorResponse{
		Error:   error,
		Message: message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// setSessionCookie sets a secure session cookie
func (s *Server) setSessionCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60, // 7 days
		HttpOnly: true,
		Secure:   s.config.Environment == "production",
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

// clearSessionCookie clears the session cookie
func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.config.Environment == "production",
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

// getClientIP extracts the client IP address from the request
func (s *Server) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the list
		if ips := strings.Split(xff, ","); len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	if ip := strings.Split(r.RemoteAddr, ":"); len(ip) > 0 {
		return ip[0]
	}

	return "unknown"
}