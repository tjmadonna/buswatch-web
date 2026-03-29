package truetime

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

type VehiclesBusTimeResponse struct {
	Errors   []TrueTimeError   `json:"error"`
	Vehicles []TrueTimeVehicle `json:"vehicle"`
}

type TrueTimeVehicle struct {
	ID        string `json:"vid"`
	Occupancy string `json:"psgld"`
}

func (c *Client) GetVehicles(ids ...string) ([]TrueTimeVehicle, error) {
	userAgent := c.userAgent

	vids := strings.Join(ids, ",")
	url := c.baseURL + "/getvehicles?format=json&key=" + c.apiKey + "&vid=" + vids
	req, err := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", userAgent)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to fetch vehicles: " + resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response TrueTimeResponse[VehiclesBusTimeResponse]
	err = json.Unmarshal(body, &response)
	if err != nil {
		return nil, err
	}

	if len(response.BusTimeResponse.Errors) > 0 {
		msg := ""
		for idx, e := range response.BusTimeResponse.Errors {
			msg += e["vid"] + " - " + e["msg"]
			if idx < len(response.BusTimeResponse.Errors)-1 {
				msg += ", "
			}
		}
		return nil, errors.New("truetime api error: " + msg)
	}

	return response.BusTimeResponse.Vehicles, nil
}
