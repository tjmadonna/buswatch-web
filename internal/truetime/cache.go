package truetime

import (
	"sync"
	"time"
)

// newArrivalCache creates a new cache with automatic cleanup
func newArrivalCache(cleanupInterval, expiry time.Duration) *arrivalCache {
	cache := &arrivalCache{
		arrivals:      make(map[string]cachedArrivals),
		cleanupTicker: time.NewTicker(cleanupInterval),
		expiry:        expiry,
		done:          make(chan struct{}),
	}

	// start background cleanup goroutine
	go cache.startCleanupTimer()

	return cache
}

type arrivalCache struct {
	mu            sync.RWMutex
	arrivals      map[string]cachedArrivals
	cleanupTicker *time.Ticker
	expiry        time.Duration
	done          chan struct{}
}

type cachedArrivals struct {
	data      []TrueTimeArrival
	timestamp time.Time
}

// isExpired checks if the cached data is expired
func (c *cachedArrivals) isExpired(duration time.Duration) bool {
	return time.Since(c.timestamp) > duration
}

// getCachedArrivals retrieves arrivals from cache if valid
func (c *Client) getCachedArrivals(stopID string) ([]TrueTimeArrival, bool) {
	c.arrivalCache.mu.RLock()
	defer c.arrivalCache.mu.RUnlock()

	cached, exists := c.arrivalCache.arrivals[stopID]
	if !exists || cached.isExpired(c.cacheDuration) {
		return nil, false
	}

	// return a copy to prevent mutation
	arrivals := make([]TrueTimeArrival, len(cached.data))
	copy(arrivals, cached.data)
	return arrivals, true
}

// setCachedArrivals stores arrivals in cache
func (c *Client) setCachedArrivals(stopID string, arrivals []TrueTimeArrival) {
	c.arrivalCache.mu.Lock()
	defer c.arrivalCache.mu.Unlock()

	// store a copy to prevent external mutation
	cachedData := make([]TrueTimeArrival, len(arrivals))
	copy(cachedData, arrivals)

	c.arrivalCache.arrivals[stopID] = cachedArrivals{
		data:      cachedData,
		timestamp: time.Now(),
	}
}

// cleanExpired removes expired entries from cache
func (pc *arrivalCache) cleanExpired() {
	pc.mu.Lock()
	defer pc.mu.Unlock()

	// remove entries
	for stopID, cached := range pc.arrivals {
		if time.Since(cached.timestamp) > pc.expiry {
			delete(pc.arrivals, stopID)
		}
	}
}

// startCleanupTimer runs the cleanup process at regular intervals
func (pc *arrivalCache) startCleanupTimer() {
	for {
		select {
		case <-pc.cleanupTicker.C:
			pc.cleanExpired()
		case <-pc.done:
			pc.cleanupTicker.Stop()
			return
		}
	}
}

// Close stops the cleanup timer and closes the cache
func (pc *arrivalCache) Close() {
	close(pc.done)
}
