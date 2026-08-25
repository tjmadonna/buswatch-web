package main

import (
	"io/fs"
	"log"
	"mime"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
	"strconv"
	"strings"

	"github.com/tjmadonna/buswatch-web/asset"
	"github.com/tjmadonna/buswatch-web/cmd/web/application"
	"github.com/tjmadonna/buswatch-web/cmd/web/handler"
)

// createRoutes creates the routes for the application
func createRoutes(app *application.Application) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("GET /api/v1/health", app.WrapAPIMiddleware(handler.GetHealthHandler(app)))
	mux.Handle("GET /api/v1/stops", app.WrapAPIMiddleware(handler.GetStopsHandler(app)))
	mux.Handle("GET /api/v1/stops/{id}", app.WrapAPIMiddleware(handler.GetStopHandler(app)))
	mux.Handle("GET /api/v1/stops/{id}/arrivals", app.WrapAPIMiddleware(handler.GetArrivalsHandler(app)))
	mux.Handle("GET /api/v1/routes/{id}/path", app.WrapAPIMiddleware(handler.GetRoutePathHandler(app)))
	mux.Handle("GET /api/v1/routes/{id}/vehicles", app.WrapAPIMiddleware(handler.GetRouteVehiclesHandler(app)))
	mux.Handle("GET /api/", app.WrapAPIMiddleware(handler.GetNotFoundHandler(app)))

	if app.Environment == application.Production {
		assetsFS, err := fs.Sub(asset.AssetsFS, "assets")
		if err != nil {
			log.Fatal("failed to create assets sub-filesystem:", err)
		}
		mux.Handle("GET /", createCompressedAssetFileServer(assetsFS))
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

// createCompressedAssetFileServer creates a file server that serves compressed assets if available
func createCompressedAssetFileServer(assetsFS fs.FS) http.Handler {
	fileServer := http.FileServerFS(assetsFS)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")

		cleanPath := path.Clean("/" + r.URL.Path)
		assetPath := strings.TrimPrefix(cleanPath, "/")
		if assetPath == "" || assetPath == "." {
			assetPath = "index.html"
		}

		isFallback := false
		if !assetFileExists(assetsFS, assetPath) {
			isFallback = true
			assetPath = "index.html"
		}

		if isFallback {
			setCacheControl(w, "/index.html")
		} else {
			setCacheControl(w, "/"+assetPath)
		}

		proxiedReq := r.Clone(r.Context())
		if assetPath == "index.html" {
			proxiedReq.URL.Path = "/"
		} else {
			proxiedReq.URL.Path = "/" + assetPath
		}

		encoding, suffix := negotiateCompression(r.Header.Get("Accept-Encoding"))
		if encoding == "" {
			fileServer.ServeHTTP(w, proxiedReq)
			return
		}

		compressedAssetPath := assetPath + suffix
		if !assetFileExists(assetsFS, compressedAssetPath) {
			// no compressed variant for this asset, just serve the uncompressed version
			fileServer.ServeHTTP(w, proxiedReq)
			return
		}

		proxiedReq.URL.Path = "/" + compressedAssetPath

		w.Header().Set("Content-Encoding", encoding)
		if contentType := mime.TypeByExtension(path.Ext(assetPath)); contentType != "" {
			w.Header().Set("Content-Type", contentType)
		}

		fileServer.ServeHTTP(w, proxiedReq)
	})
}

// setCacheControl sets the Cache-Control header based on the request path
func setCacheControl(w http.ResponseWriter, requestPath string) {
	cleanPath := path.Clean("/" + requestPath)
	if strings.HasPrefix(cleanPath, "/assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}

	if cleanPath == "/robots.txt" || cleanPath == "/sitemap.xml" {
		w.Header().Set("Cache-Control", "public, max-age=3600")
		return
	}

	// html shell contains route metadata and must be revalidated after deploys.
	w.Header().Set("Cache-Control", "no-cache")
}

// assetFileExists checks if a file exists in the given filesystem
func assetFileExists(assetsFS fs.FS, filePath string) bool {
	_, err := fs.Stat(assetsFS, filePath)
	return err == nil
}

// negotiateCompression determines the best compression encoding to use based on the Accept-Encoding header
func negotiateCompression(acceptEncoding string) (encoding string, suffix string) {
	brQuality, brFound := parseEncodingQuality(acceptEncoding, "br")
	gzipQuality, gzipFound := parseEncodingQuality(acceptEncoding, "gzip")
	wildcardQuality, wildcardFound := parseEncodingQuality(acceptEncoding, "*")

	if !brFound && wildcardFound {
		brQuality = wildcardQuality
	}
	if !gzipFound && wildcardFound {
		gzipQuality = wildcardQuality
	}

	if brQuality <= 0 && gzipQuality <= 0 {
		return "", ""
	}

	if brQuality >= gzipQuality {
		return "br", ".br"
	}

	return "gzip", ".gz"
}

// parseEncodingQuality parses the quality value for a specific encoding from the Accept-Encoding header
func parseEncodingQuality(acceptEncoding string, target string) (quality float64, found bool) {
	for _, part := range strings.Split(strings.ToLower(acceptEncoding), ",") {
		entry := strings.TrimSpace(part)
		if entry == "" {
			continue
		}

		segments := strings.Split(entry, ";")
		name := strings.TrimSpace(segments[0])
		if name != target {
			continue
		}

		q := 1.0
		for _, param := range segments[1:] {
			param = strings.TrimSpace(param)
			if !strings.HasPrefix(param, "q=") {
				continue
			}

			parsedQ, err := strconv.ParseFloat(strings.TrimPrefix(param, "q="), 64)
			if err != nil || parsedQ <= 0 {
				q = 0
				continue
			}

			if parsedQ > 1 {
				q = 1
				continue
			}

			q = parsedQ
		}

		if !found || q > quality {
			quality = q
		}
		found = true
	}

	return quality, found
}
