package app_service

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
)

const COOKIE_NAME = "access_token"

func PostAuthLogin(ctx context.Context, email string, password string) (oapi.PostAuthLoginResponseObject, error) {
	// db lookup

	token, err := createJWT("userID")
	if err != nil {
		return nil, err
	}

	cookie := http.Cookie{
		Name:     COOKIE_NAME,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "prod",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   604800, // 7 days
	}

	res := oapi.PostAuthLogin204Response{
		Headers: oapi.PostAuthLogin204ResponseHeaders{
			SetCookie: cookie.String(),
		},
	}

	return res, nil
}

func createJWT(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(168 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
