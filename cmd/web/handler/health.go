package handler

import (
	"net/http"

	"github.com/tjmadonna/buswatch-web/cmd/web/application"
)

func GetHealthHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		app.WriteJSON(w, http.StatusOK, application.ResponseData{"status": "ok"}, nil)
	}
}
