package server

import (
	"compify-backend/internal/models"
	"compify-backend/internal/templates"
	"net/http"
	"strings"
	"time"
)

// handleDashboard renders the main dashboard page
func (s *Server) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check authentication
	sessionToken := s.auth.GetSessionFromRequest(r)
	if sessionToken == "" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	user, err := s.auth.GetUserFromSession(sessionToken)
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Get dashboard data
	dashboardData, err := s.getDashboardData(user)
	if err != nil {
		http.Error(w, "Failed to load dashboard data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.DashboardPage(*dashboardData).Render(r.Context(), w)
}

// handleProfileEditFirstName renders the first name edit form
func (s *Server) handleProfileEditFirstName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.FirstNameEditForm(user.Profile.FirstName).Render(r.Context(), w)
}

// handleProfileEditLastName renders the last name edit form
func (s *Server) handleProfileEditLastName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.LastNameEditForm(user.Profile.LastName).Render(r.Context(), w)
}

// handleProfileEditBio renders the bio edit form
func (s *Server) handleProfileEditBio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.BioEditForm(user.Profile.Bio).Render(r.Context(), w)
}

// handleProfileUpdateFirstName updates the first name
func (s *Server) handleProfileUpdateFirstName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	firstName := strings.TrimSpace(r.FormValue("first_name"))
	
	// Update profile
	user.Profile.FirstName = firstName
	user.Profile.Sanitize()
	
	if err := user.Profile.Validate(); err != nil {
		// Return error in the form
		w.Header().Set("Content-Type", "text/html")
		templates.FirstNameEditForm(firstName).Render(r.Context(), w)
		return
	}

	// Save to repository
	if err := s.repos.Users.UpdateProfile(&user.Profile); err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Return updated display
	w.Header().Set("Content-Type", "text/html")
	templates.FirstNameDisplay(firstName).Render(r.Context(), w)
}

// handleProfileUpdateLastName updates the last name
func (s *Server) handleProfileUpdateLastName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	lastName := strings.TrimSpace(r.FormValue("last_name"))
	
	// Update profile
	user.Profile.LastName = lastName
	user.Profile.Sanitize()
	
	if err := user.Profile.Validate(); err != nil {
		// Return error in the form
		w.Header().Set("Content-Type", "text/html")
		templates.LastNameEditForm(lastName).Render(r.Context(), w)
		return
	}

	// Save to repository
	if err := s.repos.Users.UpdateProfile(&user.Profile); err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Return updated display
	w.Header().Set("Content-Type", "text/html")
	templates.LastNameDisplay(lastName).Render(r.Context(), w)
}

// handleProfileUpdateBio updates the bio
func (s *Server) handleProfileUpdateBio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	bio := strings.TrimSpace(r.FormValue("bio"))
	
	// Update profile
	user.Profile.Bio = bio
	user.Profile.Sanitize()
	
	if err := user.Profile.Validate(); err != nil {
		// Return error in the form
		w.Header().Set("Content-Type", "text/html")
		templates.BioEditForm(bio).Render(r.Context(), w)
		return
	}

	// Save to repository
	if err := s.repos.Users.UpdateProfile(&user.Profile); err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Return updated display
	w.Header().Set("Content-Type", "text/html")
	templates.BioDisplay(bio).Render(r.Context(), w)
}

// handleProfileCancelFirstName cancels first name editing
func (s *Server) handleProfileCancelFirstName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.FirstNameDisplay(user.Profile.FirstName).Render(r.Context(), w)
}

// handleProfileCancelLastName cancels last name editing
func (s *Server) handleProfileCancelLastName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.LastNameDisplay(user.Profile.LastName).Render(r.Context(), w)
}

// handleProfileCancelBio cancels bio editing
func (s *Server) handleProfileCancelBio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	templates.BioDisplay(user.Profile.Bio).Render(r.Context(), w)
}

// handleRegistrationStatus renders the registration status section
func (s *Server) handleRegistrationStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get user's registrations
	registrations, err := s.repos.Registrations.GetByUserID(user.ID)
	if err != nil {
		registrations = []*models.Registration{}
	}

	// For MVP, show the most recent registration (if any)
	var registration *models.Registration
	if len(registrations) > 0 {
		registration = registrations[0]
		for _, reg := range registrations {
			if reg.RegisteredAt.After(registration.RegisteredAt) {
				registration = reg
			}
		}
	}

	w.Header().Set("Content-Type", "text/html")
	templates.RegistrationSection(registration).Render(r.Context(), w)
}

// handleCreateRegistration creates a new registration for the user
func (s *Server) handleCreateRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	competitionID := r.FormValue("competition_id")
	if competitionID == "" {
		// For MVP, use a default competition ID
		competitionID = "compify-2024"
	}

	// Check if user already has a registration for this competition
	existing, err := s.repos.Registrations.GetByUserAndCompetition(user.ID, competitionID)
	if err == nil && existing != nil {
		// User already registered, return current status
		w.Header().Set("Content-Type", "text/html")
		templates.RegistrationSection(existing).Render(r.Context(), w)
		return
	}

	// Create new registration
	registration := models.NewRegistration(user.ID, competitionID, map[string]interface{}{
		"registration_type": "individual",
		"team_name":        "",
	})

	if err := s.repos.Registrations.Create(registration); err != nil {
		http.Error(w, "Failed to create registration", http.StatusInternalServerError)
		return
	}

	// Return updated registration section
	w.Header().Set("Content-Type", "text/html")
	templates.RegistrationSection(registration).Render(r.Context(), w)
}

// handleAnnouncementsRefresh refreshes the announcements section
func (s *Server) handleAnnouncementsRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Authentication not strictly required for announcements, but let's check anyway
	_, err := s.getAuthenticatedUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get announcements
	announcements, err := s.repos.Announcements.GetPublished()
	if err != nil {
		announcements = []*models.Announcement{}
	}

	// Convert to slice of values instead of pointers
	announcementValues := make([]models.Announcement, len(announcements))
	for i, a := range announcements {
		announcementValues[i] = *a
	}

	w.Header().Set("Content-Type", "text/html")
	templates.AnnouncementsSection(announcementValues).Render(r.Context(), w)
}

// initializeSampleData creates some sample announcements for demonstration
func (s *Server) initializeSampleData() {
	// Create sample announcements if none exist
	existing, _ := s.repos.Announcements.GetPublished()
	if len(existing) == 0 {
		announcements := []*models.Announcement{
			models.NewAnnouncement(
				"Welcome to Compify 2024!",
				"We're excited to announce the launch of Compify 2024. Registration is now open for all participants. Check out the rules and timeline for more details.",
				models.AnnouncementPriorityHigh,
			),
			models.NewAnnouncement(
				"Registration Deadline Reminder",
				"Don't forget that registration closes on March 15th, 2024. Make sure to complete your profile and submit your registration before the deadline.",
				models.AnnouncementPriorityMedium,
			),
			models.NewAnnouncement(
				"New Sponsor Announcement",
				"We're thrilled to welcome TechCorp as our platinum sponsor for Compify 2024. Their support makes this competition possible!",
				models.AnnouncementPriorityLow,
			),
		}

		for _, announcement := range announcements {
			s.repos.Announcements.Create(announcement)
			s.repos.Announcements.Publish(announcement.ID)
		}
	}
}

// Helper methods

// getAuthenticatedUser gets the authenticated user from the request
func (s *Server) getAuthenticatedUser(r *http.Request) (*models.User, error) {
	sessionToken := s.auth.GetSessionFromRequest(r)
	if sessionToken == "" {
		return nil, http.ErrNoCookie
	}

	return s.auth.GetUserFromSession(sessionToken)
}

// getDashboardData assembles all data needed for the dashboard
func (s *Server) getDashboardData(user *models.User) (*models.DashboardData, error) {
	// Get user's registrations
	registrations, err := s.repos.Registrations.GetByUserID(user.ID)
	if err != nil {
		// Log error but don't fail - just show no registrations
		registrations = []*models.Registration{}
	}

	// For MVP, we'll show the most recent registration (if any)
	var registration *models.Registration
	if len(registrations) > 0 {
		// Find the most recent registration
		registration = registrations[0]
		for _, reg := range registrations {
			if reg.RegisteredAt.After(registration.RegisteredAt) {
				registration = reg
			}
		}
	}
	
	// Get announcements
	announcements, err := s.repos.Announcements.GetPublished()
	if err != nil {
		// Log error but don't fail - just show empty announcements
		announcements = []*models.Announcement{}
	}

	// Convert to slice of values instead of pointers
	announcementValues := make([]models.Announcement, len(announcements))
	for i, a := range announcements {
		announcementValues[i] = *a
	}

	// Get user stats
	stats := models.NewUserStats(*user, len(registrations), time.Now())

	return &models.DashboardData{
		User:          *user,
		Registration:  registration,
		Announcements: announcementValues,
		Stats:         stats,
	}, nil
}