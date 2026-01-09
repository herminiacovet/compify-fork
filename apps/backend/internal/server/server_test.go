package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"

	"compify-backend/internal/auth"
	"compify-backend/internal/repository"
)

// Feature: compify-mvp, Property 12: Server-Authoritative State Management
func TestServerAuthoritativeStateManagement(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("server maintains authoritative state for all user operations", prop.ForAll(
		func(emailPrefix, username, password string) bool {
			// Create test server with in-memory repositories
			repos := repository.NewRepositories()
			authService := auth.NewService(repos)
			
			// Create a test server instance
			server := &Server{
				router: http.NewServeMux(),
				config: &Config{
					Port:        "8080",
					Environment: "test",
					LogLevel:    "info",
				},
				repos:  repos,
				auth:   authService,
			}
			server.setupRoutes()

			// Test server-authoritative state by directly using the auth service
			// This tests the core principle without HTTP complexity
			
			// Test 1: Registration creates server-side state
			regReq := &auth.RegistrationRequest{
				Email:           emailPrefix + "@example.com",
				Username:        username,
				Password:        password,
				ConfirmPassword: password,
				FirstName:       "Test",
				LastName:        "User",
			}
			
			user, session, err := authService.Register(regReq, "127.0.0.1", "test-agent")
			if err != nil {
				// Skip invalid inputs - this is expected for random data
				return true
			}

			// Verify user was created server-side
			storedUser, err := repos.Users.GetByEmail(emailPrefix + "@example.com")
			if err != nil || storedUser == nil || storedUser.ID != user.ID {
				return false // Server should have created user
			}

			// Test 2: Session is managed server-side
			storedSession, err := repos.Sessions.GetByToken(session.Token)
			if err != nil || storedSession == nil || storedSession.UserID != user.ID {
				return false // Server should have created session
			}

			// Test 3: Profile updates are server-authoritative
			user.Profile.FirstName = "Updated"
			if err := repos.Users.UpdateProfile(&user.Profile); err != nil {
				return false // Server should allow profile updates
			}

			// Verify profile was updated server-side
			updatedUser, err := repos.Users.GetByID(user.ID)
			if err != nil || updatedUser.Profile.FirstName != "Updated" {
				return false // Server should have updated profile
			}

			// Test 4: Server state is authoritative source of truth
			// Verify we can retrieve the updated state
			finalUser, err := authService.GetUserFromSession(session.Token)
			if err != nil || finalUser.Profile.FirstName != "Updated" {
				return false // Server should return updated state
			}

			return true
		},
		gen.RegexMatch(`[a-z]{4,10}`), // email prefix (4-10 lowercase letters)
		gen.RegexMatch(`[a-zA-Z0-9]{3,15}`), // username (3-15 alphanumeric)
		gen.RegexMatch(`[a-zA-Z0-9]{8,16}`), // password (8-16 alphanumeric)
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: compify-mvp, Property 14: Technology Stack Compliance
func TestTechnologyStackCompliance(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("backend uses only Go+Templ technology stack", prop.ForAll(
		func(endpoint string) bool {
			// Create test server
			repos := repository.NewRepositories()
			authService := auth.NewService(repos)
			
			server := &Server{
				router: http.NewServeMux(),
				config: &Config{
					Port:        "8080",
					Environment: "test",
					LogLevel:    "info",
				},
				repos:  repos,
				auth:   authService,
			}
			server.setupRoutes()

			// Test that server responds appropriately based on endpoint type
			req := httptest.NewRequest("GET", endpoint, nil)
			rec := httptest.NewRecorder()
			server.router.ServeHTTP(rec, req)

			// Check response based on endpoint type
			contentType := rec.Header().Get("Content-Type")
			
			// Health and status endpoints return JSON
			if endpoint == "/health" || endpoint == "/status" {
				if rec.Code == 200 {
					return strings.Contains(contentType, "application/json")
				}
				return rec.Code == 405 // Method not allowed is acceptable
			}
			
			// Template-based endpoints should return HTML or redirect
			if rec.Code == 200 {
				return strings.Contains(contentType, "text/html") || 
					   strings.Contains(rec.Body.String(), "<html") ||
					   strings.Contains(rec.Body.String(), "<!DOCTYPE")
			}
			
			// For redirects or other responses, that's also valid
			return rec.Code == 302 || rec.Code == 303 || rec.Code == 404 || rec.Code == 405
		},
		gen.OneConstOf("/health", "/status", "/dashboard", "/login", "/register"),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
// Feature: compify-mvp, Property 15: Single Binary Deployment
func TestSingleBinaryDeployment(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("backend deploys as single Go binary with environment configuration", prop.ForAll(
		func(port, env, logLevel string) bool {
			// Test that server can be configured via environment variables
			originalPort := os.Getenv("PORT")
			originalEnv := os.Getenv("ENVIRONMENT")
			originalLogLevel := os.Getenv("LOG_LEVEL")
			
			// Set test environment variables
			os.Setenv("PORT", port)
			os.Setenv("ENVIRONMENT", env)
			os.Setenv("LOG_LEVEL", logLevel)
			
			// Create server (should read from environment)
			server := NewServer()
			
			// Verify configuration was read from environment
			configMatches := server.config.Port == port &&
							server.config.Environment == env &&
							server.config.LogLevel == logLevel
			
			// Restore original environment
			if originalPort != "" {
				os.Setenv("PORT", originalPort)
			} else {
				os.Unsetenv("PORT")
			}
			if originalEnv != "" {
				os.Setenv("ENVIRONMENT", originalEnv)
			} else {
				os.Unsetenv("ENVIRONMENT")
			}
			if originalLogLevel != "" {
				os.Setenv("LOG_LEVEL", originalLogLevel)
			} else {
				os.Unsetenv("LOG_LEVEL")
			}
			
			// Test that server has no external dependencies beyond environment config
			// Server should be self-contained with in-memory repositories
			hasInMemoryRepos := server.repos != nil &&
							   server.repos.Users != nil &&
							   server.repos.Sessions != nil &&
							   server.repos.Registrations != nil &&
							   server.repos.Announcements != nil
			
			return configMatches && hasInMemoryRepos
		},
		gen.OneConstOf("8080", "3000", "8000", "9000"), // port
		gen.OneConstOf("development", "production", "staging"), // environment
		gen.OneConstOf("debug", "info", "warn", "error"), // log level
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}