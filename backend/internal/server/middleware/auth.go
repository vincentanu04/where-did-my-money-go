package middleware

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

type userIDContextKeyType struct{}

var userIDContextKey = userIDContextKeyType{}

const COOKIE_NAME = "access_token"

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// PUBLIC ROUTES
		if r.Method == http.MethodPost && r.URL.Path == "/api/auth/login" {
			next.ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodPost && r.URL.Path == "/api/auth/register" {
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie(COOKIE_NAME)
		if err != nil {
			log.Println("HERE 1", err)
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := jwt.ParseWithClaims(
			cookie.Value,
			&jwt.RegisteredClaims{},
			func(t *jwt.Token) (interface{}, error) {
				return []byte(os.Getenv("JWT_SECRET")), nil
			},
		)

		if err != nil || !token.Valid {
			log.Println("HERE 2")
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(*jwt.RegisteredClaims)
		ctx := context.WithValue(r.Context(), userIDContextKey, claims.Subject)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserIDFromContext(ctx context.Context) uuid.UUID {
	userID, _ := ctx.Value(userIDContextKey).(string)
	return uuid.MustParse(userID)
}
