package truetime

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type VehiclesBusTimeResponse struct {
	Errors   []TrueTimeError   `json:"error"`
	Vehicles []TrueTimeVehicle `json:"vehicle"`
}

type TrueTimeVehicle struct {
	ID          string `json:"vid"`
	Destination string `json:"des"`
	Direction   string `json:"rtdir"`
	Heading     string `json:"hdg"`
	Latitude    string `json:"lat"`
	Longitude   string `json:"lon"`
	Occupancy   string `json:"psgld"`
	RouteID     string `json:"rt"`
}

func (c *Client) GetVehicles(routeID string) ([]TrueTimeVehicle, error) {
	cacheKey := routeID
	if cachedArrivals, found := c.getCachedVehicles(cacheKey); found {
		return cachedArrivals, nil
	}

	// fetch vehicles
	vehicles, err := c.fetchVehicles(routeID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch vehicles: %w", err)
	}

	// cache the results
	c.setCachedVehicles(cacheKey, vehicles)

	return vehicles, nil
}

func (c *Client) fetchVehicles(routeID string) ([]TrueTimeVehicle, error) {
	baseURL := c.baseURL + "/getvehicles"
	params := url.Values{
		"format": {"json"},
		"key":    {c.apiKey},
		"rt":     {routeID},
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

	var response TrueTimeResponse[VehiclesBusTimeResponse]
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}
	if err := c.handleAPIErrors(response.BusTimeResponse.Errors); err != nil {
		return nil, err
	}

	return response.BusTimeResponse.Vehicles, nil
}
