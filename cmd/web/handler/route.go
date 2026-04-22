package handler

import (
	"net/http"

	"github.com/tjmadonna/buswatch/cmd/web/application"
)

func GetRouteShapesHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// get route id from path and validate it
		routeID := r.PathValue("id")
		if !validateRouteID(routeID) {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		// fetch route shapes from the database
		shapes, err := app.Database.GetShapesByRouteID(routeID, r.Context())
		if err != nil {
			app.WriteInternalServerErrorResponse(w, r, err)
			return
		}

		if len(shapes) == 0 {
			app.WriteNotFoundResponse(w, r, "route not found")
			return
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"shapes": shapes}, nil)
	}
}

func validateRouteID(code string) bool {
	if len(code) == 0 || len(code) > 6 {
		return false
	}
	return true
}
