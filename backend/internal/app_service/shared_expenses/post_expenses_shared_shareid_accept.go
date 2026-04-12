package app_service_shared

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PostExpensesSharedShareIdAccept(ctx context.Context, d deps.Deps, shareID uuid.UUID) (oapi.PostExpensesSharedShareIdAcceptResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	split, err := d.DB.GetSharedSplitByID(ctx, shareID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.PostExpensesSharedShareIdAccept404Response{}, nil
		}
		return nil, err
	}

	if split.SharedWithUserID != userID || split.Status != "pending" {
		return oapi.PostExpensesSharedShareIdAccept404Response{}, nil
	}

	// Determine category and date from source expense (if still exists)
	category := "Shared"
	var expenseDate = split.CreatedAt
	remark := pgtype.Text{String: "Shared expense", Valid: true}
	if split.SourceExpenseID.Valid {
		source, err := d.DB.GetExpenseByID(ctx, split.SourceExpenseID.Bytes)
		if err == nil {
			category = source.Category
			expenseDate = source.ExpenseDate
			if source.Remark.Valid && source.Remark.String != "" {
				remark = source.Remark
			}
		}
	}

	// Create expense in recipient's ledger
	newExpense, err := d.DB.CreateExpense(ctx, sqlc.CreateExpenseParams{
		UserID:      userID,
		Category:    category,
		Amount:      split.SplitAmount,
		ExpenseDate: expenseDate,
		Remark:      remark,
	})
	if err != nil {
		return nil, err
	}

	// Link split to new expense and mark accepted
	recipientExpenseUUID := pgtype.UUID{Bytes: newExpense.ID, Valid: true}
	_, err = d.DB.SetSplitRecipientExpense(ctx, sqlc.SetSplitRecipientExpenseParams{
		ID:                 shareID,
		RecipientExpenseID: recipientExpenseUUID,
	})
	if err != nil {
		return nil, err
	}

	// Deduct split amount from sharer's expense now that it's accepted
	if split.SourceExpenseID.Valid {
		srcExpense, srcErr := d.DB.GetExpenseByID(ctx, split.SourceExpenseID.Bytes)
		if srcErr == nil {
			_, _ = d.DB.UpdateExpense(ctx, sqlc.UpdateExpenseParams{
				ID:          split.SourceExpenseID.Bytes,
				UserID:      split.SharedByUserID,
				Category:    srcExpense.Category,
				Amount:      srcExpense.Amount - split.SplitAmount,
				ExpenseDate: srcExpense.ExpenseDate,
				Remark:      srcExpense.Remark,
			})
		}
	}

	return oapi.PostExpensesSharedShareIdAccept201JSONResponse{
		Id:       newExpense.ID,
		Category: newExpense.Category,
		Amount:   int(newExpense.Amount),
		Date:     newExpense.ExpenseDate,
	}, nil
}
