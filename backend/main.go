package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	api "github.com/vincentanu04/where-did-my-money-go/generated/server"
	httpHandlers "github.com/vincentanu04/where-did-my-money-go/internal/http"
)

func main() {
	r := chi.NewRouter()

	server := httpHandlers.NewServer()
	handler := api.HandlerFromMux(server, r)

	log.Println("Listening on :8080")
	http.ListenAndServe(":8080", handler)
}
