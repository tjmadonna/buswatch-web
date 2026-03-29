package database

import (
	"context"
)

// GetRTPIDataFeeds retrieves distinct RTPI data feeds associated with a given stop code.
func (d *Database) GetRTPIDataFeeds(code string, ctx context.Context) ([]string, error) {
	query := `
		SELECT DISTINCT r.rtpidatafeed
		FROM stops AS s
		INNER JOIN routes_stops AS rs ON rs.stop_id = s.id
		INNER JOIN routes AS r ON r.id = rs.route_id
		WHERE s.code = ?
	`
	rows, err := d.db.QueryContext(ctx, query, code)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feeds []string
	for rows.Next() {
		var feed string
		if err := rows.Scan(&feed); err != nil {
			return nil, err
		}
		feeds = append(feeds, feed)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return feeds, nil
}
