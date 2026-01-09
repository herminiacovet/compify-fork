package models

import (
	"errors"
	"time"
)

// DashboardData represents the data displayed on the user dashboard
type DashboardData struct {
	User          User           `json:"user"`
	Registration  *Registration  `json:"registration"`
	Announcements []Announcement `json:"announcements"`
	Stats         UserStats      `json:"stats"`
}

// Announcement represents a competition announcement
type Announcement struct {
	ID        string              `json:"id" db:"id"`
	Title     string              `json:"title" db:"title"`
	Content   string              `json:"content" db:"content"`
	Priority  AnnouncementPriority `json:"priority" db:"priority"`
	CreatedAt time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt time.Time           `json:"updated_at" db:"updated_at"`
	Published bool                `json:"published" db:"published"`
}

// AnnouncementPriority represents the priority level of an announcement
type AnnouncementPriority string

const (
	AnnouncementPriorityLow    AnnouncementPriority = "low"
	AnnouncementPriorityMedium AnnouncementPriority = "medium"
	AnnouncementPriorityHigh   AnnouncementPriority = "high"
	AnnouncementPriorityUrgent AnnouncementPriority = "urgent"
)

// UserStats represents user statistics for the dashboard
type UserStats struct {
	RegistrationCount int       `json:"registration_count"`
	LastLoginAt       time.Time `json:"last_login_at"`
	ProfileComplete   bool      `json:"profile_complete"`
	AccountAge        int       `json:"account_age_days"`
}

// AnnouncementRepository defines the interface for announcement data operations
type AnnouncementRepository interface {
	Create(announcement *Announcement) error
	GetByID(id string) (*Announcement, error)
	GetPublished() ([]*Announcement, error)
	GetByPriority(priority AnnouncementPriority) ([]*Announcement, error)
	Update(announcement *Announcement) error
	Delete(id string) error
	Publish(id string) error
	Unpublish(id string) error
}

// Valid announcement priorities
var validPriorities = map[AnnouncementPriority]bool{
	AnnouncementPriorityLow:    true,
	AnnouncementPriorityMedium: true,
	AnnouncementPriorityHigh:   true,
	AnnouncementPriorityUrgent: true,
}

// NewAnnouncement creates a new announcement
func NewAnnouncement(title, content string, priority AnnouncementPriority) *Announcement {
	now := time.Now()
	return &Announcement{
		Title:     title,
		Content:   content,
		Priority:  priority,
		CreatedAt: now,
		UpdatedAt: now,
		Published: false,
	}
}

// Validate validates the announcement data
func (a *Announcement) Validate() error {
	if a.Title == "" {
		return errors.New("title is required")
	}
	if len(a.Title) > 200 {
		return errors.New("title too long")
	}
	if a.Content == "" {
		return errors.New("content is required")
	}
	if len(a.Content) > 5000 {
		return errors.New("content too long")
	}
	if !validPriorities[a.Priority] {
		return errors.New("invalid priority")
	}
	return nil
}

// IsUrgent checks if the announcement is urgent
func (a *Announcement) IsUrgent() bool {
	return a.Priority == AnnouncementPriorityUrgent
}

// IsHigh checks if the announcement is high priority
func (a *Announcement) IsHigh() bool {
	return a.Priority == AnnouncementPriorityHigh
}

// GetPriorityClass returns CSS class for the priority
func (a *Announcement) GetPriorityClass() string {
	switch a.Priority {
	case AnnouncementPriorityUrgent:
		return "announcement-urgent"
	case AnnouncementPriorityHigh:
		return "announcement-high"
	case AnnouncementPriorityMedium:
		return "announcement-medium"
	default:
		return "announcement-low"
	}
}

// NewUserStats creates user statistics
func NewUserStats(user User, registrationCount int, lastLoginAt time.Time) UserStats {
	accountAge := int(time.Since(user.CreatedAt).Hours() / 24)
	profileComplete := user.Profile.FirstName != "" && user.Profile.LastName != ""
	
	return UserStats{
		RegistrationCount: registrationCount,
		LastLoginAt:       lastLoginAt,
		ProfileComplete:   profileComplete,
		AccountAge:        accountAge,
	}
}