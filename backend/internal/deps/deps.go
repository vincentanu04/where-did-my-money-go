package deps

import sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"

type Deps struct {
	DB *sqlc.Queries
}
