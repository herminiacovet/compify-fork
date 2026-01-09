package auth

import (
	"compify-backend/internal/models"
	"compify-backend/internal/repository"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Service handles authentication operations
type Service struct {
	repos *repository.Repositories
}

// NewService creates a new authentication service
func NewService(repos *repository.Repositories) *Service {
	return &Service{
		repos: repos,
	}
}

// RegistrationRequest represents a user registration request
type RegistrationRequest struct {
	Email           string `json:"email"`
	Username        string `json:"username"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
}

// LoginRequest represents a user login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Validation errors
var (
	ErrPasswordTooShort    = errors.New("password must be at least 8 characters long")
	ErrPasswordsDoNotMatch = errors.New("passwords do not match")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrUserAlreadyExists   = errors.New("user already exists")
)

// Password hashing parameters
const (
	saltLength = 16
	keyLength  = 32
	time       = 1
	memory     = 64 * 1024
	threads    = 4
)

// Register registers a new user
func (s *Service) Register(req *RegistrationRequest, ipAddress, userAgent string) (*models.User, *models.Session, error) {
	// Validate registration request
	if err := s.validateRegistrationRequest(req); err != nil {
		return nil, nil, err
	}

	// Check if user already exists
	if _, err := s.repos.Users.GetByEmail(req.Email); err == nil {
		return nil, nil, ErrUserAlreadyExists
	}
	if _, err := s.repos.Users.GetByUsername(req.Username); err == nil {
		return nil, nil, ErrUserAlreadyExists
	}

	// Hash password
	passwordHash, err := s.hashPassword(req.Password)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: passwordHash,
		Profile: models.Profile{
			FirstName: req.FirstName,
			LastName:  req.LastName,
		},
	}

	// Save user
	if err := s.repos.Users.Create(user); err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Update profile with names
	user.Profile.UserID = user.ID
	if err := s.repos.Users.UpdateProfile(&user.Profile); err != nil {
		return nil, nil, fmt.Errorf("failed to update profile: %w", err)
	}

	// Create session
	session, err := models.NewSession(user.ID, ipAddress, userAgent)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create session: %w", err)
	}

	if err := s.repos.Sessions.Create(session); err != nil {
		return nil, nil, fmt.Errorf("failed to save session: %w", err)
	}

	return user, session, nil
}

// Login authenticates a user and creates a session
func (s *Service) Login(req *LoginRequest, ipAddress, userAgent string) (*models.User, *models.Session, error) {
	// Validate login request
	if err := s.validateLoginRequest(req); err != nil {
		return nil, nil, err
	}

	// Get user by email
	user, err := s.repos.Users.GetByEmail(req.Email)
	if err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	// Verify password
	if !s.verifyPassword(req.Password, user.PasswordHash) {
		return nil, nil, ErrInvalidCredentials
	}

	// Create session
	session, err := models.NewSession(user.ID, ipAddress, userAgent)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create session: %w", err)
	}

	if err := s.repos.Sessions.Create(session); err != nil {
		return nil, nil, fmt.Errorf("failed to save session: %w", err)
	}

	return user, session, nil
}

// Logout invalidates a user session
func (s *Service) Logout(sessionToken string) error {
	if sessionToken == "" {
		return nil // Already logged out
	}

	return s.repos.Sessions.DeleteByToken(sessionToken)
}

// GetUserFromSession retrieves a user from a session token
func (s *Service) GetUserFromSession(sessionToken string) (*models.User, error) {
	if sessionToken == "" {
		return nil, models.ErrSessionNotFound
	}

	// Get session
	session, err := s.repos.Sessions.GetByToken(sessionToken)
	if err != nil {
		return nil, err
	}

	// Get user
	user, err := s.repos.Users.GetByID(session.UserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// GetSessionFromRequest extracts session token from HTTP request
func (s *Service) GetSessionFromRequest(r *http.Request) string {
	// Try cookie first
	if cookie, err := r.Cookie("session_token"); err == nil {
		return cookie.Value
	}

	// Try Authorization header
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	return ""
}

// validateRegistrationRequest validates a registration request
func (s *Service) validateRegistrationRequest(req *RegistrationRequest) error {
	if req.Email == "" {
		return errors.New("email is required")
	}
	if req.Username == "" {
		return errors.New("username is required")
	}
	if req.Password == "" {
		return errors.New("password is required")
	}
	if len(req.Password) < 8 {
		return ErrPasswordTooShort
	}
	if req.Password != req.ConfirmPassword {
		return ErrPasswordsDoNotMatch
	}
	return nil
}

// validateLoginRequest validates a login request
func (s *Service) validateLoginRequest(req *LoginRequest) error {
	if req.Email == "" {
		return errors.New("email is required")
	}
	if req.Password == "" {
		return errors.New("password is required")
	}
	return nil
}

// hashPassword hashes a password using Argon2id
func (s *Service) hashPassword(password string) (string, error) {
	// Generate salt
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Hash password
	hash := argon2.IDKey([]byte(password), salt, time, memory, threads, keyLength)

	// Encode to base64
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	// Format: $argon2id$v=19$m=65536,t=1,p=4$salt$hash
	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", memory, time, threads, saltB64, hashB64), nil
}

// verifyPassword verifies a password against a hash
func (s *Service) verifyPassword(password, hash string) bool {
	// Parse hash format: $argon2id$v=19$m=65536,t=1,p=4$salt$hash
	parts := strings.Split(hash, "$")
	if len(parts) != 6 {
		return false
	}

	if parts[1] != "argon2id" || parts[2] != "v=19" {
		return false
	}

	// Parse parameters
	var m, t, p uint32
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &m, &t, &p); err != nil {
		return false
	}

	// Decode salt and hash
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	// Hash the provided password
	actualHash := argon2.IDKey([]byte(password), salt, t, m, uint8(p), uint32(len(expectedHash)))

	// Compare hashes using constant-time comparison
	return subtle.ConstantTimeCompare(expectedHash, actualHash) == 1
}