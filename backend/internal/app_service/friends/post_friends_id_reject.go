package app_service_friends

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PostFriendsIdReject(ctx context.Context, d deps.Deps, id uuid.UUID) (oapi.PostFriendsIdRejectResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	friendship, err := d.DB.GetFriendshipByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return oapi.PostFriendsIdReject404Response{}, nil
		}
		return nil, err
	}

	// Only the addressee can reject
	if friendship.AddresseeID != userID || friendship.Status != "pending" {
		return oapi.PostFriendsIdReject404Response{}, nil
	}

	_, err = d.DB.UpdateFriendshipStatus(ctx, sqlc.UpdateFriendshipStatusParams{
		ID:     id,
		Status: "rejected",
	})
	if err != nil {
		return nil, err
	}

	return oapi.PostFriendsIdReject204Response{}, nil
}
