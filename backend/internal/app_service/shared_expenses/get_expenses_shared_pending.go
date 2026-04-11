package app_service_shared

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetExpensesSharedPending(ctx context.Context, d deps.Deps) (oapi.GetExpensesSharedPendingResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	splits, err := d.DB.ListPendingSplitsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]oapi.PendingShare, 0, len(splits))
	for _, s := range splits {
		// Skip splits where the source expense was deleted
		if !s.SourceExpenseID.Valid {
			continue
		}

		sourceExpenseID := s.SourceExpenseID.Bytes

		expense, err := d.DB.GetExpenseByID(ctx, sourceExpenseID)
		if err != nil {
			continue // source expense deleted between query and here
		}

		sharer, err := d.DB.GetUserById(ctx, s.SharedByUserID)
		if err != nil {
			return nil, err
		}

		result = append(result, oapi.PendingShare{
			Id:            s.ID,
			SplitAmount:   int(s.SplitAmount),
			OriginalTotal: int(s.OriginalTotal),
			Category:      expense.Category,
			ExpenseDate:   expense.ExpenseDate,
			SharedByEmail: sharer.Email,
			SharedById:    s.SharedByUserID,
		})
	}

	return oapi.GetExpensesSharedPending200JSONResponse(result), nil
}

// helper: convert pgtype.UUID bytes to pgtype.UUID
func uuidToPgtypeUUID(id [16]byte) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
