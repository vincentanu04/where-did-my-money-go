package app_service_expenses

import (
	"context"
	"time"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetDailyTotals(ctx context.Context, deps deps.Deps, month int, year int) ([]oapi.DailyTotal, error) {
	db := deps.DB
	userID := middleware.UserIDFromContext(ctx)

	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)

	expenses, err := db.ListExpensesByUserAndRange(ctx, sqlc.ListExpensesByUserAndRangeParams{
		UserID:        userID,
		ExpenseDate:   start,
		ExpenseDate_2: end,
	})
	if err != nil {
		return nil, err
	}

	totals := make(map[int]int)
	for _, e := range expenses {
		day := e.ExpenseDate.Day()
		totals[day] += int(e.Amount)
	}

	result := make([]oapi.DailyTotal, 0, len(totals))
	for day, total := range totals {
		result = append(result, oapi.DailyTotal{Date: day, Total: total})
	}

	return result, nil
}
