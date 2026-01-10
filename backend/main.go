package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/db"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func main() {
	_ = godotenv.Load()
	router := chi.NewRouter()

	router.Use(cors.Handler(corsOptions()))
	router.Use(middleware.Auth)
	router.Use(middleware.RateLimit)

	ctx := context.Background()
	pool, err := db.New(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	queries := sqlc.New(pool)

	handler := oapi.NewStrictHandlerWithOptions(
		server.NewServer(deps.Deps{DB: queries}),
		[]oapi.StrictMiddlewareFunc{},
		oapi.StrictHTTPServerOptions{},
	)

	server := oapi.HandlerFromMux(handler, router)

	log.Println("Listening on :8080")
	http.ListenAndServe(":8080", server)
}

func corsOptions() cors.Options {
	env := os.Getenv("APP_ENV")

	if env == "prod" {
		return cors.Options{
			AllowedOrigins: []string{
				"https://money.yourdomain.com",
			},
			AllowedMethods: []string{
				"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
			},
			AllowedHeaders: []string{
				"Accept", "Authorization", "Content-Type",
			},
			AllowCredentials: true,
			MaxAge:           600,
		}
	}

	// local/dev
	return cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
		},
		AllowedMethods: []string{
			"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept", "Authorization", "Content-Type",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}
}
