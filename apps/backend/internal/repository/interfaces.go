package repository

import "compify-backend/internal/models"

// Repositories aggregates all repository interfaces
type Repositories struct {
	Users         models.UserRepository
	Sessions      models.SessionRepository
	Registrations models.RegistrationRepository
	Announcements models.AnnouncementRepository
}

// NewRepositories creates a new repositories instance
// For MVP, we'll use in-memory implementations
func NewRepositories() *Repositories {
	return &Repositories{
		Users:         NewMemoryUserRepository(),
		Sessions:      NewMemorySessionRepository(),
		Registrations: NewMemoryRegistrationRepository(),
		Announcements: NewMemoryAnnouncementRepository(),
	}
}