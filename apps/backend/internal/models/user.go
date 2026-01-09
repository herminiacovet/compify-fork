package models

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

// User represents a user in the system
type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	Profile      Profile   `json:"profile"`
}

// Profile represents user profile information
type Profile struct {
	UserID    string `json:"user_id" db:"user_id"`
	FirstName string `json:"first_name" db:"first_name"`
	LastName  string `json:"last_name" db:"last_name"`
	Bio       string `json:"bio" db:"bio"`
	AvatarURL string `json:"avatar_url" db:"avatar_url"`
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *User) error
	GetByID(id string) (*User, error)
	GetByEmail(email string) (*User, error)
	GetByUsername(username string) (*User, error)
	Update(user *User) error
	Delete(id string) error
	UpdateProfile(profile *Profile) error
	GetProfile(userID string) (*Profile, error)
}

// Validation errors
var (
	ErrInvalidEmail    = errors.New("invalid email format")
	ErrInvalidUsername = errors.New("invalid username format")
	ErrEmailTooLong    = errors.New("email too long")
	ErrUsernameTooLong = errors.New("username too long")
	ErrBioTooLong      = errors.New("bio too long")
	ErrNameTooLong     = errors.New("name too long")
)

// Email validation regex
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// Username validation regex (alphanumeric, underscore, hyphen, 3-30 chars)
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,30}$`)

// Validate validates the user data
func (u *User) Validate() error {
	// Email validation
	if u.Email == "" {
		return errors.New("email is required")
	}
	if len(u.Email) > 255 {
		return ErrEmailTooLong
	}
	if !emailRegex.MatchString(u.Email) {
		return ErrInvalidEmail
	}

	// Username validation
	if u.Username == "" {
		return errors.New("username is required")
	}
	if len(u.Username) > 30 {
		return ErrUsernameTooLong
	}
	if !usernameRegex.MatchString(u.Username) {
		return ErrInvalidUsername
	}

	return nil
}

// Sanitize sanitizes user input data
func (u *User) Sanitize() {
	u.Email = strings.TrimSpace(strings.ToLower(u.Email))
	u.Username = strings.TrimSpace(u.Username)
}

// Validate validates the profile data
func (p *Profile) Validate() error {
	if len(p.FirstName) > 100 {
		return ErrNameTooLong
	}
	if len(p.LastName) > 100 {
		return ErrNameTooLong
	}
	if len(p.Bio) > 1000 {
		return ErrBioTooLong
	}
	return nil
}

// Sanitize sanitizes profile input data
func (p *Profile) Sanitize() {
	p.FirstName = strings.TrimSpace(p.FirstName)
	p.LastName = strings.TrimSpace(p.LastName)
	p.Bio = strings.TrimSpace(p.Bio)
	p.AvatarURL = strings.TrimSpace(p.AvatarURL)
}

// FullName returns the user's full name
func (p *Profile) FullName() string {
	name := strings.TrimSpace(p.FirstName + " " + p.LastName)
	if name == "" {
		return "Anonymous User"
	}
	return name
}