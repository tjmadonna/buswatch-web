package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/internal/database"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type Arrival struct {
	ArrivalTime string `json:"arrivalTime"`
	Occupancy   int    `json:"occupancy"`
	Direction   string `json:"direction"`
	RouteID     string `json:"routeID"`
	TripName    string `json:"tripName"`
	VehicleID   string `json:"vehicleID"`
}

func GetArrivalsHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get stop id from path
		stopID := r.PathValue("id")
		if stopID == "" || len(stopID) > 6 {
			app.WriteNotFoundResponse(w, r, "stop not found")
			return
		}

		// verify the stop exists and get the associated data feeds
		dataFeeds, err := app.Database.GetRTPIDataFeeds(stopID, r.Context())
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}
		if len(dataFeeds) == 0 {
			app.WriteNotFoundResponse(w, r, "stop not found")
			return
		}

		// get arrivals from TrueTime API
		trueTimeArrivals, err := app.TrueTimeClient.GetArrivals(stopID, dataFeeds)
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}

		// extract unique combinations from true time arrivals
		tripInfoMap := make(map[string]database.GetTripsByInfoItem)
		for _, pred := range trueTimeArrivals {
			key := createKey(pred.Direction, pred.Destination, pred.RouteID)
			tripInfoMap[key] = database.GetTripsByInfoItem{
				Direction:   pred.Direction,
				Destination: pred.Destination,
				RouteID:     pred.RouteID,
			}
		}

		// convert map to slice for database query
		tripInfoItems := make([]database.GetTripsByInfoItem, 0, len(tripInfoMap))
		for _, item := range tripInfoMap {
			tripInfoItems = append(tripInfoItems, item)
		}

		// get trip names from database
		tripNameMap := make(map[string]string)
		if len(tripInfoItems) > 0 {
			tripResults, err := app.Database.GetTripsByInfo(tripInfoItems, r.Context())
			if err != nil {
				app.WriteInternalServerErrorResponse(w, r, err)
				return
			}

			// create a lookup map for trip names
			for _, trip := range tripResults {
				key := createKey(trip.Direction, trip.Destination, trip.RouteID)
				tripNameMap[key] = trip.Name
			}
		}

		// build response arrivals with trip names
		arrivals := make([]Arrival, 0, len(trueTimeArrivals))
		caser := cases.Title(language.AmericanEnglish)
		for _, pred := range trueTimeArrivals {
			arrivalTime, err := parseArrivalTime(pred.ArrivalTime, app.Location)
			if err != nil {
				continue
			}
			key := createKey(pred.Direction, pred.Destination, pred.RouteID)
			tripName := tripNameMap[key]

			arrivals = append(arrivals, Arrival{
				ArrivalTime: arrivalTime,
				Occupancy:   parseOccupancy(pred.Occupancy),
				Direction:   caser.String(pred.Direction),
				RouteID:     strings.ToUpper(pred.RouteID),
				TripName:    tripName,
				VehicleID:   pred.VehicleID,
			})
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"arrivals": arrivals}, nil)
	}
}

func createKey(direction, destination, routeID string) string {
	return strings.ToUpper(direction) + "|" + strings.ToUpper(destination) + "|" + strings.ToUpper(routeID)
}

func parseArrivalTime(timeStr string, loc *time.Location) (string, error) {
	// Parse the time string in the specified format
	parsedTime, err := time.ParseInLocation("20060102 15:04:05", timeStr, loc)
	if err != nil {
		return "", fmt.Errorf("failed to parse time: %w", err)
	}

	// Convert to UTC and format as ISO 8601
	return parsedTime.UTC().Format(time.RFC3339), nil
}

func parseOccupancy(occupancy string) int {
	switch occupancy {
	case "EMPTY":
		return 0
	case "HALF_EMPTY":
		return 1
	case "FULL":
		return 2
	default:
		return -1 // unknown occupancy
	}
}
