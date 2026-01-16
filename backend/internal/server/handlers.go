package server

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	app_service_auth "github.com/vincentanu04/where-did-my-money-go/internal/app_service/auth"
	app_service_expenses "github.com/vincentanu04/where-did-my-money-go/internal/app_service/expenses"
)

// (POST /expenses/list)
func (s *Server) PostExpensesList(ctx context.Context, request oapi.PostExpensesListRequestObject) (oapi.PostExpensesListResponseObject, error) {
	expensesByCategory, err := app_service_expenses.GetExpensesByCategory(ctx, s.deps, request.Body.Date, request.Body.Month, request.Body.Year)
	if err != nil {
		return nil, err
	}

	return oapi.PostExpensesList200JSONResponse(expensesByCategory), nil
}

// (POST /expenses/create)
func (s *Server) PostExpensesCreate(ctx context.Context, request oapi.PostExpensesCreateRequestObject) (oapi.PostExpensesCreateResponseObject, error) {
	payload := request.Body

	expense, err := app_service_expenses.PostExpensesCreate(ctx, s.deps, payload.Date, payload.Amount, payload.Category, payload.Remark)
	if err != nil {
		return nil, err
	}

	return oapi.PostExpensesCreate201JSONResponse(*expense), nil
}

// (POST /expenses/export)
func (s *Server) PostExpensesExport(
	ctx context.Context,
	request oapi.PostExpensesExportRequestObject,
) (oapi.PostExpensesExportResponseObject, error) {
	reader, size, err := app_service_expenses.ExportExpensesCSV(
		ctx,
		s.deps,
		*request.Body,
	)
	if err != nil {
		return nil, err
	}

	return oapi.PostExpensesExport200TextcsvResponse{
		Body:          reader,
		ContentLength: size,
	}, nil
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

// (GET /auth/me)
func (s *Server) GetAuthMe(ctx context.Context, request oapi.GetAuthMeRequestObject) (oapi.GetAuthMeResponseObject, error) {
	res, err := app_service_auth.GetAuthMe(ctx, s.deps)
	if err != nil {
		return nil, err
	}

	return res, nil
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
	res, err := app_service_auth.PostAuthLogout(ctx)
	if err != nil {
		return nil, err
	}

	return res, nil
}

// (POST /auth/register)
func (s *Server) PostAuthRegister(ctx context.Context, request oapi.PostAuthRegisterRequestObject) (oapi.PostAuthRegisterResponseObject, error) {
	res, err := app_service_auth.PostAuthRegister(ctx, s.deps, request.Body.Email, request.Body.Password)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (s *Server) PutExpensesId(
	ctx context.Context,
	request oapi.PutExpensesIdRequestObject,
) (oapi.PutExpensesIdResponseObject, error) {
	err := app_service_expenses.UpdateExpense(
		ctx,
		s.deps,
		request.Id,
		request.Body.Amount,
		request.Body.Remark,
	)
	if err != nil {
		return nil, err
	}

	return oapi.PutExpensesId204Response{}, nil
}

// (DELETE /expenses/{id})
func (s *Server) DeleteExpensesId(
	ctx context.Context,
	request oapi.DeleteExpensesIdRequestObject,
) (oapi.DeleteExpensesIdResponseObject, error) {
	err := app_service_expenses.DeleteExpense(ctx, s.deps, request.Id)
	if err != nil {
		return nil, err
	}

	return oapi.DeleteExpensesId204Response{}, nil
}
