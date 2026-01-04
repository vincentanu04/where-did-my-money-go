package app_service_auth

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
)

func PostAuthLogout(ctx context.Context) (oapi.PostAuthLogoutResponseObject, error) {
	return oapi.PostAuthLogout204Response{
		Headers: oapi.PostAuthLogout204ResponseHeaders{
			SetCookie: (*createLogoutCookie()).String(),
		},
	}, nil
}
