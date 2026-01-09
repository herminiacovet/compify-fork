package repository

import (
	"compify-backend/internal/models"
	"sync"
	"time"
)

// MemorySessionRepository implements SessionRepository using in-memory storage
type MemorySessionRepository struct {
	sessions map[string]*models.Session
	mutex    sync.RWMutex
}

// NewMemorySessionRepository creates a new in-memory session repository
func NewMemorySessionRepository() *MemorySessionRepository {
	return &MemorySessionRepository{
		sessions: make(map[string]*models.Session),
	}
}

// Create creates a new session
func (r *MemorySessionRepository) Create(session *models.Session) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate session data
	if err := session.Validate(); err != nil {
		return err
	}

	// Generate ID if not provided
	if session.ID == "" {
		id, err := generateID()
		if err != nil {
			return err
		}
		session.ID = id
	}

	// Store session
	r.sessions[session.Token] = session

	return nil
}

// GetByToken retrieves a session by token
func (r *MemorySessionRepository) GetByToken(token string) (*models.Session, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	session, exists := r.sessions[token]
	if !exists {
		return nil, models.ErrSessionNotFound
	}

	// Check if session is expired
	if session.IsExpired() {
		return nil, models.ErrSessionExpired
	}

	return session, nil
}

// GetByUserID retrieves all sessions for a user
func (r *MemorySessionRepository) GetByUserID(userID string) ([]*models.Session, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var sessions []*models.Session
	for _, session := range r.sessions {
		if session.UserID == userID && !session.IsExpired() {
			sessions = append(sessions, session)
		}
	}

	return sessions, nil
}

// Update updates a session
func (r *MemorySessionRepository) Update(session *models.Session) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate session data
	if err := session.Validate(); err != nil {
		return err
	}

	// Check if session exists
	if _, exists := r.sessions[session.Token]; !exists {
		return models.ErrSessionNotFound
	}

	// Store session
	r.sessions[session.Token] = session

	return nil
}

// Delete deletes a session by ID
func (r *MemorySessionRepository) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Find session by ID
	for token, session := range r.sessions {
		if session.ID == id {
			delete(r.sessions, token)
			return nil
		}
	}

	return models.ErrSessionNotFound
}

// DeleteByToken deletes a session by token
func (r *MemorySessionRepository) DeleteByToken(token string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.sessions[token]; !exists {
		return models.ErrSessionNotFound
	}

	delete(r.sessions, token)
	return nil
}

// DeleteByUserID deletes all sessions for a user
func (r *MemorySessionRepository) DeleteByUserID(userID string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	tokensToDelete := make([]string, 0)
	for token, session := range r.sessions {
		if session.UserID == userID {
			tokensToDelete = append(tokensToDelete, token)
		}
	}

	for _, token := range tokensToDelete {
		delete(r.sessions, token)
	}

	return nil
}

// DeleteExpired deletes all expired sessions
func (r *MemorySessionRepository) DeleteExpired() error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	tokensToDelete := make([]string, 0)
	now := time.Now()
	
	for token, session := range r.sessions {
		if now.After(session.ExpiresAt) {
			tokensToDelete = append(tokensToDelete, token)
		}
	}

	for _, token := range tokensToDelete {
		delete(r.sessions, token)
	}

	return nil
}