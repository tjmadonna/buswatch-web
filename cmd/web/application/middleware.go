package application

import (
	"errors"
	"net/http"
)

func (app *Application) WrapAPIMiddleware(h http.HandlerFunc) http.Handler {
	m := app.CheckOrigin(h)
	m = app.SetCORSHeaders(m)
	m = app.LogRequest(m)
	m = app.RecoverPanic(m)
	return m
}

// CheckOrigin checks the request origin against the trusted origins
func (app *Application) CheckOrigin(next http.Handler) http.Handler {
	cop := http.NewCrossOriginProtection()
	if app.Environment == Production {
		cop.AddTrustedOrigin(app.ServerURL)
	} else {
		cop.AddTrustedOrigin("http://localhost:5173")
	}
	return cop.Handler(next)
}

func (app *Application) SetCORSHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if app.Environment == Production {
			w.Header().Add("Access-Control-Allow-Origin", app.ServerURL)
		} else {
			w.Header().Add("Access-Control-Allow-Origin", "http://localhost:5173")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET")
		next.ServeHTTP(w, r)
	})
}

// SetSecurityHeaders sets the security headers for the response
func (app *Application) SetSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "0")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-site")
		w.Header().Set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), interest-cohort=()")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; connect-src 'self' https://tiles.openfreemap.org; manifest-src 'self'; worker-src 'self' blob:; frame-ancestors 'none';")

		next.ServeHTTP(w, r)
	})
}

// LogRequest logs the request information to the application logger
func (app *Application) LogRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var (
			ip     = r.RemoteAddr
			proto  = r.Proto
			method = r.Method
			uri    = r.URL.RequestURI()
		)
		app.Logger.Info("received request", "ip", ip, "proto", proto, "method", method, "uri", uri)
		next.ServeHTTP(w, r)
	})
}

// RecoverPanic recovers from panics and writes an internal server error response
func (app *Application) RecoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "close")
				app.WriteInternalServerErrorResponse(w, r, errors.New("internal server error"))
			}
		}()

		next.ServeHTTP(w, r)
	})
}
