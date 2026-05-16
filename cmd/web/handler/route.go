package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/internal/database"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

func GetRoutePathHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get route id from url path and validate it
		routeID := r.PathValue("id")

		strippedID := strings.TrimSpace(routeID)
		if len(strippedID) == 0 || len(routeID) > 4 {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		exists, err := app.Database.DoesRouteExist(routeID, r.Context())
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}
		if !exists {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		// fetch route path from database
		path, err := app.Database.GetRoutePathPointsByRouteID(routeID, r.Context())
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}

		if len(path) == 0 {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"path": path}, nil)
	}
}

type Vehicle struct {
	ID        string  `json:"id"`
	TripName  string  `json:"tripName"`
	Direction string  `json:"direction"`
	RouteID   string  `json:"routeID"`
	Heading   int64   `json:"heading"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Occupancy int     `json:"occupancy"`
}

func GetRouteVehiclesHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get route id from path and validate it
		routeID := r.PathValue("id")

		strippedID := strings.TrimSpace(routeID)
		if len(strippedID) == 0 || len(routeID) > 4 {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		exists, err := app.Database.DoesRouteExist(routeID, r.Context())
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}
		if !exists {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		// get vehicles from TrueTime API
		trueTimeVehicles, err := app.TrueTimeClient.GetVehicles(routeID)
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}

		// extract unique combinations from true time vehicles
		tripInfoMap := make(map[string]database.GetTripsByInfoItem)
		for _, v := range trueTimeVehicles {
			key := createKey(v.Direction, v.Destination, v.RouteID)
			if _, exists := tripInfoMap[key]; exists {
				continue
			}
			tripInfoMap[key] = database.GetTripsByInfoItem{
				Direction:   v.Direction,
				Destination: v.Destination,
				RouteID:     v.RouteID,
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

		vehicles := make([]Vehicle, 0, len(trueTimeVehicles))
		caser := cases.Title(language.AmericanEnglish)
		for _, v := range trueTimeVehicles {
			key := createKey(v.Direction, v.Destination, v.RouteID)
			tripName := tripNameMap[key]

			heading, err := strconv.ParseInt(v.Heading, 10, 64)
			if err != nil {
				app.WriteInternalServerErrorResponse(w, r, err)
				return
			}

			lat, err := strconv.ParseFloat(v.Latitude, 64)
			if err != nil {
				app.WriteInternalServerErrorResponse(w, r, err)
				return
			}
			lon, err := strconv.ParseFloat(v.Longitude, 64)
			if err != nil {
				app.WriteInternalServerErrorResponse(w, r, err)
				return
			}

			vehicles = append(vehicles, Vehicle{
				ID:        v.ID,
				TripName:  tripName,
				Direction: caser.String(v.Direction),
				RouteID:   strings.ToUpper(v.RouteID),
				Heading:   heading,
				Latitude:  lat,
				Longitude: lon,
				Occupancy: parseOccupancy(v.Occupancy),
			})
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"vehicles": vehicles}, nil)
	}
}
