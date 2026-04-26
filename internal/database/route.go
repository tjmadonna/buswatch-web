package database

import "context"

func (d *Database) DoesRouteExist(routeID string, ctx context.Context) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM routes WHERE id = ?)`

	var exists bool
	err := d.db.QueryRowContext(ctx, query, routeID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
