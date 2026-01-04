package server

import (
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
)

type Server struct {
	deps deps.Deps
}

func NewServer(deps deps.Deps) *Server {
	return &Server{deps: deps}
}
