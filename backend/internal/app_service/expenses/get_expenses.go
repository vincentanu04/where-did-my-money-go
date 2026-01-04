package app_service_expenses

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/oapi-codegen/runtime/types"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
)

const COOKIE_NAME = "access_token"

func GetExpenses(ctx context.Context, deps deps.Deps, date types.Date) ([]oapi.Expense, error) {

	return []oapi.Expense{
		{
			Id:       uuid.New(),
			Category: "Food",
			Amount:   400,
			Date:     time.Now(),
		},
		{
			Id:       uuid.New(),
			Category: "Transport",
			Amount:   150,
			Date:     time.Now(),
		}}, nil
}
