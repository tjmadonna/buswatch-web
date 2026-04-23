package truetime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type ArrivalsBusTimeResponse struct {
	Errors   []TrueTimeError   `json:"error"`
	Arrivals []TrueTimeArrival `json:"prd"`
}

type TrueTimeArrival struct {
	ArrivalTime string `json:"prdtm"`
	Occupancy   string `json:"psgld"`
	Destination string `json:"des"`
	Direction   string `json:"rtdir"`
	RouteID     string `json:"rt"`
	VehicleID   string `json:"vid"`
}

// GetArrivals fetches arrivals for a given stop ID across multiple data feeds.
func (c *Client) GetArrivals(stopID string, dataFeeds []string) ([]TrueTimeArrival, error) {
	var allArrivals []TrueTimeArrival

	cacheKey := stopID
	if cachedArrivals, found := c.getCachedArrivals(cacheKey); found {
		return cachedArrivals, nil
	}

	// fetch arrivals for each data feed
	for _, feed := range dataFeeds {
		arrivals, err := c.fetchArrivalsForFeed(stopID, feed)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch arrivals for feed %s: %w", feed, err)
		}
		allArrivals = append(allArrivals, arrivals...)
	}

	// cache the results
	c.setCachedArrivals(cacheKey, allArrivals)

	return allArrivals, nil
}

func (c *Client) fetchArrivalsForFeed(stopID, feed string) ([]TrueTimeArrival, error) {
	baseURL := c.baseURL + "/getpredictions"
	params := url.Values{
		"format":       {"json"},
		"tmres":        {"s"},
		"key":          {c.apiKey},
		"stpid":        {stopID},
		"rtpidatafeed": {feed},
	}
	requestURL := baseURL + "?" + params.Encode()

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("User-Agent", c.userAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var response TrueTimeResponse[ArrivalsBusTimeResponse]
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}
	if err := c.handleAPIErrors(response.BusTimeResponse.Errors); err != nil {
		return nil, err
	}

	return response.BusTimeResponse.Arrivals, nil
}

func (c *Client) handleAPIErrors(errors []TrueTimeError) error {
	if len(errors) == 0 {
		return nil
	}

	var errorMessages []string
	for _, e := range errors {
		// ignore any "No service scheduled" or "No arrival times" errors for stops with no service
		// these are expected and not actionable
		if msg := e["msg"]; msg == "No arrival times" || msg == "No service scheduled" {
			continue
		}

		errorMessages = append(errorMessages, e["msg"])
	}

	if len(errorMessages) > 0 {
		return fmt.Errorf("truetime api error: %s", strings.Join(errorMessages, ", "))
	}

	return nil
}
