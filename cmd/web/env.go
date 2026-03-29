package main

import (
	_ "embed"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// env represents the environment configuration
type env struct {
	cacheDuration   time.Duration
	dbConnStr       string
	environment     string
	port            int
	serverURL       string
	trueTimeAPIKey  string
	trueTimeBaseURL string
	userAgent       string
}

// parseEnv reads environment variables and returns the environment configuration
func parseEnv() (env, error) {
	errs := []string{}

	cacheDurationStr := os.Getenv("CACHE_DURATION")
	cacheDuration, err := time.ParseDuration(cacheDurationStr)
	if err != nil {
		errs = append(errs, fmt.Sprintf("invalid CACHE_DURATION: %s", cacheDurationStr))
	}
	if cacheDuration < time.Second*5 {
		errs = append(errs, fmt.Sprintf("CACHE_DURATION too short: %s", cacheDurationStr))
	}

	dbConnStr := os.Getenv("DB_CONN_STR")
	if dbConnStr == "" {
		errs = append(errs, fmt.Sprintf("invalid DB_CONN_STR: %s", dbConnStr))
	} else {
		parts := strings.Split(dbConnStr, "?")
		if _, err := os.Stat(parts[0]); err != nil {
			errs = append(errs, fmt.Sprintf("DB_CONN_STR file does not exist: %s", dbConnStr))
		}
	}

	environment := strings.ToLower(os.Getenv("ENVIRONMENT"))
	if environment != "development" && environment != "production" {
		errs = append(errs, fmt.Sprintf("invalid ENVIRONMENT: %s", environment))
	}

	portStr := os.Getenv("PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		errs = append(errs, fmt.Sprintf("invalid PORT: %s", portStr))
	} else if port < 1024 || port > 65535 {
		errs = append(errs, fmt.Sprintf("PORT must be between 1024 and 65535: %d", port))
	}

	serverURL := os.Getenv("SERVER_URL")
	if serverURL == "" {
		errs = append(errs, fmt.Sprintf("invalid SERVER_URL: %s", serverURL))
	}
	if environment == "production" && !strings.HasPrefix(serverURL, "https://") {
		errs = append(errs, fmt.Sprintf("invalid SERVER_URL for production: %s", serverURL))
	}

	trueTimeBaseURL := os.Getenv("TRUE_TIME_BASE_URL")
	if trueTimeBaseURL == "" || !strings.HasPrefix(trueTimeBaseURL, "https://") {
		errs = append(errs, fmt.Sprintf("invalid TRUE_TIME_BASE_URL: %s", trueTimeBaseURL))
	}

	trueTimeAPIKey := os.Getenv("TRUE_TIME_API_KEY")
	if trueTimeAPIKey == "" {
		errs = append(errs, fmt.Sprintf("invalid TRUE_TIME_API_KEY: %s", trueTimeAPIKey))
	}

	userAgent := os.Getenv("USER_AGENT")
	if userAgent == "" {
		errs = append(errs, "invalid USER_AGENT: cannot be empty")
	}

	if len(errs) > 0 {
		return env{}, fmt.Errorf("errors in environment variables: %s", strings.Join(errs, ", "))
	}

	return env{
		cacheDuration:   cacheDuration,
		dbConnStr:       dbConnStr,
		environment:     environment,
		port:            port,
		serverURL:       serverURL,
		trueTimeAPIKey:  trueTimeAPIKey,
		trueTimeBaseURL: trueTimeBaseURL,
		userAgent:       userAgent,
	}, nil
}
