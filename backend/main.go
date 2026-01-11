package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/db"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
	"github.com/vincentanu04/where-did-my-money-go/jobs"
)

func main() {
	_ = godotenv.Load()
	router := chi.NewRouter()

	router.Use(cors.Handler(corsOptions()))
	apiRouter := chi.NewRouter()
	router.Use(chi_middleware.Recoverer)
	apiRouter.Use(middleware.Auth)
	apiRouter.Use(middleware.RateLimit)

	ctx := context.Background()
	pool, err := db.New(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	jobs.KeepDBAlive(ctx, pool)
	queries := sqlc.New(pool)

	handler := oapi.NewStrictHandlerWithOptions(
		server.NewServer(deps.Deps{DB: queries}),
		[]oapi.StrictMiddlewareFunc{},
		oapi.StrictHTTPServerOptions{},
	)

	oapi.HandlerFromMux(handler, apiRouter)

	router.Mount("/api", apiRouter)

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		// Only handle non-API paths
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		path := "./frontend/dist" + r.URL.Path
		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, "./frontend/dist/index.html")
			return
		}

		http.ServeFile(w, r, path)
	})

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
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
