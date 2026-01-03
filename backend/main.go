package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	api "github.com/vincentanu04/where-did-my-money-go/generated/server"
	httpHandlers "github.com/vincentanu04/where-did-my-money-go/internal/http"
)

func main() {
	r := chi.NewRouter()

	r.Use(cors.Handler(corsOptions()))

	server := api.NewStrictHandlerWithOptions(
		httpHandlers.NewServer(),
		[]api.StrictMiddlewareFunc{},
		api.StrictHTTPServerOptions{},
	)
	handler := api.HandlerFromMux(server, r)

	log.Println("Listening on :8080")
	http.ListenAndServe(":8080", handler)
}

func corsOptions() cors.Options {
	if os.Getenv("APP_ENV") == "prod" {
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
