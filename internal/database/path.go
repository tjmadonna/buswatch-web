package database

import "context"

type GetRoutePathPointsByRouteIDResult struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Sequence  int     `json:"sequence"`
}

func (d *Database) GetRoutePathPointsByRouteID(routeID string, ctx context.Context) ([]GetRoutePathPointsByRouteIDResult, error) {
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

	var pathPoints []GetRoutePathPointsByRouteIDResult
	for rows.Next() {
		var pathPoint GetRoutePathPointsByRouteIDResult
		if err := rows.Scan(&pathPoint.Latitude, &pathPoint.Longitude, &pathPoint.Sequence); err != nil {
			return nil, err
		}
		pathPoints = append(pathPoints, pathPoint)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return pathPoints, nil
}
