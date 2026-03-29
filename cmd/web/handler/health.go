package handler

import (
	"net/http"

	"github.com/tjmadonna/buswatch/cmd/web/application"
)

func GetHealthHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// only allow GET requests
		if r.Method != http.MethodGet {
			app.WriteMethodNotAllowedResponse(w, r, "method not allowed")
			return
		}

		app.WriteJSON(w, http.StatusOK, application.ResponseData{"status": "ok"}, nil)
	}
}
