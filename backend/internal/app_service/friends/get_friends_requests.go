package app_service_friends

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetFriendsRequests(ctx context.Context, d deps.Deps) (oapi.GetFriendsRequestsResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	requests, err := d.DB.ListPendingIncomingRequests(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]oapi.FriendRequest, 0, len(requests))
	for _, r := range requests {
		requester, err := d.DB.GetUserById(ctx, r.RequesterID)
		if err != nil {
			return nil, err
		}

		result = append(result, oapi.FriendRequest{
			Id:             r.ID,
			RequesterId:    r.RequesterID,
			RequesterEmail: requester.Email,
			CreatedAt:      r.CreatedAt,
		})
	}

	return oapi.GetFriendsRequests200JSONResponse(result), nil
}
