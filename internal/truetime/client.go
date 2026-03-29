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
	arrivalCache  *arrivalCache
	userAgent     string
}

// NewClient creates a new TrueTime client with the specified base URL.
func NewClient(baseURL, apiKey string, cacheDuration time.Duration, userAgent string) (*Client, error) {
	httpClient := http.Client{
		Timeout: 5 * time.Second,
	}
	arrivalCache := newArrivalCache(cacheDuration, cacheDuration)
	return &Client{
		apiKey:        apiKey,
		baseURL:       baseURL,
		cacheDuration: cacheDuration,
		httpClient:    &httpClient,
		arrivalCache:  arrivalCache,
		userAgent:     userAgent,
	}, nil
}

// Close cleans up resources used by the client
func (c *Client) Close() {
	if c.arrivalCache != nil {
		c.arrivalCache.Close()
	}
}

type TrueTimeResponse[T any] struct {
	BusTimeResponse T `json:"bustime-response"`
}

type TrueTimeError map[string]string
