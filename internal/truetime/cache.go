package truetime

import (
	"sync"
	"time"
)

type cachedItem[T any] struct {
	data      T
	timestamp time.Time
}

func (c *cachedItem[T]) isExpired(duration time.Duration) bool {
	return time.Since(c.timestamp) > duration
}

// newCache creates a new cache with automatic cleanup
func newCache[T any](cleanupInterval, expiry time.Duration) *cache[T] {
	cache := &cache[T]{
		data:          make(map[string]cachedItem[T]),
		cleanupTicker: time.NewTicker(cleanupInterval),
		expiry:        expiry,
		done:          make(chan struct{}),
	}

	// start background cleanup goroutine
	go cache.startCleanupTimer()

	return cache
}

type cache[T any] struct {
	mu            sync.RWMutex
	data          map[string]cachedItem[T]
	cleanupTicker *time.Ticker
	expiry        time.Duration
	done          chan struct{}
}

// cleanExpired removes expired entries from cache
func (pc *cache[T]) cleanExpired() {
	pc.mu.Lock()
	defer pc.mu.Unlock()

	// remove entries
	for key, cached := range pc.data {
		if time.Since(cached.timestamp) > pc.expiry {
			delete(pc.data, key)
		}
	}
}

// startCleanupTimer runs the cleanup process at regular intervals
func (pc *cache[T]) startCleanupTimer() {
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
func (pc *cache[T]) Close() {
	close(pc.done)
}
