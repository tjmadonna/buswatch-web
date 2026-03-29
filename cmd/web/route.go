package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/cmd/web/handler"
	"github.com/tjmadonna/buswatch/ui"
)

// createRoutes creates the routes for the application
func createRoutes(app *application.Application) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("GET /api/v1/health", handler.GetHealthHandler(app))

	if app.Environment == application.Production {
		mux.Handle("GET /", http.FileServerFS(ui.Files))
	} else {
		mux.Handle("GET /", createViteProxy())
	}

	return mux
}

// createViteProxy creates a reverse proxy to the Vite development server
func createViteProxy() http.Handler {
	viteURL, err := url.Parse("http://localhost:5173")
	if err != nil {
		log.Fatal("failed to parse Vite URL:", err)
	}
	proxy := httputil.NewSingleHostReverseProxy(viteURL)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	})
}
