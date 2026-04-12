package app_service_budget

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	openapi_types "github.com/oapi-codegen/runtime/types"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetBudgetHistory(ctx context.Context, d deps.Deps, tz string, limit *int) (oapi.GetBudgetHistoryResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	settings, err := d.DB.GetBudgetSettings(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.GetBudgetHistory404Response{}, nil
		}
		return nil, err
	}

	n := 12
	if limit != nil {
		n = *limit
		if n < 1 {
			n = 1
		}
		if n > 24 {
			n = 24
		}
	}

	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	dailyAmount := int(settings.DailyAmount)
	weekStartDay := int(settings.WeekStartDay)

	// Find current period start
	var currentPeriodStart time.Time
	if settings.ResetPeriod == "weekly" {
		weekday := int(todayStart.Weekday())
		daysSinceStart := (weekday - weekStartDay + 7) % 7
		currentPeriodStart = todayStart.AddDate(0, 0, -daysSinceStart)
	} else {
		currentPeriodStart = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	}

	result := make([]oapi.BudgetHistoryEntry, 0, n)

	for i := 1; i <= n; i++ {
		var pastPeriodStart, pastPeriodEnd time.Time

		if settings.ResetPeriod == "weekly" {
			pastPeriodStart = currentPeriodStart.AddDate(0, 0, -7*i)
			pastPeriodEnd = pastPeriodStart.AddDate(0, 0, 7)
		} else {
			pastPeriodStart = currentPeriodStart.AddDate(0, -i, 0)
			pastPeriodEnd = pastPeriodStart.AddDate(0, 1, 0)
		}

		expenses, err := d.DB.ListExpensesByUserAndRange(ctx, sqlc.ListExpensesByUserAndRangeParams{
			UserID:        userID,
			ExpenseDate:   pastPeriodStart.UTC(),
			ExpenseDate_2: pastPeriodEnd.UTC(),
		})
		if err != nil {
			return nil, err
		}

		D := int(pastPeriodEnd.Sub(pastPeriodStart).Hours() / 24)
		P := dailyAmount * D

		// Bucket by local day
		dailySpend := make(map[string]int)
		for _, e := range expenses {
			localTime := e.ExpenseDate.In(loc)
			dayKey := localTime.Format("2006-01-02")
			dailySpend[dayKey] += int(e.Amount)
		}

		// Build breakdown with running allowances
		cumSpent := 0
		breakdown := make([]oapi.BudgetDayBreakdown, 0, D)
		for j := 0; j < D; j++ {
			dayLocal := pastPeriodStart.AddDate(0, 0, j)
			dayKey := dayLocal.Format("2006-01-02")
			daysLeft := D - j
			allowanceForDay := (P - cumSpent) / daysLeft
			if allowanceForDay < 0 {
				allowanceForDay = 0
			}

			spend := dailySpend[dayKey]
			cumSpent += spend
			spentCopy := spend
			breakdown = append(breakdown, oapi.BudgetDayBreakdown{
				Date:      openapi_types.Date{Time: dayLocal},
				Spent:     &spentCopy,
				Allowance: allowanceForDay,
			})
		}

		totalSpent := cumSpent
		underOver := totalSpent - P

		var status oapi.BudgetHistoryEntryStatus
		if underOver > 0 {
			status = oapi.OverBudget
		} else {
			status = oapi.UnderBudget
		}

		pastPeriodEndInclusive := pastPeriodEnd.AddDate(0, 0, -1)

		result = append(result, oapi.BudgetHistoryEntry{
			PeriodStart:    openapi_types.Date{Time: pastPeriodStart},
			PeriodEnd:      openapi_types.Date{Time: pastPeriodEndInclusive},
			PeriodTotal:    P,
			TotalSpent:     totalSpent,
			UnderOver:      underOver,
			Status:         status,
			DailyBreakdown: breakdown,
		})
	}

	return oapi.GetBudgetHistory200JSONResponse(result), nil
}
