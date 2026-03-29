package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/internal/database"
)

type Stop struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Longitude float64  `json:"longitude"`
	Latitude  float64  `json:"latitude"`
	RouteIDs  []string `json:"routeIDs"`
}

func GetStopHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// only allow GET requests
		if r.Method != http.MethodGet {
			app.WriteMethodNotAllowedResponse(w, r, "method not allowed")
			return
		}

		// get stop id from path and validate it
		stopID := r.PathValue("id")
		if !validateStopCode(stopID) {
			app.WriteNotFoundResponse(w, r, "stop not found")
			return
		}

		// fetch stop details from the database
		stop, err := app.Database.GetStopByCode(stopID, r.Context())
		if err != nil {
			if err == database.ErrNoRows {
				app.WriteNotFoundResponse(w, r, "stop not found")
				return
			}
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"stop": Stop{
			ID:        stop.ID,
			Name:      stop.Name,
			Longitude: stop.Longitude,
			Latitude:  stop.Latitude,
			RouteIDs:  stop.RouteIDs,
		}}, nil)
	}
}

func GetStopsHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// only allow GET requests
		if r.Method != http.MethodGet {
			app.WriteMethodNotAllowedResponse(w, r, "method not allowed")
			return
		}

		query := r.URL.Query()

		q := query.Get("q")
		if q != "" {
			getStopsBySearchTermHandler(app, w, r, q)
			return
		}

		ids := query.Get("ids")
		if ids != "" {
			codes := strings.Split(ids, ",")
			if len(codes) < 1 {
				app.WriteBadRequestResponse(w, r, "ids query parameter must contain at least one stop code")
				return
			}
			invalidCodes := []string{}
			for _, code := range codes {
				if !validateStopCode(code) {
					invalidCodes = append(invalidCodes, code)
				}
			}
			if len(invalidCodes) > 0 {
				app.WriteBadRequestResponse(w, r, "invalid stop id(s): "+strings.Join(invalidCodes, ", "))
				return
			}
			getStopsByCodesHandler(app, w, r, codes)
			return
		}

		north := query.Get("north")
		south := query.Get("south")
		west := query.Get("west")
		east := query.Get("east")
		if north != "" && south != "" && west != "" && east != "" {
			badParams := []string{}
			northFloat, err := strconv.ParseFloat(north, 64)
			if err != nil {
				badParams = append(badParams, "north")
			}
			southFloat, err := strconv.ParseFloat(south, 64)
			if err != nil {
				badParams = append(badParams, "south")
			}
			westFloat, err := strconv.ParseFloat(west, 64)
			if err != nil {
				badParams = append(badParams, "west")
			}
			eastFloat, err := strconv.ParseFloat(east, 64)
			if err != nil {
				badParams = append(badParams, "east")
			}
			if len(badParams) > 0 {
				app.WriteBadRequestResponse(w, r, "invalid "+strings.Join(badParams, ", ")+" query parameter(s)")
				return
			}

			getStopsByLocationBoundsHandler(app, w, r, northFloat, southFloat, westFloat, eastFloat)
			return
		}

		app.WriteBadRequestResponse(w, r, "either a q search term or north, south, west, and east query parameters are required")
	}
}

func getStopsBySearchTermHandler(app *application.Application, w http.ResponseWriter, r *http.Request, q string) {
	results, err := app.Database.GetStopsBySearchTerm(q, r.Context())
	if err != nil {
		app.WriteInternalServerErrorResponse(w, r, err)
		return
	}
	stops := make([]Stop, 0, len(results))
	for _, s := range results {
		stops = append(stops, Stop{
			ID:        s.ID,
			Name:      s.Name,
			Longitude: s.Longitude,
			Latitude:  s.Latitude,
			RouteIDs:  s.RouteIDs,
		})
	}
	app.WriteJSON(w, http.StatusOK, application.ResponseData{"stops": stops}, nil)
}

func getStopsByCodesHandler(app *application.Application, w http.ResponseWriter, r *http.Request, codes []string) {
	results, err := app.Database.GetStopsByCodes(codes, r.Context())
	if err != nil {
		app.WriteInternalServerErrorResponse(w, r, err)
		return
	}
	stops := make([]Stop, 0, len(results))
	for _, s := range results {
		stops = append(stops, Stop{
			ID:        s.ID,
			Name:      s.Name,
			Longitude: s.Longitude,
			Latitude:  s.Latitude,
			RouteIDs:  s.RouteIDs,
		})
	}
	app.WriteJSON(w, http.StatusOK, application.ResponseData{"stops": stops}, nil)
}

func getStopsByLocationBoundsHandler(app *application.Application, w http.ResponseWriter, r *http.Request, north, south, west, east float64) {
	results, err := app.Database.GetStopsInLocationBounds(north, south, west, east, r.Context())
	if err != nil {
		app.WriteInternalServerErrorResponse(w, r, err)
		return
	}
	stops := make([]Stop, 0, len(results))
	for _, s := range results {
		stops = append(stops, Stop{
			ID:        s.ID,
			Name:      s.Name,
			Longitude: s.Longitude,
			Latitude:  s.Latitude,
			RouteIDs:  s.RouteIDs,
		})
	}
	app.WriteJSON(w, http.StatusOK, application.ResponseData{"stops": stops}, nil)
}

func validateStopCode(code string) bool {
	if len(code) == 0 || len(code) > 6 {
		return false
	}
	return true
}
