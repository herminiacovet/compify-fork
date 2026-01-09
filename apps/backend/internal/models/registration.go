package models

import (
	"encoding/json"
	"errors"
	"time"
)

// Registration represents a user's registration for a competition
type Registration struct {
	ID            string                 `json:"id" db:"id"`
	UserID        string                 `json:"user_id" db:"user_id"`
	CompetitionID string                 `json:"competition_id" db:"competition_id"`
	Status        RegistrationStatus     `json:"status" db:"status"`
	RegisteredAt  time.Time              `json:"registered_at" db:"registered_at"`
	UpdatedAt     time.Time              `json:"updated_at" db:"updated_at"`
	Data          map[string]interface{} `json:"data" db:"data"` // Competition-specific data
}

// RegistrationStatus represents the status of a registration
type RegistrationStatus string

const (
	RegistrationStatusPending   RegistrationStatus = "pending"
	RegistrationStatusConfirmed RegistrationStatus = "confirmed"
	RegistrationStatusCancelled RegistrationStatus = "cancelled"
	RegistrationStatusWaitlist  RegistrationStatus = "waitlist"
)

// RegistrationRepository defines the interface for registration data operations
type RegistrationRepository interface {
	Create(registration *Registration) error
	GetByID(id string) (*Registration, error)
	GetByUserID(userID string) ([]*Registration, error)
	GetByCompetitionID(competitionID string) ([]*Registration, error)
	GetByUserAndCompetition(userID, competitionID string) (*Registration, error)
	Update(registration *Registration) error
	Delete(id string) error
	UpdateStatus(id string, status RegistrationStatus) error
}

// Registration validation errors
var (
	ErrInvalidRegistrationStatus = errors.New("invalid registration status")
	ErrInvalidCompetitionID      = errors.New("invalid competition ID")
	ErrRegistrationExists        = errors.New("registration already exists")
	ErrRegistrationNotFound      = errors.New("registration not found")
)

// Valid registration statuses
var validStatuses = map[RegistrationStatus]bool{
	RegistrationStatusPending:   true,
	RegistrationStatusConfirmed: true,
	RegistrationStatusCancelled: true,
	RegistrationStatusWaitlist:  true,
}

// NewRegistration creates a new registration
func NewRegistration(userID, competitionID string, data map[string]interface{}) *Registration {
	now := time.Now()
	return &Registration{
		UserID:        userID,
		CompetitionID: competitionID,
		Status:        RegistrationStatusPending,
		RegisteredAt:  now,
		UpdatedAt:     now,
		Data:          data,
	}
}

// Validate validates the registration data
func (r *Registration) Validate() error {
	if r.UserID == "" {
		return ErrInvalidUserID
	}
	if r.CompetitionID == "" {
		return ErrInvalidCompetitionID
	}
	if !validStatuses[r.Status] {
		return ErrInvalidRegistrationStatus
	}
	return nil
}

// IsActive checks if the registration is in an active state
func (r *Registration) IsActive() bool {
	return r.Status == RegistrationStatusConfirmed || r.Status == RegistrationStatusPending
}

// IsCancelled checks if the registration is cancelled
func (r *Registration) IsCancelled() bool {
	return r.Status == RegistrationStatusCancelled
}

// IsOnWaitlist checks if the registration is on waitlist
func (r *Registration) IsOnWaitlist() bool {
	return r.Status == RegistrationStatusWaitlist
}

// UpdateStatus updates the registration status and timestamp
func (r *Registration) UpdateStatus(status RegistrationStatus) error {
	if !validStatuses[status] {
		return ErrInvalidRegistrationStatus
	}
	r.Status = status
	r.UpdatedAt = time.Now()
	return nil
}

// SetData sets competition-specific data
func (r *Registration) SetData(key string, value interface{}) {
	if r.Data == nil {
		r.Data = make(map[string]interface{})
	}
	r.Data[key] = value
	r.UpdatedAt = time.Now()
}

// GetData gets competition-specific data
func (r *Registration) GetData(key string) (interface{}, bool) {
	if r.Data == nil {
		return nil, false
	}
	value, exists := r.Data[key]
	return value, exists
}

// GetDataString gets competition-specific data as string
func (r *Registration) GetDataString(key string) (string, bool) {
	value, exists := r.GetData(key)
	if !exists {
		return "", false
	}
	if str, ok := value.(string); ok {
		return str, true
	}
	return "", false
}

// MarshalDataJSON marshals the data field to JSON
func (r *Registration) MarshalDataJSON() ([]byte, error) {
	if r.Data == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(r.Data)
}

// UnmarshalDataJSON unmarshals JSON into the data field
func (r *Registration) UnmarshalDataJSON(data []byte) error {
	if r.Data == nil {
		r.Data = make(map[string]interface{})
	}
	return json.Unmarshal(data, &r.Data)
}