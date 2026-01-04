package app_service_auth

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
	"golang.org/x/crypto/bcrypt"
)

func PostAuthLogin(ctx context.Context, deps deps.Deps, email string, password string) (oapi.PostAuthLoginResponseObject, error) {
	db := deps.DB

	user, err := db.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, err
	}

	cookie, err := createLoginCookie(user.ID.String())
	if err != nil {
		return nil, err
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

func createLoginCookie(userId string) (*http.Cookie, error) {
	token, err := createJWT(userId)
	if err != nil {
		return nil, err
	}

	cookie := http.Cookie{
		Name:     middleware.COOKIE_NAME,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "prod",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   604800, // 7 days
	}

	return &cookie, nil
}

func createLogoutCookie() *http.Cookie {
	return &http.Cookie{
		Name:     middleware.COOKIE_NAME,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "prod",
		SameSite: http.SameSiteLaxMode,

		Expires: time.Unix(0, 0),
		MaxAge:  -1,
	}
}
