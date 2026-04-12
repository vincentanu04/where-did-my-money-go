package app_service_budget

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetBudgetSettings(ctx context.Context, d deps.Deps) (oapi.GetBudgetSettingsResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	settings, err := d.DB.GetBudgetSettings(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.GetBudgetSettings404Response{}, nil
		}
		return nil, err
	}

	return oapi.GetBudgetSettings200JSONResponse{
		DailyAmount:  int(settings.DailyAmount),
		ResetPeriod:  oapi.BudgetSettingsResetPeriod(settings.ResetPeriod),
		WeekStartDay: int(settings.WeekStartDay),
		Active:       settings.Active,
	}, nil
}
