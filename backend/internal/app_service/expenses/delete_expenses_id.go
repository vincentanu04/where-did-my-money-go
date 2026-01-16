package app_service_expenses

import (
	"context"

	"github.com/google/uuid"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func DeleteExpense(ctx context.Context, deps deps.Deps, expenseId uuid.UUID) error {
	userID := middleware.UserIDFromContext(ctx)

	// check if expense exists and belongs to user
	_, err := deps.DB.GetExpenseByIDAndUser(
		ctx,
		sqlc.GetExpenseByIDAndUserParams{
			ID:     expenseId,
			UserID: userID,
		},
	)
	if err != nil {
		return err
	}

	err = deps.DB.DeleteExpense(ctx, expenseId)
	if err != nil {
		return err
	}

	return nil
}
