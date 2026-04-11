package app_service_shared

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PostExpensesSharedShareIdReject(ctx context.Context, d deps.Deps, shareID uuid.UUID) (oapi.PostExpensesSharedShareIdRejectResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	split, err := d.DB.GetSharedSplitByID(ctx, shareID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.PostExpensesSharedShareIdReject404Response{}, nil
		}
		return nil, err
	}

	if split.SharedWithUserID != userID || split.Status != "pending" {
		return oapi.PostExpensesSharedShareIdReject404Response{}, nil
	}

	_, err = d.DB.UpdateSharedSplitStatus(ctx, sqlc.UpdateSharedSplitStatusParams{
		ID:     shareID,
		Status: "rejected",
	})
	if err != nil {
		return nil, err
	}

	return oapi.PostExpensesSharedShareIdReject204Response{}, nil
}
