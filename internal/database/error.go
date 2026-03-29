package database

import "errors"

var (
	ErrDuplicateRow = errors.New("database: duplicate row")
	ErrNoRows       = errors.New("database: no rows found")
)
