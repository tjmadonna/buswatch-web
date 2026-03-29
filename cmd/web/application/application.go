package application

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/tjmadonna/buswatch/internal/database"
	"github.com/tjmadonna/buswatch/internal/truetime"
)

type Environment string

const (
	Development Environment = "development"
	Production  Environment = "production"
)

// Application holds the application-wide parameters
type Application struct {
	CSPHashes      string
	Database       *database.Database
	Environment    Environment
	Location       *time.Location
	Logger         *slog.Logger
	ServerURL      string
	TrueTimeClient *truetime.Client
}

// LogError logs an error message to the application logger
func (app *Application) LogError(r *http.Request, err error) {
	var (
		method = r.Method
		uri    = r.URL.RequestURI()
	)
	app.Logger.Error(err.Error(), "method", method, "uri", uri)
}
