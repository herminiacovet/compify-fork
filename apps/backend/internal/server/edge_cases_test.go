package server

import (
	"compify-backend/internal/auth"
	"compify-backend/internal/models"
	"compify-backend/internal/repository"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Test authentication with malformed inputs
func TestAuthenticationMalformedInputs(t *testing.T) {
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

	tests := []struct {
		name           string
		endpoint       string
		method         string
		body           string
		contentType    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Registration with invalid JSON",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test@example.com", "password": "password123"`, // Missing closing brace
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request body",
		},
		{
			name:           "Registration with missing email",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"username": "testuser", "password": "password123", "confirm_password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusInternalServerError, // Server returns 500 for validation errors
			expectedError:  "Registration failed",
		},
		{
			name:           "Registration with empty password",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test@example.com", "username": "testuser", "password": "", "confirm_password": ""}`,
			contentType:    "application/json",
			expectedStatus: http.StatusInternalServerError, // Server returns 500 for validation errors
			expectedError:  "Registration failed",
		},
		{
			name:           "Registration with short password",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test@example.com", "username": "testuser", "password": "123", "confirm_password": "123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Password too short",
		},
		{
			name:           "Registration with mismatched passwords",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test@example.com", "username": "testuser", "password": "password123", "confirm_password": "different123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Passwords do not match",
		},
		{
			name:           "Login with invalid JSON",
			endpoint:       "/api/auth/login",
			method:         "POST",
			body:           `{"email": "test@example.com"`, // Missing closing brace
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request body",
		},
		{
			name:           "Login with missing email",
			endpoint:       "/api/auth/login",
			method:         "POST",
			body:           `{"password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Missing required fields",
		},
		{
			name:           "Login with missing password",
			endpoint:       "/api/auth/login",
			method:         "POST",
			body:           `{"email": "test@example.com"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Missing required fields",
		},
		{
			name:           "Login with non-existent user",
			endpoint:       "/api/auth/login",
			method:         "POST",
			body:           `{"email": "nonexistent@example.com", "password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid credentials",
		},
		{
			name:           "Registration with malformed email",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "not-an-email", "username": "testuser", "password": "password123", "confirm_password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid email format",
		},
		{
			name:           "Registration with SQL injection attempt",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test'; DROP TABLE users; --@example.com", "username": "testuser", "password": "password123", "confirm_password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid email format",
		},
		{
			name:           "Registration with XSS attempt in username",
			endpoint:       "/api/auth/register",
			method:         "POST",
			body:           `{"email": "test@example.com", "username": "<script>alert('xss')</script>", "password": "password123", "confirm_password": "password123"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid username format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.endpoint, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", tt.contentType)
			rec := httptest.NewRecorder()

			server.router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			var response map[string]interface{}
			if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
				t.Fatalf("Failed to parse response JSON: %v", err)
			}

			if errorMsg, ok := response["error"].(string); ok {
				if !strings.Contains(errorMsg, tt.expectedError) {
					t.Errorf("Expected error containing '%s', got '%s'", tt.expectedError, errorMsg)
				}
			} else {
				t.Errorf("Expected error field in response, got: %v", response)
			}
		})
	}
}

// Test HTMX partial updates with network failures and malformed requests
func TestHTMXPartialUpdateFailures(t *testing.T) {
	// Create test server with authenticated user
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

	// Create a test user and session
	user := createTestUser(t, repos)
	session := createTestSession(t, repos, user.ID)

	tests := []struct {
		name           string
		endpoint       string
		method         string
		body           string
		contentType    string
		sessionToken   string
		expectedStatus int
		checkResponse  func(t *testing.T, body string)
	}{
		{
			name:           "Profile update without authentication",
			endpoint:       "/dashboard/profile/update/first-name",
			method:         "POST",
			body:           "first_name=Updated",
			contentType:    "application/x-www-form-urlencoded",
			sessionToken:   "", // No session token
			expectedStatus: http.StatusUnauthorized,
			checkResponse: func(t *testing.T, body string) {
				if !strings.Contains(body, "Unauthorized") {
					t.Errorf("Expected unauthorized error, got: %s", body)
				}
			},
		},
		{
			name:           "Profile update with invalid session",
			endpoint:       "/dashboard/profile/update/first-name",
			method:         "POST",
			body:           "first_name=Updated",
			contentType:    "application/x-www-form-urlencoded",
			sessionToken:   "invalid-session-token",
			expectedStatus: http.StatusUnauthorized,
			checkResponse: func(t *testing.T, body string) {
				if !strings.Contains(body, "Unauthorized") {
					t.Errorf("Expected unauthorized error, got: %s", body)
				}
			},
		},
		{
			name:           "Profile update with malformed form data",
			endpoint:       "/dashboard/profile/update/first-name",
			method:         "POST",
			body:           "invalid%form%data",
			contentType:    "application/x-www-form-urlencoded",
			sessionToken:   session.Token,
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, body string) {
				if !strings.Contains(body, "Invalid form data") {
					t.Errorf("Expected form data error, got: %s", body)
				}
			},
		},
		{
			name:           "Profile update with wrong HTTP method",
			endpoint:       "/dashboard/profile/update/first-name",
			method:         "GET", // Should be POST
			body:           "",
			contentType:    "",
			sessionToken:   session.Token,
			expectedStatus: http.StatusMethodNotAllowed,
			checkResponse: func(t *testing.T, body string) {
				if !strings.Contains(body, "Method not allowed") {
					t.Errorf("Expected method not allowed error, got: %s", body)
				}
			},
		},
		{
			name:           "Profile update with XSS attempt",
			endpoint:       "/dashboard/profile/update/first-name",
			method:         "POST",
			body:           "first_name=<script>alert('xss')</script>",
			contentType:    "application/x-www-form-urlencoded",
			sessionToken:   session.Token,
			expectedStatus: http.StatusOK, // Should succeed but sanitize input
			checkResponse: func(t *testing.T, body string) {
				// Should contain sanitized content, not the script tag
				if strings.Contains(body, "<script>") {
					t.Errorf("XSS content not sanitized: %s", body)
				}
				// Should contain HTML response (HTMX fragment)
				if !strings.Contains(body, "first-name-display") {
					t.Errorf("Expected HTMX fragment response, got: %s", body)
				}
			},
		},
		{
			name:           "Dashboard access without authentication",
			endpoint:       "/dashboard",
			method:         "GET",
			body:           "",
			contentType:    "",
			sessionToken:   "",
			expectedStatus: http.StatusSeeOther, // Redirect to login
			checkResponse: func(t *testing.T, body string) {
				// Should be a redirect, body might be empty
			},
		},
		{
			name:           "Registration status with expired session",
			endpoint:       "/dashboard/registration/status",
			method:         "GET",
			body:           "",
			contentType:    "",
			sessionToken:   "expired-token",
			expectedStatus: http.StatusUnauthorized,
			checkResponse: func(t *testing.T, body string) {
				if !strings.Contains(body, "Unauthorized") {
					t.Errorf("Expected unauthorized error, got: %s", body)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.endpoint, strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			if tt.sessionToken != "" {
				req.AddCookie(&http.Cookie{Name: "session_token", Value: tt.sessionToken})
			}
			rec := httptest.NewRecorder()

			server.router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, rec.Body.String())
			}
		})
	}
}

// Test error handling across all components
func TestErrorHandlingAcrossComponents(t *testing.T) {
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

	tests := []struct {
		name           string
		endpoint       string
		method         string
		expectedStatus int
		checkResponse  func(t *testing.T, response *httptest.ResponseRecorder)
	}{
		{
			name:           "404 for non-existent endpoint",
			endpoint:       "/non-existent-endpoint",
			method:         "GET",
			expectedStatus: http.StatusNotFound,
			checkResponse: func(t *testing.T, rec *httptest.ResponseRecorder) {
				body := rec.Body.String()
				if !strings.Contains(body, "404") || !strings.Contains(body, "Page Not Found") {
					t.Errorf("Expected 404 page, got: %s", body)
				}
				// Should return HTML, not JSON
				contentType := rec.Header().Get("Content-Type")
				if !strings.Contains(contentType, "text/html") {
					t.Errorf("Expected HTML response, got content-type: %s", contentType)
				}
			},
		},
		{
			name:           "Method not allowed for wrong HTTP method",
			endpoint:       "/health",
			method:         "POST", // Should be GET
			expectedStatus: http.StatusMethodNotAllowed,
			checkResponse: func(t *testing.T, rec *httptest.ResponseRecorder) {
				body := rec.Body.String()
				if !strings.Contains(body, "Method not allowed") {
					t.Errorf("Expected method not allowed error, got: %s", body)
				}
			},
		},
		{
			name:           "Health endpoint returns proper JSON",
			endpoint:       "/health",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, rec *httptest.ResponseRecorder) {
				var response map[string]interface{}
				if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
					t.Fatalf("Failed to parse health response JSON: %v", err)
				}
				if response["status"] != "ok" {
					t.Errorf("Expected status 'ok', got: %v", response["status"])
				}
				if response["service"] != "compify-backend" {
					t.Errorf("Expected service 'compify-backend', got: %v", response["service"])
				}
			},
		},
		{
			name:           "Status endpoint returns detailed information",
			endpoint:       "/status",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, rec *httptest.ResponseRecorder) {
				var response map[string]interface{}
				if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
					t.Fatalf("Failed to parse status response JSON: %v", err)
				}
				requiredFields := []string{"status", "service", "version", "environment", "uptime", "go_version", "timestamp", "config"}
				for _, field := range requiredFields {
					if _, exists := response[field]; !exists {
						t.Errorf("Missing required field '%s' in status response", field)
					}
				}
			},
		},
		{
			name:           "Root endpoint redirects properly",
			endpoint:       "/",
			method:         "GET",
			expectedStatus: http.StatusTemporaryRedirect,
			checkResponse: func(t *testing.T, rec *httptest.ResponseRecorder) {
				location := rec.Header().Get("Location")
				if location == "" {
					t.Errorf("Expected redirect location header, got empty")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.endpoint, nil)
			rec := httptest.NewRecorder()

			server.router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			if tt.checkResponse != nil {
				tt.checkResponse(t, rec)
			}
		})
	}
}

// Test concurrent authentication attempts (stress testing)
func TestConcurrentAuthenticationAttempts(t *testing.T) {
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

	// Create a test user first
	user := createTestUser(t, repos)

	// Test concurrent login attempts
	const numConcurrent = 10
	results := make(chan int, numConcurrent)

	for i := 0; i < numConcurrent; i++ {
		go func() {
			body := `{"email": "` + user.Email + `", "password": "password123"}`
			req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			server.router.ServeHTTP(rec, req)
			results <- rec.Code
		}()
	}

	// Collect results
	successCount := 0
	for i := 0; i < numConcurrent; i++ {
		status := <-results
		if status == http.StatusOK {
			successCount++
		}
	}

	// All concurrent requests should succeed
	if successCount != numConcurrent {
		t.Errorf("Expected %d successful logins, got %d", numConcurrent, successCount)
	}
}

// Helper functions for test setup
func createTestUser(t *testing.T, repos *repository.Repositories) *models.User {
	user := &models.User{
		Email:        "test@example.com",
		Username:     "testuser",
		PasswordHash: "$argon2id$v=19$m=65536,t=1,p=4$c29tZXNhbHQ$hashedpassword", // Mock hash
		Profile: models.Profile{
			FirstName: "Test",
			LastName:  "User",
		},
	}
	
	if err := repos.Users.Create(user); err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}
	
	return user
}

func createTestSession(t *testing.T, repos *repository.Repositories, userID string) *models.Session {
	session, err := models.NewSession(userID, "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("Failed to create test session: %v", err)
	}
	
	if err := repos.Sessions.Create(session); err != nil {
		t.Fatalf("Failed to save test session: %v", err)
	}
	
	return session
}