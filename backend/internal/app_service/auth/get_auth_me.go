package app_service_auth

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
)

func GetAuthMe(ctx context.Context, deps deps.Deps) (oapi.GetAuthMeResponseObject, error) {
	// If we reached here, middleware already validated JWT

	return oapi.GetAuthMe204Response{}, nil
}
