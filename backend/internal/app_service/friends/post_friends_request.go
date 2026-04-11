package app_service_friends

import (
	"context"

	"github.com/jackc/pgx/v5"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PostFriendsRequest(ctx context.Context, d deps.Deps, email string) (oapi.PostFriendsRequestResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	target, err := d.DB.GetUserByEmail(ctx, email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return oapi.PostFriendsRequest404Response{}, nil
		}
		return nil, err
	}

	// Check for existing relationship
	existing, err := d.DB.GetFriendshipByPair(ctx, sqlc.GetFriendshipByPairParams{
		RequesterID: userID,
		AddresseeID: target.ID,
	})
	if err != nil && err != pgx.ErrNoRows {
		return nil, err
	}
	if err == nil && (existing.Status == "accepted" || existing.Status == "pending") {
		return oapi.PostFriendsRequest409Response{}, nil
	}

	_, err = d.DB.CreateFriendship(ctx, sqlc.CreateFriendshipParams{
		RequesterID: userID,
		AddresseeID: target.ID,
	})
	if err != nil {
		return nil, err
	}

	return oapi.PostFriendsRequest204Response{}, nil
}
