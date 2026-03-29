package application

import (
	"encoding/json"
	"maps"
	"net/http"
)

type ResponseData map[string]any

// WriteJSON writes the data to the ResponseWriter as JSON
func (app *Application) WriteJSON(w http.ResponseWriter, status int, data ResponseData, headers http.Header) error {
	maps.Copy(w.Header(), headers)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	// json.Marshal produces compact JSON by default
	js, err := json.Marshal(data)
	if err != nil {
		return err
	}

	_, err = w.Write(js)
	if err != nil {
		return err
	}

	return nil
}

// WriteBadRequestResponse sends a 400 Bad Request response with the error message
func (app *Application) WriteBadRequestResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusBadRequest, message)
}

// WriteUnauthorizedResponse sends a 401 Unauthorized response with the error message
func (app *Application) WriteUnauthorizedResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusUnauthorized, message)
}

// WriteForbiddenResponse sends a 403 Forbidden response with the error message
func (app *Application) WriteForbiddenResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusForbidden, message)
}

// WriteNotFoundResponse sends a 404 Not Found response with the error message
func (app *Application) WriteNotFoundResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusNotFound, message)
}

// WriteMethodNotAllowedResponse sends a 405 Method Not Allowed response with the error message
func (app *Application) WriteMethodNotAllowedResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusMethodNotAllowed, message)
}

// WriteConflictResponse sends a 409 Conflict response with the error message
func (app *Application) WriteConflictResponse(w http.ResponseWriter, r *http.Request, message string) {
	app.writeErrorResponse(w, r, http.StatusConflict, message)
}

// WriteUnprocessableEntityResponse sends a 422 Unprocessable Entity response with the error messages
func (app *Application) WriteUnprocessableEntityResponse(w http.ResponseWriter, r *http.Request, errors map[string][]string) {
	app.writeErrorResponse(w, r, http.StatusUnprocessableEntity, errors)
}

// InternalServerErrorResponse logs the error and sends a 500 Internal Server Error response
func (app *Application) WriteInternalServerErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	app.LogError(r, err)
	message := "The server encountered a problem and could not process your request"
	app.writeErrorResponse(w, r, http.StatusInternalServerError, message)
}

// writeErrorResponse sends a JSON response with status code and message
func (app *Application) writeErrorResponse(w http.ResponseWriter, r *http.Request, status int, message any) {
	env := ResponseData{"error": message}

	err := app.WriteJSON(w, status, env, nil)
	if err != nil {
		app.LogError(r, err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}
