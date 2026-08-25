package handler

import (
	"net/http"

	"github.com/tjmadonna/buswatch-web/cmd/web/application"
)

func GetNotFoundHandler(app *application.Application) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		app.WriteNotFoundResponse(w, r, "not found")
	}
}
