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

	"github.com/tjmadonna/buswatch/asset"
	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/cmd/web/handler"
)

// createRoutes creates the routes for the application
func createRoutes(app *application.Application) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("GET /api/v1/health", handler.GetHealthHandler(app))

	if app.Environment == application.Production {
		mux.Handle("GET /", createCompressedAssetFileServer(asset.AssetsFS))
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

func createCompressedAssetFileServer(assetsFS fs.FS) http.Handler {
	fileServer := http.FileServerFS(assetsFS)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")

		encoding, suffix := negotiateCompression(r.Header.Get("Accept-Encoding"))
		if encoding == "" {
			fileServer.ServeHTTP(w, r)
			return
		}

		cleanPath := path.Clean("/" + r.URL.Path)
		assetPath := strings.TrimPrefix(cleanPath, "/")
		if assetPath == "" || assetPath == "." {
			assetPath = "index.html"
		}

		compressedAssetPath := assetPath + suffix
		if !assetFileExists(assetsFS, compressedAssetPath) {
			fileServer.ServeHTTP(w, r)
			return
		}

		proxiedReq := r.Clone(r.Context())
		clonedURL := *r.URL
		proxiedReq.URL = &clonedURL
		proxiedReq.URL.Path = "/" + compressedAssetPath

		w.Header().Set("Content-Encoding", encoding)
		if contentType := mime.TypeByExtension(path.Ext(assetPath)); contentType != "" {
			w.Header().Set("Content-Type", contentType)
		}

		fileServer.ServeHTTP(w, proxiedReq)
	})
}

func assetFileExists(assetsFS fs.FS, filePath string) bool {
	_, err := fs.Stat(assetsFS, filePath)
	return err == nil
}

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
