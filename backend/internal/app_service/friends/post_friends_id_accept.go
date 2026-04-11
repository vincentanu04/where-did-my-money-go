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

func PostFriendsIdAccept(ctx context.Context, d deps.Deps, id uuid.UUID) (oapi.PostFriendsIdAcceptResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	friendship, err := d.DB.GetFriendshipByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return oapi.PostFriendsIdAccept404Response{}, nil
		}
		return nil, err
	}

	// Only the addressee can accept
	if friendship.AddresseeID != userID || friendship.Status != "pending" {
		return oapi.PostFriendsIdAccept404Response{}, nil
	}

	_, err = d.DB.UpdateFriendshipStatus(ctx, sqlc.UpdateFriendshipStatusParams{
		ID:     id,
		Status: "accepted",
	})
	if err != nil {
		return nil, err
	}

	return oapi.PostFriendsIdAccept204Response{}, nil
}
