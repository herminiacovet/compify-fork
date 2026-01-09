package repository

import (
	"compify-backend/internal/models"
	"sync"
)

// MemoryRegistrationRepository implements RegistrationRepository using in-memory storage
type MemoryRegistrationRepository struct {
	registrations map[string]*models.Registration
	mutex         sync.RWMutex
}

// NewMemoryRegistrationRepository creates a new in-memory registration repository
func NewMemoryRegistrationRepository() *MemoryRegistrationRepository {
	return &MemoryRegistrationRepository{
		registrations: make(map[string]*models.Registration),
	}
}

// Create creates a new registration
func (r *MemoryRegistrationRepository) Create(registration *models.Registration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate registration data
	if err := registration.Validate(); err != nil {
		return err
	}

	// Check if registration already exists for this user and competition
	for _, existing := range r.registrations {
		if existing.UserID == registration.UserID && existing.CompetitionID == registration.CompetitionID {
			return models.ErrRegistrationExists
		}
	}

	// Generate ID if not provided
	if registration.ID == "" {
		id, err := generateID()
		if err != nil {
			return err
		}
		registration.ID = id
	}

	// Store registration
	r.registrations[registration.ID] = registration

	return nil
}

// GetByID retrieves a registration by ID
func (r *MemoryRegistrationRepository) GetByID(id string) (*models.Registration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	registration, exists := r.registrations[id]
	if !exists {
		return nil, models.ErrRegistrationNotFound
	}

	return registration, nil
}

// GetByUserID retrieves all registrations for a user
func (r *MemoryRegistrationRepository) GetByUserID(userID string) ([]*models.Registration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var registrations []*models.Registration
	for _, registration := range r.registrations {
		if registration.UserID == userID {
			registrations = append(registrations, registration)
		}
	}

	return registrations, nil
}

// GetByCompetitionID retrieves all registrations for a competition
func (r *MemoryRegistrationRepository) GetByCompetitionID(competitionID string) ([]*models.Registration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var registrations []*models.Registration
	for _, registration := range r.registrations {
		if registration.CompetitionID == competitionID {
			registrations = append(registrations, registration)
		}
	}

	return registrations, nil
}

// GetByUserAndCompetition retrieves a registration for a specific user and competition
func (r *MemoryRegistrationRepository) GetByUserAndCompetition(userID, competitionID string) (*models.Registration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, registration := range r.registrations {
		if registration.UserID == userID && registration.CompetitionID == competitionID {
			return registration, nil
		}
	}

	return nil, models.ErrRegistrationNotFound
}

// Update updates a registration
func (r *MemoryRegistrationRepository) Update(registration *models.Registration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate registration data
	if err := registration.Validate(); err != nil {
		return err
	}

	// Check if registration exists
	if _, exists := r.registrations[registration.ID]; !exists {
		return models.ErrRegistrationNotFound
	}

	// Store registration
	r.registrations[registration.ID] = registration

	return nil
}

// Delete deletes a registration
func (r *MemoryRegistrationRepository) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.registrations[id]; !exists {
		return models.ErrRegistrationNotFound
	}

	delete(r.registrations, id)
	return nil
}

// UpdateStatus updates the status of a registration
func (r *MemoryRegistrationRepository) UpdateStatus(id string, status models.RegistrationStatus) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	registration, exists := r.registrations[id]
	if !exists {
		return models.ErrRegistrationNotFound
	}

	if err := registration.UpdateStatus(status); err != nil {
		return err
	}

	return nil
}