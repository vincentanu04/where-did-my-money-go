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

func PostExpensesIdShare(ctx context.Context, d deps.Deps, expenseID uuid.UUID, splits []oapi.ShareSplit) (oapi.PostExpensesIdShareResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	expense, err := d.DB.GetExpenseByIDAndUser(ctx, sqlc.GetExpenseByIDAndUserParams{
		ID:     expenseID,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.PostExpensesIdShare404Response{}, nil
		}
		return nil, err
	}

	// Validate splits
	if len(splits) == 0 {
		return oapi.PostExpensesIdShare400Response{}, nil
	}
	totalSplit := 0
	for _, s := range splits {
		if s.Amount <= 0 {
			return oapi.PostExpensesIdShare400Response{}, nil
		}
		totalSplit += s.Amount
	}
	if totalSplit >= int(expense.Amount) {
		return oapi.PostExpensesIdShare400Response{}, nil
	}

	// Validate all friend IDs are accepted friends
	friendships, err := d.DB.ListAcceptedFriendships(ctx, userID)
	if err != nil {
		return nil, err
	}
	friendSet := make(map[uuid.UUID]bool)
	for _, f := range friendships {
		friendID := f.AddresseeID
		if f.AddresseeID == userID {
			friendID = f.RequesterID
		}
		friendSet[friendID] = true
	}
	for _, s := range splits {
		if !friendSet[s.FriendId] {
			return oapi.PostExpensesIdShare403Response{}, nil
		}
	}

	// Create a split record for each friend
	sourceID := pgtype.UUID{Bytes: expenseID, Valid: true}
	for _, s := range splits {
		_, err = d.DB.CreateSharedExpenseSplit(ctx, sqlc.CreateSharedExpenseSplitParams{
			SourceExpenseID:  sourceID,
			SharedByUserID:   userID,
			SharedWithUserID: s.FriendId,
			SplitAmount:      int32(s.Amount),
			OriginalTotal:    expense.Amount,
		})
		if err != nil {
			return nil, err
		}
	}

	return oapi.PostExpensesIdShare204Response{}, nil
}
