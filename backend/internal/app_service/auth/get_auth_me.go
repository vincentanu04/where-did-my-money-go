package app_service_auth

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetAuthMe(ctx context.Context, deps deps.Deps) (oapi.GetAuthMeResponseObject, error) {
	// If we reached here, middleware already validated JWT
	userId := middleware.UserIDFromContext(ctx)

	user, err := deps.DB.GetUserById(ctx, userId)
	if err != nil {
		return nil, err
	}

	return oapi.GetAuthMe200JSONResponse{
		Id:        user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.String(),
	}, nil
}
