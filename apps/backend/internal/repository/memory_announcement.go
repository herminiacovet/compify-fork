package repository

import (
	"compify-backend/internal/models"
	"errors"
	"sort"
	"sync"
	"time"
)

// MemoryAnnouncementRepository implements AnnouncementRepository using in-memory storage
type MemoryAnnouncementRepository struct {
	announcements map[string]*models.Announcement
	mutex         sync.RWMutex
}

// NewMemoryAnnouncementRepository creates a new in-memory announcement repository
func NewMemoryAnnouncementRepository() *MemoryAnnouncementRepository {
	return &MemoryAnnouncementRepository{
		announcements: make(map[string]*models.Announcement),
	}
}

// Create creates a new announcement
func (r *MemoryAnnouncementRepository) Create(announcement *models.Announcement) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate announcement data
	if err := announcement.Validate(); err != nil {
		return err
	}

	// Generate ID if not provided
	if announcement.ID == "" {
		id, err := generateID()
		if err != nil {
			return err
		}
		announcement.ID = id
	}

	// Set timestamps
	now := time.Now()
	if announcement.CreatedAt.IsZero() {
		announcement.CreatedAt = now
	}
	announcement.UpdatedAt = now

	// Store announcement
	r.announcements[announcement.ID] = announcement

	return nil
}

// GetByID retrieves an announcement by ID
func (r *MemoryAnnouncementRepository) GetByID(id string) (*models.Announcement, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	announcement, exists := r.announcements[id]
	if !exists {
		return nil, errors.New("announcement not found")
	}

	return announcement, nil
}

// GetPublished retrieves all published announcements, sorted by creation date (newest first)
func (r *MemoryAnnouncementRepository) GetPublished() ([]*models.Announcement, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var announcements []*models.Announcement
	for _, announcement := range r.announcements {
		if announcement.Published {
			announcements = append(announcements, announcement)
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(announcements, func(i, j int) bool {
		return announcements[i].CreatedAt.After(announcements[j].CreatedAt)
	})

	return announcements, nil
}

// GetByPriority retrieves all published announcements with a specific priority
func (r *MemoryAnnouncementRepository) GetByPriority(priority models.AnnouncementPriority) ([]*models.Announcement, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var announcements []*models.Announcement
	for _, announcement := range r.announcements {
		if announcement.Published && announcement.Priority == priority {
			announcements = append(announcements, announcement)
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(announcements, func(i, j int) bool {
		return announcements[i].CreatedAt.After(announcements[j].CreatedAt)
	})

	return announcements, nil
}

// Update updates an announcement
func (r *MemoryAnnouncementRepository) Update(announcement *models.Announcement) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Validate announcement data
	if err := announcement.Validate(); err != nil {
		return err
	}

	// Check if announcement exists
	if _, exists := r.announcements[announcement.ID]; !exists {
		return errors.New("announcement not found")
	}

	// Update timestamp
	announcement.UpdatedAt = time.Now()

	// Store announcement
	r.announcements[announcement.ID] = announcement

	return nil
}

// Delete deletes an announcement
func (r *MemoryAnnouncementRepository) Delete(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.announcements[id]; !exists {
		return errors.New("announcement not found")
	}

	delete(r.announcements, id)
	return nil
}

// Publish publishes an announcement
func (r *MemoryAnnouncementRepository) Publish(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	announcement, exists := r.announcements[id]
	if !exists {
		return errors.New("announcement not found")
	}

	announcement.Published = true
	announcement.UpdatedAt = time.Now()

	return nil
}

// Unpublish unpublishes an announcement
func (r *MemoryAnnouncementRepository) Unpublish(id string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	announcement, exists := r.announcements[id]
	if !exists {
		return errors.New("announcement not found")
	}

	announcement.Published = false
	announcement.UpdatedAt = time.Now()

	return nil
}