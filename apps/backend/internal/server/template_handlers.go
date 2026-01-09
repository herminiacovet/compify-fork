package server

import (
	"compify-backend/internal/auth"
	"compify-backend/internal/templates"
	"net/http"
	"strings"
)

// handleLoginPage renders the login page
func (s *Server) handleLoginPage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if user is already authenticated
	if sessionToken := s.auth.GetSessionFromRequest(r); sessionToken != "" {
		if _, err := s.auth.GetUserFromSession(sessionToken); err == nil {
			http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
			return
		}
	}

	// Get error message from query params if any
	errorMessage := r.URL.Query().Get("error")

	w.Header().Set("Content-Type", "text/html")
	templates.LoginPage(errorMessage).Render(r.Context(), w)
}

// handleRegisterPage renders the registration page
func (s *Server) handleRegisterPage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if user is already authenticated
	if sessionToken := s.auth.GetSessionFromRequest(r); sessionToken != "" {
		if _, err := s.auth.GetUserFromSession(sessionToken); err == nil {
			http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
			return
		}
	}

	// Get error message from query params if any
	errorMessage := r.URL.Query().Get("error")

	w.Header().Set("Content-Type", "text/html")
	templates.RegisterPage(errorMessage).Render(r.Context(), w)
}

// handleLoginForm handles HTMX login form submission
func (s *Server) handleLoginForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		w.Header().Set("Content-Type", "text/html")
		templates.LoginFormError("Invalid form data").Render(r.Context(), w)
		return
	}

	// Create login request from form data
	req := &auth.LoginRequest{
		Email:    strings.TrimSpace(r.FormValue("email")),
		Password: r.FormValue("password"),
	}

	// Get client info
	ipAddress := s.getClientIP(r)
	userAgent := r.UserAgent()

	// Login user
	_, session, err := s.auth.Login(req, ipAddress, userAgent)
	if err != nil {
		var errorMessage string
		switch err {
		case auth.ErrInvalidCredentials:
			errorMessage = "Invalid email or password"
		default:
			if strings.Contains(err.Error(), "email is required") || strings.Contains(err.Error(), "password is required") {
				errorMessage = "Please fill in all required fields"
			} else {
				errorMessage = "Login failed. Please try again."
			}
		}

		w.Header().Set("Content-Type", "text/html")
		templates.LoginFormError(errorMessage).Render(r.Context(), w)
		return
	}

	// Set session cookie
	s.setSessionCookie(w, session.Token)

	// Return success response
	w.Header().Set("Content-Type", "text/html")
	templates.LoginSuccess().Render(r.Context(), w)
}

// handleRegisterForm handles HTMX registration form submission
func (s *Server) handleRegisterForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		w.Header().Set("Content-Type", "text/html")
		templates.RegisterFormError("Invalid form data").Render(r.Context(), w)
		return
	}

	// Create registration request from form data
	req := &auth.RegistrationRequest{
		Email:           strings.TrimSpace(r.FormValue("email")),
		Username:        strings.TrimSpace(r.FormValue("username")),
		Password:        r.FormValue("password"),
		ConfirmPassword: r.FormValue("confirm_password"),
	}

	// Get client info
	ipAddress := s.getClientIP(r)
	userAgent := r.UserAgent()

	// Register user
	_, session, err := s.auth.Register(req, ipAddress, userAgent)
	if err != nil {
		var errorMessage string
		switch err {
		case auth.ErrUserAlreadyExists:
			errorMessage = "User already exists"
		case auth.ErrPasswordTooShort:
			errorMessage = "Password must be at least 8 characters long"
		case auth.ErrPasswordsDoNotMatch:
			errorMessage = "Passwords do not match"
		default:
			if strings.Contains(err.Error(), "email already exists") {
				errorMessage = "Email is already registered"
			} else if strings.Contains(err.Error(), "username already exists") {
				errorMessage = "Username is already taken"
			} else if strings.Contains(err.Error(), "invalid email") {
				errorMessage = "Please enter a valid email address"
			} else if strings.Contains(err.Error(), "invalid username") {
				errorMessage = "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
			} else {
				errorMessage = "Registration failed. Please try again."
			}
		}

		w.Header().Set("Content-Type", "text/html")
		templates.RegisterFormError(errorMessage).Render(r.Context(), w)
		return
	}

	// Set session cookie
	s.setSessionCookie(w, session.Token)

	// Return success response
	w.Header().Set("Content-Type", "text/html")
	templates.RegisterSuccess().Render(r.Context(), w)
}

// handleLogoutForm handles logout (can be called via HTMX or regular form)
func (s *Server) handleLogoutForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
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

	// Check if this is an HTMX request
	if r.Header.Get("HX-Request") == "true" {
		// For HTMX requests, return a redirect header
		w.Header().Set("HX-Redirect", "/login")
		w.WriteHeader(http.StatusOK)
		return
	}

	// For regular requests, redirect to login page
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}