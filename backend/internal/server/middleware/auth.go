package middleware

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v4"
)

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// PUBLIC ROUTES
		if r.Method == http.MethodPost && r.URL.Path == "/auth/login" {
			next.ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodPost && r.URL.Path == "/auth/register" {
			next.ServeHTTP(w, r)
			return
		}

		log.Println("Auth middleware")
		cookie, err := r.Cookie("access_token")
		if err != nil {
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
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(*jwt.RegisteredClaims)
		ctx := context.WithValue(r.Context(), "userID", claims.Subject)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
