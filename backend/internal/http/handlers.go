package http

import (
	"context"
	"time"

	"github.com/google/uuid"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	app_service "github.com/vincentanu04/where-did-my-money-go/internal/app_service/auth"
)

// (GET /expenses)
func (s *Server) GetExpenses(ctx context.Context, request oapi.GetExpensesRequestObject) (oapi.GetExpensesResponseObject, error) {
	_ = request.Params // "2026-01-02"

	return oapi.GetExpenses200JSONResponse([]oapi.Expense{
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
func (s *Server) PostExpenses(ctx context.Context, request oapi.PostExpensesRequestObject) (oapi.PostExpensesResponseObject, error) {
	payload := request.Body

	return oapi.PostExpenses201JSONResponse(oapi.Expense{
		Id:       uuid.New(),
		Category: payload.Category,
		Amount:   payload.Amount,
		Date:     payload.Date,
	}), nil
}

// (GET /summary)
func (s *Server) GetSummary(ctx context.Context, request oapi.GetSummaryRequestObject) (oapi.GetSummaryResponseObject, error) {
	return oapi.GetSummary200JSONResponse([]oapi.CategorySummary{
		{
			Total:    550,
			Category: "s",
		},
	},
	), nil
}

// (POST /auth/login)
func (s *Server) PostAuthLogin(ctx context.Context, request oapi.PostAuthLoginRequestObject) (oapi.PostAuthLoginResponseObject, error) {
	res, err := app_service.PostAuthLogin(ctx, request.Body.Email, request.Body.Password)
	if err != nil {
		return nil, err
	}

	return res, nil
}

// (POST /auth/logout)
func (s *Server) PostAuthLogout(ctx context.Context, request oapi.PostAuthLogoutRequestObject) (oapi.PostAuthLogoutResponseObject, error) {
	err := app_service.PostAuthLogout(ctx)
	if err != nil {
		return nil, err
	}

	return oapi.PostAuthLogout204Response{}, nil
}
