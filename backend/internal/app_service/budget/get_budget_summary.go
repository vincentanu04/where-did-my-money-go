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

func GetBudgetSummary(ctx context.Context, d deps.Deps, tz string) (oapi.GetBudgetSummaryResponseObject, error) {
	userID := middleware.UserIDFromContext(ctx)

	settings, err := d.DB.GetBudgetSettings(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return oapi.GetBudgetSummary404Response{}, nil
		}
		return nil, err
	}

	if !settings.Active {
		return oapi.GetBudgetSummary404Response{}, nil
	}

	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	dailyAmount := int(settings.DailyAmount)
	weekStartDay := int(settings.WeekStartDay)

	var periodStartLocal, periodEndLocal time.Time
	if settings.ResetPeriod == "weekly" {
		weekday := int(todayStart.Weekday()) // Go: Sunday=0
		daysSinceStart := (weekday - weekStartDay + 7) % 7
		periodStartLocal = todayStart.AddDate(0, 0, -daysSinceStart)
		periodEndLocal = periodStartLocal.AddDate(0, 0, 7) // exclusive
	} else {
		periodStartLocal = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		periodEndLocal = periodStartLocal.AddDate(0, 1, 0) // exclusive
	}

	D := int(periodEndLocal.Sub(periodStartLocal).Hours() / 24)
	P := dailyAmount * D

	expenses, err := d.DB.ListExpensesByUserAndRange(ctx, sqlc.ListExpensesByUserAndRangeParams{
		UserID:        userID,
		ExpenseDate:   periodStartLocal.UTC(),
		ExpenseDate_2: periodEndLocal.UTC(),
	})
	if err != nil {
		return nil, err
	}

	// Bucket expenses by local day
	dailySpend := make(map[string]int)
	for _, e := range expenses {
		localTime := e.ExpenseDate.In(loc)
		dayKey := localTime.Format("2006-01-02")
		dailySpend[dayKey] += int(e.Amount)
	}

	todayKey := todayStart.Format("2006-01-02")
	breakdown := make([]oapi.BudgetDayBreakdown, 0, D)
	cumSpent := 0 // running sum of past days only
	todayAllowance := 0
	spentToday := 0

	for i := 0; i < D; i++ {
		dayLocal := periodStartLocal.AddDate(0, 0, i)
		dayKey := dayLocal.Format("2006-01-02")
		daysLeft := D - i
		allowanceForDay := (P - cumSpent) / daysLeft
		if allowanceForDay < 0 {
			allowanceForDay = 0
		}

		if dayKey < todayKey {
			spend := dailySpend[dayKey]
			cumSpent += spend
			spentCopy := spend
			breakdown = append(breakdown, oapi.BudgetDayBreakdown{
				Date:      openapi_types.Date{Time: dayLocal},
				Spent:     &spentCopy,
				Allowance: allowanceForDay,
			})
		} else if dayKey == todayKey {
			todayAllowance = allowanceForDay
			spentToday = dailySpend[dayKey]
			spentCopy := spentToday
			breakdown = append(breakdown, oapi.BudgetDayBreakdown{
				Date:      openapi_types.Date{Time: dayLocal},
				Spent:     &spentCopy,
				Allowance: allowanceForDay,
			})
		} else {
			breakdown = append(breakdown, oapi.BudgetDayBreakdown{
				Date:      openapi_types.Date{Time: dayLocal},
				Spent:     nil,
				Allowance: todayAllowance,
			})
		}
	}

	S := cumSpent
	T := spentToday
	remainingToday := todayAllowance - T
	remainingPeriod := P - S - T

	var status oapi.BudgetSummaryStatus
	if remainingPeriod < 0 {
		status = oapi.OverPeriod
	} else if remainingToday < 0 {
		status = oapi.OverToday
	} else if todayAllowance > 0 && remainingToday*2 >= todayAllowance {
		status = oapi.OnTrack
	} else {
		status = oapi.GettingClose
	}

	periodEndInclusive := periodEndLocal.AddDate(0, 0, -1)

	return oapi.GetBudgetSummary200JSONResponse{
		PeriodStart:     openapi_types.Date{Time: periodStartLocal},
		PeriodEnd:       openapi_types.Date{Time: periodEndInclusive},
		PeriodTotal:     P,
		SpentSoFar:      S,
		SpentToday:      T,
		TodayAllowance:  todayAllowance,
		RemainingToday:  remainingToday,
		RemainingPeriod: remainingPeriod,
		Status:          status,
		DailyBreakdown:  breakdown,
	}, nil
}
