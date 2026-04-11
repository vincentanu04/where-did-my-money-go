package app_service_shared

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetNotificationsBadge(ctx context.Context, d deps.Deps) (oapi.GetNotificationsBadgeResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	friendCount, err := d.DB.CountPendingFriendRequests(ctx, userID)
	if err != nil {
		return nil, err
	}

	shareCount, err := d.DB.CountPendingSharedSplitsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	return oapi.GetNotificationsBadge200JSONResponse{
		FriendRequests: int(friendCount),
		PendingShares:  int(shareCount),
	}, nil
}
