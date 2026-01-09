package server

import (
	"compify-backend/internal/auth"
	"compify-backend/internal/repository"
	"log"
	"net/http"
	"os"
	"time"
)

// Server represents the HTTP server with its dependencies
type Server struct {
	router *http.ServeMux
	config *Config
	repos  *repository.Repositories
	auth   *auth.Service
}

// Config holds server configuration
type Config struct {
	Port        string
	Environment string
	LogLevel    string
}

// NewServer creates a new server instance with configuration
func NewServer() *Server {
	config := &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}

	// Initialize repositories
	repos := repository.NewRepositories()

	// Initialize auth service
	authService := auth.NewService(repos)

	server := &Server{
		router: http.NewServeMux(),
		config: config,
		repos:  repos,
		auth:   authService,
	}

	server.setupRoutes()
	server.initializeSampleData() // Initialize sample data for demonstration
	return server
}

// setupRoutes configures the server routes
func (s *Server) setupRoutes() {
	// Health check endpoint
	s.router.HandleFunc("/health", s.handleHealth)
	s.router.HandleFunc("/status", s.handleStatus)
	
	// Static site routing - redirect to static site URLs
	s.router.HandleFunc("/home", s.handleStaticRedirect)
	s.router.HandleFunc("/about", s.handleStaticRedirect)
	s.router.HandleFunc("/rules", s.handleStaticRedirect)
	s.router.HandleFunc("/timeline", s.handleStaticRedirect)
	s.router.HandleFunc("/sponsors", s.handleStaticRedirect)
	s.router.HandleFunc("/faq", s.handleStaticRedirect)
	
	// Sandbox routing - redirect to sandbox URLs
	s.router.HandleFunc("/sandbox", s.handleSandboxRedirect)
	s.router.HandleFunc("/games", s.handleSandboxRedirect)
	s.router.HandleFunc("/play", s.handleSandboxRedirect)
	
	// Template-based authentication pages
	s.router.HandleFunc("/login", s.handleLoginPage)
	s.router.HandleFunc("/register", s.handleRegisterPage)
	
	// Dashboard page (protected)
	s.router.HandleFunc("/dashboard", s.handleDashboard)
	s.router.HandleFunc("/dashboard/", s.handleDashboard)
	
	// HTMX authentication endpoints
	s.router.HandleFunc("/auth/login", s.handleLoginForm)
	s.router.HandleFunc("/auth/register", s.handleRegisterForm)
	s.router.HandleFunc("/auth/logout", s.handleLogoutForm)
	
	// HTMX dashboard profile endpoints
	s.router.HandleFunc("/dashboard/profile/edit/first-name", s.handleProfileEditFirstName)
	s.router.HandleFunc("/dashboard/profile/edit/last-name", s.handleProfileEditLastName)
	s.router.HandleFunc("/dashboard/profile/edit/bio", s.handleProfileEditBio)
	s.router.HandleFunc("/dashboard/profile/update/first-name", s.handleProfileUpdateFirstName)
	s.router.HandleFunc("/dashboard/profile/update/last-name", s.handleProfileUpdateLastName)
	s.router.HandleFunc("/dashboard/profile/update/bio", s.handleProfileUpdateBio)
	s.router.HandleFunc("/dashboard/profile/cancel/first-name", s.handleProfileCancelFirstName)
	s.router.HandleFunc("/dashboard/profile/cancel/last-name", s.handleProfileCancelLastName)
	s.router.HandleFunc("/dashboard/profile/cancel/bio", s.handleProfileCancelBio)
	
	// HTMX dashboard registration endpoints
	s.router.HandleFunc("/dashboard/registration/status", s.handleRegistrationStatus)
	s.router.HandleFunc("/dashboard/registration/create", s.handleCreateRegistration)
	
	// HTMX dashboard announcements endpoints
	s.router.HandleFunc("/dashboard/announcements/refresh", s.handleAnnouncementsRefresh)
	
	// JSON API authentication endpoints (for backward compatibility)
	s.router.HandleFunc("/api/auth/register", s.handleRegister)
	s.router.HandleFunc("/api/auth/login", s.handleLogin)
	s.router.HandleFunc("/api/auth/logout", s.handleLogout)
	
	// Root endpoint - redirect to static site home
	s.router.HandleFunc("/", s.handleRoot)
}

// Start starts the HTTP server with middleware
func (s *Server) Start() error {
	// Apply middleware chain
	handler := s.applyMiddleware(s.router)
	
	addr := ":" + s.config.Port
	log.Printf("Starting Compify backend server on port %s (env: %s)", s.config.Port, s.config.Environment)
	
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	return server.ListenAndServe()
}

// applyMiddleware applies the middleware chain to the handler
func (s *Server) applyMiddleware(handler http.Handler) http.Handler {
	// Apply middleware in reverse order (last applied = first executed)
	handler = s.securityHeadersMiddleware(handler)
	handler = s.cachingMiddleware(handler)
	handler = s.corsMiddleware(handler)
	handler = s.loggingMiddleware(handler)
	return handler
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}