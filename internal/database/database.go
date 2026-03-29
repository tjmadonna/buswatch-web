package database

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

// New creates a new database connection using the provided DSN
func New(dsn string) (*Database, error) {
	db, err := sql.Open("sqlite3", dsn+"?mode=ro&_query_only=1")
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		db.Close()
		return nil, err
	}

	return &Database{
		db: db,
	}, nil
}

// Database holds the database connection
type Database struct {
	db *sql.DB
}

// Close closes the database connection
func (d *Database) Close() error {
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}
