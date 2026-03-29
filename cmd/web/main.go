package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tjmadonna/buswatch/cmd/web/application"
	"github.com/tjmadonna/buswatch/internal/database"
	"github.com/tjmadonna/buswatch/internal/truetime"
)

// main is the entry point for the application
func main() {
	// create a new slogger
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelInfo,
	}))

	// parse the environment file
	env, err := parseEnv()
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// create a new database connection
	db, err := database.New(env.dbConnStr)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// create a truetime client
	trueTimeClient, err := truetime.NewClient(
		env.trueTimeBaseURL,
		env.trueTimeAPIKey,
		env.cacheDuration,
		env.userAgent,
	)
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// create a location for parsing times
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	// create the application
	app := application.Application{
		Database:       db,
		Environment:    application.Environment(env.environment),
		Location:       loc,
		Logger:         logger,
		ServerURL:      env.serverURL,
		TrueTimeClient: trueTimeClient,
	}

	// create the http server
	addr := fmt.Sprintf(":%d", env.port)
	srv := &http.Server{
		Addr:           addr,
		MaxHeaderBytes: 524288, // 0.5 MB
		Handler:        createRoutes(&app),
		ErrorLog:       slog.NewLogLogger(logger.Handler(), slog.LevelError),
		IdleTimeout:    time.Minute,
		ReadTimeout:    5 * time.Second,
		WriteTimeout:   10 * time.Second,
	}

	// server run context
	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	// listen for syscall signals for process to interrupt/quit
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		// wait for a signal to be received on the channel
		<-sig

		// shutdown signal with grace period of 30 seconds
		shutdownCtx, shutdownStopCtx := context.WithTimeout(serverCtx, 30*time.Second)
		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				log.Fatal("graceful shutdown timed out.. forcing exit.")
			}
		}()

		// trigger graceful shutdown
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Fatal(err)
		}

		// close the truetime client
		trueTimeClient.Close()

		// close the database connection
		if err := db.Close(); err != nil {
			logger.Error("error closing database", slog.String("error", err.Error()))
		}

		// clean up the server context
		shutdownStopCtx()
		serverStopCtx()
	}()

	// start the server
	logger.Info("starting server", slog.String("addr", addr))
	err = srv.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		logger.Error("server error", slog.String("error", err.Error()))
	}

	// wait for server context to be stopped
	<-serverCtx.Done()
	logger.Info("stopped server")
}
