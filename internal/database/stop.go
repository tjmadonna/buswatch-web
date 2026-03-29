package database

import (
	"context"
	"strings"
)

type GetStopByCodeResult struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Longitude float64  `json:"longitude"`
	Latitude  float64  `json:"latitude"`
	RouteIDs  []string `json:"route_ids"`
}

func (d *Database) GetStopByCode(code string, ctx context.Context) (GetStopByCodeResult, error) {
	query := `
		SELECT s.code, s.name, s.latitude, s.longitude, GROUP_CONCAT(DISTINCT rs.route_id ORDER BY rs.route_id) AS route_ids
		FROM stops AS s
		INNER JOIN routes_stops AS rs ON rs.stop_id = s.id
		WHERE s.code = ?
		GROUP BY s.code, s.name, s.latitude, s.longitude
	`
	row := d.db.QueryRowContext(ctx, query, code)
	var stop GetStopByCodeResult
	var routeIDs string
	if err := row.Scan(&stop.ID, &stop.Name, &stop.Latitude, &stop.Longitude, &routeIDs); err != nil {
		if err.Error() == "sql: no rows in result set" {
			return GetStopByCodeResult{}, ErrNoRows
		}
		return GetStopByCodeResult{}, err
	}
	stop.RouteIDs = strings.Split(routeIDs, ",")
	return stop, nil
}

func (d *Database) GetStopsByCodes(codes []string, ctx context.Context) ([]GetStopByCodeResult, error) {
	placeholders := "?" + strings.Repeat(",?", len(codes)-1)
	query := `
		SELECT s.code, s.name, s.latitude, s.longitude, GROUP_CONCAT(DISTINCT rs.route_id ORDER BY rs.route_id) AS route_ids
		FROM stops AS s
		INNER JOIN routes_stops AS rs ON rs.stop_id = s.id
		WHERE s.code IN (` + placeholders + `)
		GROUP BY s.code, s.name, s.latitude, s.longitude
	`
	args := make([]any, len(codes))
	for i, code := range codes {
		args[i] = code
	}
	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stops []GetStopByCodeResult
	for rows.Next() {
		var stop GetStopByCodeResult
		var routeIDs string
		if err := rows.Scan(&stop.ID, &stop.Name, &stop.Latitude, &stop.Longitude, &routeIDs); err != nil {
			return nil, err
		}
		stop.RouteIDs = strings.Split(routeIDs, ",")
		stops = append(stops, stop)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return stops, nil
}

type GetStopsInLocationBoundsResult struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	RouteIDs  []string `json:"route_ids"`
}

func (d *Database) GetStopsInLocationBounds(
	north, south, west, east float64, ctx context.Context,
) ([]GetStopsInLocationBoundsResult, error) {
	query := `
		SELECT s.code, s.name, s.latitude, s.longitude, GROUP_CONCAT(DISTINCT rs.route_id ORDER BY rs.route_id) AS route_ids
		FROM stops AS s
		INNER JOIN routes_stops AS rs ON rs.stop_id = s.id
		WHERE s.latitude BETWEEN ? AND ?
		AND s.longitude BETWEEN ? AND ?
		GROUP BY s.code, s.name, s.latitude, s.longitude
	`
	rows, err := d.db.QueryContext(ctx, query, south, north, west, east)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stops []GetStopsInLocationBoundsResult
	for rows.Next() {
		var stop GetStopsInLocationBoundsResult
		var routeIDs string
		if err := rows.Scan(&stop.ID, &stop.Name, &stop.Latitude, &stop.Longitude, &routeIDs); err != nil {
			return nil, err
		}
		stop.RouteIDs = strings.Split(routeIDs, ",")
		stops = append(stops, stop)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return stops, nil
}

func (d *Database) GetStopsBySearchTerm(code string, ctx context.Context) ([]GetStopByCodeResult, error) {
	query := `
		SELECT s.code, s.name, s.latitude, s.longitude, GROUP_CONCAT(DISTINCT rs.route_id ORDER BY rs.route_id) AS route_ids
		FROM stops AS s
		INNER JOIN routes_stops AS rs ON rs.stop_id = s.id
		WHERE s.code LIKE ? OR s.name LIKE ?
		GROUP BY s.code, s.name, s.latitude, s.longitude
	`
	searchTerm := "%" + code + "%"
	rows, err := d.db.QueryContext(ctx, query, searchTerm, searchTerm)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stops []GetStopByCodeResult
	for rows.Next() {
		var stop GetStopByCodeResult
		var routeIDs string
		if err := rows.Scan(&stop.ID, &stop.Name, &stop.Latitude, &stop.Longitude, &routeIDs); err != nil {
			return nil, err
		}
		stop.RouteIDs = strings.Split(routeIDs, ",")
		stops = append(stops, stop)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return stops, nil
}
