package server

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	app_service_auth "github.com/vincentanu04/where-did-my-money-go/internal/app_service/auth"
	app_service_budget "github.com/vincentanu04/where-did-my-money-go/internal/app_service/budget"
	app_service_expenses "github.com/vincentanu04/where-did-my-money-go/internal/app_service/expenses"
	app_service_friends "github.com/vincentanu04/where-did-my-money-go/internal/app_service/friends"
	app_service_shared "github.com/vincentanu04/where-did-my-money-go/internal/app_service/shared_expenses"
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

// (GET /expenses/daily-totals)
func (s *Server) GetExpensesDailyTotals(ctx context.Context, request oapi.GetExpensesDailyTotalsRequestObject) (oapi.GetExpensesDailyTotalsResponseObject, error) {
	totals, err := app_service_expenses.GetDailyTotals(ctx, s.deps, request.Params.Month, request.Params.Year)
	if err != nil {
		return nil, err
	}
	return oapi.GetExpensesDailyTotals200JSONResponse(totals), nil
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
	return app_service_expenses.UpdateExpense(
		ctx,
		s.deps,
		request.Id,
		request.Body.Amount,
		request.Body.Remark,
	)
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

// (GET /friends)
func (s *Server) GetFriends(ctx context.Context, request oapi.GetFriendsRequestObject) (oapi.GetFriendsResponseObject, error) {
	return app_service_friends.GetFriends(ctx, s.deps)
}

// (POST /friends/request)
func (s *Server) PostFriendsRequest(ctx context.Context, request oapi.PostFriendsRequestRequestObject) (oapi.PostFriendsRequestResponseObject, error) {
	return app_service_friends.PostFriendsRequest(ctx, s.deps, request.Body.Email)
}

// (GET /friends/requests)
func (s *Server) GetFriendsRequests(ctx context.Context, request oapi.GetFriendsRequestsRequestObject) (oapi.GetFriendsRequestsResponseObject, error) {
	return app_service_friends.GetFriendsRequests(ctx, s.deps)
}

// (POST /friends/{id}/accept)
func (s *Server) PostFriendsIdAccept(ctx context.Context, request oapi.PostFriendsIdAcceptRequestObject) (oapi.PostFriendsIdAcceptResponseObject, error) {
	return app_service_friends.PostFriendsIdAccept(ctx, s.deps, request.Id)
}

// (POST /friends/{id}/reject)
func (s *Server) PostFriendsIdReject(ctx context.Context, request oapi.PostFriendsIdRejectRequestObject) (oapi.PostFriendsIdRejectResponseObject, error) {
	return app_service_friends.PostFriendsIdReject(ctx, s.deps, request.Id)
}

// (DELETE /friends/{id})
func (s *Server) DeleteFriendsId(ctx context.Context, request oapi.DeleteFriendsIdRequestObject) (oapi.DeleteFriendsIdResponseObject, error) {
	return app_service_friends.DeleteFriendsId(ctx, s.deps, request.Id)
}

// (POST /expenses/{id}/share)
func (s *Server) PostExpensesIdShare(ctx context.Context, request oapi.PostExpensesIdShareRequestObject) (oapi.PostExpensesIdShareResponseObject, error) {
	return app_service_shared.PostExpensesIdShare(ctx, s.deps, request.Id, request.Body.Splits)
}

// (GET /expenses/shared/pending)
func (s *Server) GetExpensesSharedPending(ctx context.Context, request oapi.GetExpensesSharedPendingRequestObject) (oapi.GetExpensesSharedPendingResponseObject, error) {
	return app_service_shared.GetExpensesSharedPending(ctx, s.deps)
}

// (POST /expenses/shared/{shareId}/accept)
func (s *Server) PostExpensesSharedShareIdAccept(ctx context.Context, request oapi.PostExpensesSharedShareIdAcceptRequestObject) (oapi.PostExpensesSharedShareIdAcceptResponseObject, error) {
	return app_service_shared.PostExpensesSharedShareIdAccept(ctx, s.deps, request.ShareId)
}

// (POST /expenses/shared/{shareId}/reject)
func (s *Server) PostExpensesSharedShareIdReject(ctx context.Context, request oapi.PostExpensesSharedShareIdRejectRequestObject) (oapi.PostExpensesSharedShareIdRejectResponseObject, error) {
	return app_service_shared.PostExpensesSharedShareIdReject(ctx, s.deps, request.ShareId)
}

// (GET /notifications/badge)
func (s *Server) GetNotificationsBadge(ctx context.Context, request oapi.GetNotificationsBadgeRequestObject) (oapi.GetNotificationsBadgeResponseObject, error) {
	return app_service_shared.GetNotificationsBadge(ctx, s.deps)
}

// (GET /budget/settings)
func (s *Server) GetBudgetSettings(ctx context.Context, request oapi.GetBudgetSettingsRequestObject) (oapi.GetBudgetSettingsResponseObject, error) {
	return app_service_budget.GetBudgetSettings(ctx, s.deps)
}

// (PUT /budget/settings)
func (s *Server) PutBudgetSettings(ctx context.Context, request oapi.PutBudgetSettingsRequestObject) (oapi.PutBudgetSettingsResponseObject, error) {
	return app_service_budget.PutBudgetSettings(ctx, s.deps, request.Body)
}

// (GET /budget/summary)
func (s *Server) GetBudgetSummary(ctx context.Context, request oapi.GetBudgetSummaryRequestObject) (oapi.GetBudgetSummaryResponseObject, error) {
	return app_service_budget.GetBudgetSummary(ctx, s.deps, request.Params.Tz)
}

// (GET /budget/history)
func (s *Server) GetBudgetHistory(ctx context.Context, request oapi.GetBudgetHistoryRequestObject) (oapi.GetBudgetHistoryResponseObject, error) {
	return app_service_budget.GetBudgetHistory(ctx, s.deps, request.Params.Tz, request.Params.Limit)
}
