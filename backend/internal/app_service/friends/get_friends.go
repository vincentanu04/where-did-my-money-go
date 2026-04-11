package app_service_friends

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetFriends(ctx context.Context, d deps.Deps) (oapi.GetFriendsResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	friendships, err := d.DB.ListAcceptedFriendships(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]oapi.Friend, 0, len(friendships))
	for _, f := range friendships {
		// Determine which side is the friend
		friendID := f.AddresseeID
		if f.AddresseeID == userID {
			friendID = f.RequesterID
		}

		user, err := d.DB.GetUserById(ctx, friendID)
		if err != nil {
			return nil, err
		}

		result = append(result, oapi.Friend{
			FriendshipId: f.ID,
			Id:           user.ID,
			Email:        user.Email,
		})
	}

	return oapi.GetFriends200JSONResponse(result), nil
}
