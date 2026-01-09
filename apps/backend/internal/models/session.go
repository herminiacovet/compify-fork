package models

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"
)

// Session represents a user session
type Session struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
}

// SessionRepository defines the interface for session data operations
type SessionRepository interface {
	Create(session *Session) error
	GetByToken(token string) (*Session, error)
	GetByUserID(userID string) ([]*Session, error)
	Update(session *Session) error
	Delete(id string) error
	DeleteByToken(token string) error
	DeleteByUserID(userID string) error
	DeleteExpired() error
}

// Session validation errors
var (
	ErrInvalidToken     = errors.New("invalid session token")
	ErrSessionExpired   = errors.New("session has expired")
	ErrSessionNotFound  = errors.New("session not found")
	ErrInvalidUserID    = errors.New("invalid user ID")
)

// Default session duration
const DefaultSessionDuration = 24 * time.Hour * 7 // 7 days

// NewSession creates a new session with a random token
func NewSession(userID, ipAddress, userAgent string) (*Session, error) {
	if userID == "" {
		return nil, ErrInvalidUserID
	}

	token, err := generateSecureToken()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	session := &Session{
		UserID:    userID,
		Token:     token,
		ExpiresAt: now.Add(DefaultSessionDuration),
		CreatedAt: now,
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	return session, nil
}

// IsExpired checks if the session has expired
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsValid checks if the session is valid (not expired and has valid token)
func (s *Session) IsValid() bool {
	return !s.IsExpired() && s.Token != ""
}

// Extend extends the session expiration time
func (s *Session) Extend(duration time.Duration) {
	s.ExpiresAt = time.Now().Add(duration)
}

// ExtendDefault extends the session with default duration
func (s *Session) ExtendDefault() {
	s.Extend(DefaultSessionDuration)
}

// Validate validates the session data
func (s *Session) Validate() error {
	if s.UserID == "" {
		return ErrInvalidUserID
	}
	if s.Token == "" {
		return ErrInvalidToken
	}
	if s.IsExpired() {
		return ErrSessionExpired
	}
	return nil
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken() (string, error) {
	bytes := make([]byte, 32) // 256 bits
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}