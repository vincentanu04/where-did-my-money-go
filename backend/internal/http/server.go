package http

import (
	"context"
	"time"

	"github.com/google/uuid"
	api "github.com/vincentanu04/where-did-my-money-go/generated/server"
)

type Server struct{}

func NewServer() *Server {
	return &Server{}
}

// (GET /expenses)
func (s *Server) GetExpenses(ctx context.Context, request api.GetExpensesRequestObject) (api.GetExpensesResponseObject, error) {
	_ = request.Params // "2026-01-02"

	return api.GetExpenses200JSONResponse([]api.Expense{
		{
			Id:       uuid.New(),
			Category: "Food",
			Amount:   400,
			Date:     time.Now(),
		},
		{
			Id:       uuid.New(),
			Category: "Transport",
			Amount:   150,
			Date:     time.Now(),
		},
	}), nil
}

// (POST /expenses)
func (s *Server) PostExpenses(ctx context.Context, request api.PostExpensesRequestObject) (api.PostExpensesResponseObject, error) {
	payload := request.Body

	return api.PostExpenses201JSONResponse(api.Expense{
		Id:       uuid.New(),
		Category: payload.Category,
		Amount:   payload.Amount,
		Date:     payload.Date,
	}), nil
}

// (GET /summary)
func (s *Server) GetSummary(ctx context.Context, request api.GetSummaryRequestObject) (api.GetSummaryResponseObject, error) {
	return api.GetSummary200JSONResponse([]api.CategorySummary{
		{
			Total:    550,
			Category: "s",
		},
	},
	), nil
}
