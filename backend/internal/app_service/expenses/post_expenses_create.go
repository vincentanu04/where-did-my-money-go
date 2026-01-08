package app_service_expenses

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PostExpensesCreate(ctx context.Context, deps deps.Deps, date oapi.Date, amount int, category string, remark *string) (*oapi.Expense, error) {
	db := deps.DB
	userID := middleware.UserIDFromContext(ctx)

	expenseDate := time.Date(
		date.Year,
		time.Month(date.Month),
		date.Date,
		0, 0, 0, 0,
		time.UTC,
	)

	expense, err := db.CreateExpense(ctx, sqlc.CreateExpenseParams{
		UserID:      userID,
		Category:    category,
		Amount:      int32(amount),
		ExpenseDate: expenseDate,
		Remark:      pgtype.Text{String: *remark, Valid: remark != nil},
	})
	if err != nil {
		return nil, err
	}

	return &oapi.Expense{
		Id:       expense.ID,
		Category: expense.Category,
		Amount:   int(expense.Amount),
		Date:     expense.ExpenseDate,
	}, nil
}
