package app_service_budget

import (
	"context"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func PutBudgetSettings(ctx context.Context, d deps.Deps, body *oapi.BudgetSettings) (oapi.PutBudgetSettingsResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	settings, err := d.DB.UpsertBudgetSettings(ctx, sqlc.UpsertBudgetSettingsParams{
		UserID:       userID,
		DailyAmount:  int32(body.DailyAmount),
		ResetPeriod:  string(body.ResetPeriod),
		WeekStartDay: int32(body.WeekStartDay),
		Active:       body.Active,
	})
	if err != nil {
		return nil, err
	}

	return oapi.PutBudgetSettings200JSONResponse{
		DailyAmount:  int(settings.DailyAmount),
		ResetPeriod:  oapi.BudgetSettingsResetPeriod(settings.ResetPeriod),
		WeekStartDay: int(settings.WeekStartDay),
		Active:       settings.Active,
	}, nil
}
