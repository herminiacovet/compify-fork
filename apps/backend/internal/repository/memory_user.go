package repository

import (
	"compify-backend/internal/models"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

// MemoryUserRepository implements UserRepository using in-memory storage
type MemoryUserRepository struct {
	users    map[string]*models.User
	profiles map[string]*models.Profile
	mutex    sync.RWMutex
}

// NewMemoryUserRepository creates a new in-memory user repository
func NewMemoryUserRepository() *MemoryUserRepository {
	return &MemoryUserRepository{
		users:    make(map[string]*models.User),
		profiles: make(map[string]*models.Profile),
	}
}

// Create creates a new user
func (r *MemoryUserRepository) Create(user *models.User) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate user data
	if err := user.Validate(); err != nil {
		return err
	}

	// Sanitize user data
	user.Sanitize()

	// Check if email already exists
	for _, existingUser := range r.users {
		if existingUser.Email == user.Email {
			return errors.New("email already exists")
		}
		if existingUser.Username == user.Username {
			return errors.New("username already exists")
		}
	}

	// Generate ID if not provided
	if user.ID == "" {
		id, err := generateID()
		if err != nil {
			return err
		}
		user.ID = id
	}

	// Set timestamps
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Store user
	r.users[user.ID] = user

	// Create empty profile
	profile := &models.Profile{
		UserID: user.ID,
	}
	r.profiles[user.ID] = profile
	user.Profile = *profile

	return nil
}

// GetByID retrieves a user by ID
func (r *MemoryUserRepository) GetByID(id string) (*models.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, errors.New("user not found")
	}

	// Load profile
	if profile, exists := r.profiles[id]; exists {
		user.Profile = *profile
	}

	return user, nil
}

// GetByEmail retrieves a user by email
func (r *MemoryUserRepository) GetByEmail(email string) (*models.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			// Load profile
			if profile, exists := r.profiles[user.ID]; exists {
				user.Profile = *profile
			}
			return user, nil
		}
	}

	return nil, errors.New("user not found")
}

// GetByUsername retrieves a user by username
func (r *MemoryUserRepository) GetByUsername(username string) (*models.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, user := range r.users {
		if user.Username == username {
			// Load profile
			if profile, exists := r.profiles[user.ID]; exists {
				user.Profile = *profile
			}
			return user, nil
		}
	}

	return nil, errors.New("user not found")
}

// Update updates a user
func (r *MemoryUserRepository) Update(user *models.User) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate user data
	if err := user.Validate(); err != nil {
		return err
	}

	// Sanitize user data
	user.Sanitize()

	// Check if user exists
	if _, exists := r.users[user.ID]; !exists {
		return errors.New("user not found")
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	// Store user
	r.users[user.ID] = user

	return nil
}

// Delete deletes a user
func (r *MemoryUserRepository) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.users[id]; !exists {
		return errors.New("user not found")
	}

	delete(r.users, id)
	delete(r.profiles, id)

	return nil
}

// UpdateProfile updates a user's profile
func (r *MemoryUserRepository) UpdateProfile(profile *models.Profile) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate profile data
	if err := profile.Validate(); err != nil {
		return err
	}

	// Sanitize profile data
	profile.Sanitize()

	// Check if user exists
	if _, exists := r.users[profile.UserID]; !exists {
		return errors.New("user not found")
	}

	// Store profile
	r.profiles[profile.UserID] = profile

	return nil
}

// GetProfile retrieves a user's profile
func (r *MemoryUserRepository) GetProfile(userID string) (*models.Profile, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	profile, exists := r.profiles[userID]
	if !exists {
		return nil, errors.New("profile not found")
	}

	return profile, nil
}

// generateID generates a random ID
func generateID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}