package app_service_expenses

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func UpdateExpense(
	ctx context.Context,
	deps deps.Deps,
	expenseID uuid.UUID,
	amount *int,
	remark *string,
) error {
	userID := middleware.UserIDFromContext(ctx)

	existing, err := deps.DB.GetExpenseByIDAndUser(
		ctx,
		sqlc.GetExpenseByIDAndUserParams{
			ID:     expenseID,
			UserID: userID,
		},
	)
	if err != nil {
		return err
	}

	updatedAmount := existing.Amount
	if amount != nil {
		updatedAmount = int32(*amount)
	}

	updatedRemark := existing.Remark
	if remark != nil {
		updatedRemark = pgtype.Text{String: *remark, Valid: true}
	}

	_, err = deps.DB.UpdateExpense(
		ctx,
		sqlc.UpdateExpenseParams{
			ID:          expenseID,
			UserID:      userID,
			Category:    existing.Category,
			ExpenseDate: existing.ExpenseDate,
			Amount:      updatedAmount,
			Remark:      updatedRemark,
		},
	)
	if err != nil {
		return err
	}

	return nil
}
