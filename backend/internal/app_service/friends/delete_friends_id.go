package app_service_friends

import (
	"context"

	"github.com/google/uuid"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func DeleteFriendsId(ctx context.Context, d deps.Deps, id uuid.UUID) (oapi.DeleteFriendsIdResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	err := d.DB.DeleteFriendship(ctx, sqlc.DeleteFriendshipParams{
		ID:          id,
		RequesterID: userID,
	})
	if err != nil {
		return nil, err
	}

	return oapi.DeleteFriendsId204Response{}, nil
}
