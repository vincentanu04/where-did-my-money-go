package app_service_expenses

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

	// Cancel any pending splits before deleting
	_ = deps.DB.CancelPendingSplitsForExpense(ctx, pgtype.UUID{Bytes: expenseId, Valid: true})

	return deps.DB.DeleteExpense(ctx, sqlc.DeleteExpenseParams{
		ID:     expenseId,
		UserID: userID,
	})
}
