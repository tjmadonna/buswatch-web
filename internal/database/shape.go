package database

import (
	"context"
)

type GetShapeByRouteIDResult struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Sequence  int     `json:"sequence"`
}

func (d *Database) GetShapesByRouteID(routeID string, ctx context.Context) ([]GetShapeByRouteIDResult, error) {
	query := `
		SELECT s.latitude, s.longitude, s.sequence
		FROM shapes AS s
		INNER JOIN trips AS t ON t.shape_id = s.id
		WHERE t.id = (SELECT id FROM trips WHERE route_id = ? LIMIT 1)
		ORDER BY s.sequence ASC
	`
	rows, err := d.db.QueryContext(ctx, query, routeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shapes []GetShapeByRouteIDResult
	for rows.Next() {
		var shape GetShapeByRouteIDResult
		if err := rows.Scan(&shape.Latitude, &shape.Longitude, &shape.Sequence); err != nil {
			return nil, err
		}
		shapes = append(shapes, shape)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return shapes, nil
}
