package server

import (
	"context"

	"github.com/google/uuid"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	app_service_auth "github.com/vincentanu04/where-did-my-money-go/internal/app_service/auth"
	app_service_expenses "github.com/vincentanu04/where-did-my-money-go/internal/app_service/expenses"
)

// (GET /expenses)
func (s *Server) GetExpenses(ctx context.Context, request oapi.GetExpensesRequestObject) (oapi.GetExpensesResponseObject, error) {
	_ = request.Params // "2026-01-02"

	expenses, err := app_service_expenses.GetExpenses(ctx, s.deps, request.Params.Date)
	if err != nil {
		return nil, err
	}

	return oapi.GetExpenses200JSONResponse(expenses), nil
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
	res, err := app_service_auth.PostAuthLogin(ctx, s.deps, request.Body.Email, request.Body.Password)
	if err != nil {
		return nil, err
	}

	return res, nil
}

// (POST /auth/logout)
func (s *Server) PostAuthLogout(ctx context.Context, request oapi.PostAuthLogoutRequestObject) (oapi.PostAuthLogoutResponseObject, error) {
	err := app_service_auth.PostAuthLogout(ctx)
	if err != nil {
		return nil, err
	}

	return oapi.PostAuthLogout204Response{}, nil
}

// (POST /auth/register)
func (s *Server) PostAuthRegister(ctx context.Context, request oapi.PostAuthRegisterRequestObject) (oapi.PostAuthRegisterResponseObject, error) {
	return nil, nil
}
