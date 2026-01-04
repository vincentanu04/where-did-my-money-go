package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	httpHandlers "github.com/vincentanu04/where-did-my-money-go/internal/http"
	"github.com/vincentanu04/where-did-my-money-go/internal/http/middleware"
)

func main() {
	router := chi.NewRouter()

	router.Use(cors.Handler(corsOptions()))

	server := oapi.NewStrictHandlerWithOptions(
		httpHandlers.NewServer(),
		[]oapi.StrictMiddlewareFunc{},
		oapi.StrictHTTPServerOptions{},
	)

	// public routes
	router.Route("/auth/login", func(r chi.Router) {
		oapi.HandlerFromMux(server, r)
	})

	// protected routes
	router.Group(func(r chi.Router) {
		r.Use(middleware.Auth)
		oapi.HandlerFromMux(server, r)
	})

	log.Println("Listening on :8080")
	http.ListenAndServe(":8080", router)
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
