package database

import (
	"context"
	"strings"
)

type GetTripsByInfoItem struct {
	Destination string
	Direction   string
	RouteID     string
}

type GetTripByInfoResultItem struct {
	Destination string
	Direction   string
	Name        string
	RouteID     string
}

func (d *Database) GetTripsByInfo(info []GetTripsByInfoItem, ctx context.Context) ([]GetTripByInfoResultItem, error) {
	var results []GetTripByInfoResultItem
	if len(info) == 0 {
		return results, nil
	}

	// build the placeholders and args
	valuePlaceholders := make([]string, len(info))
	args := make([]any, len(info)*3)
	for i, item := range info {
		valuePlaceholders[i] = "(?, ?, ?)"
		args[i*3] = strings.ToUpper(item.Direction)
		args[i*3+1] = strings.ToUpper(item.Destination)
		args[i*3+2] = strings.ToUpper(item.RouteID)
	}

	query := `
        SELECT DISTINCT destination, direction, name, route_id
        FROM trips
        WHERE (UPPER(direction), UPPER(destination), UPPER(route_id)) IN (
        	VALUES ` + strings.Join(valuePlaceholders, ", ") + `
        )
	`
	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var result GetTripByInfoResultItem
		if err := rows.Scan(&result.Destination, &result.Direction, &result.Name, &result.RouteID); err != nil {
			return nil, err
		}
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}
