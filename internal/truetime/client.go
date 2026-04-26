package truetime

import (
	"net/http"
	"time"
)

type Client struct {
	apiKey        string
	baseURL       string
	cacheDuration time.Duration
	httpClient    *http.Client
	arrivalCache  *cache[[]TrueTimeArrival]
	vehicleCache  *cache[[]TrueTimeVehicle]
	userAgent     string
}

// NewClient creates a new TrueTime client with the specified base URL.
func NewClient(baseURL, apiKey string, cacheDuration time.Duration, userAgent string) (*Client, error) {
	httpClient := http.Client{
		Timeout: 5 * time.Second,
	}
	arrivalCache := newCache[[]TrueTimeArrival](cacheDuration, cacheDuration)
	vehicleCache := newCache[[]TrueTimeVehicle](cacheDuration, cacheDuration)
	return &Client{
		apiKey:        apiKey,
		baseURL:       baseURL,
		cacheDuration: cacheDuration,
		httpClient:    &httpClient,
		arrivalCache:  arrivalCache,
		vehicleCache:  vehicleCache,
		userAgent:     userAgent,
	}, nil
}

// getCachedArrivals retrieves arrivals from cache if valid
func (c *Client) getCachedArrivals(stopID string) ([]TrueTimeArrival, bool) {
	c.arrivalCache.mu.RLock()
	defer c.arrivalCache.mu.RUnlock()

	cached, exists := c.arrivalCache.data[stopID]
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

	c.arrivalCache.data[stopID] = cachedItem[[]TrueTimeArrival]{
		data:      cachedData,
		timestamp: time.Now(),
	}
}

// getCachedVehicles retrieves vehicles from cache if valid
func (c *Client) getCachedVehicles(routeID string) ([]TrueTimeVehicle, bool) {
	c.vehicleCache.mu.RLock()
	defer c.vehicleCache.mu.RUnlock()

	cached, exists := c.vehicleCache.data[routeID]
	if !exists || cached.isExpired(c.cacheDuration) {
		return nil, false
	}

	// return a copy to prevent mutation
	vehicles := make([]TrueTimeVehicle, len(cached.data))
	copy(vehicles, cached.data)
	return vehicles, true
}

// setCachedVehicles stores vehicles in cache
func (c *Client) setCachedVehicles(routeID string, vehicles []TrueTimeVehicle) {
	c.vehicleCache.mu.Lock()
	defer c.vehicleCache.mu.Unlock()

	// store a copy to prevent external mutation
	cachedData := make([]TrueTimeVehicle, len(vehicles))
	copy(cachedData, vehicles)

	c.vehicleCache.data[routeID] = cachedItem[[]TrueTimeVehicle]{
		data:      cachedData,
		timestamp: time.Now(),
	}
}

// Close cleans up resources used by the client
func (c *Client) Close() {
	if c.arrivalCache != nil {
		c.arrivalCache.Close()
	}
	if c.vehicleCache != nil {
		c.vehicleCache.Close()
	}
}

type TrueTimeResponse[T any] struct {
	BusTimeResponse T `json:"bustime-response"`
}

type TrueTimeError map[string]string
