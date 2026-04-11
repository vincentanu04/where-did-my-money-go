package app_service_expenses

import (
	"context"
	"time"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

func GetExpensesByCategory(ctx context.Context, deps deps.Deps, date int, month int, year int) ([]oapi.ExpensesByCategory, error) {
	db := deps.DB
	userID := middleware.UserIDFromContext(ctx)

	start := time.Date(
		year,
		time.Month(month),
		date,
		0, 0, 0, 0,
		time.UTC,
	)

	end := start.Add(24 * time.Hour)

	expenses, err := db.ListExpensesByUserAndRange(ctx, sqlc.ListExpensesByUserAndRangeParams{
		UserID:        userID,
		ExpenseDate:   start,
		ExpenseDate_2: end,
	})
	if err != nil {
		return nil, err
	}

	// Build maps for sharing annotations (2 extra queries, not N+1)
	pendingCounts := make(map[[16]byte]int)
	pendingRows, err := db.ListPendingShareCountsByExpense(ctx, userID)
	if err == nil {
		for _, row := range pendingRows {
			if row.SourceExpenseID.Valid {
				pendingCounts[row.SourceExpenseID.Bytes] = int(row.PendingCount)
			}
		}
	}

	sharedFromEmails := make(map[[16]byte]string)
	recipientRows, err := db.ListSharedFromEmailForRecipient(ctx, userID)
	if err == nil {
		for _, row := range recipientRows {
			if row.RecipientExpenseID.Valid {
				sharedFromEmails[row.RecipientExpenseID.Bytes] = row.SharedByEmail
			}
		}
	}

	grouped := make(map[string][]oapi.Expense)
	categoryOrder := make([]string, 0)

	for _, e := range expenses {
		if _, exists := grouped[e.Category]; !exists {
			categoryOrder = append(categoryOrder, e.Category)
		}

		exp := oapi.Expense{
			Id:       e.ID,
			Category: e.Category,
			Amount:   int(e.Amount),
			Date:     e.ExpenseDate,
			Remark:   &e.Remark.String,
		}
		if count, ok := pendingCounts[e.ID]; ok {
			exp.PendingShareCount = &count
		}
		if email, ok := sharedFromEmails[e.ID]; ok {
			exp.SharedFromEmail = &email
		}

		grouped[e.Category] = append(grouped[e.Category], exp)
	}

	// build response (categories already alphabetical from SQL)
	result := make([]oapi.ExpensesByCategory, 0, len(categoryOrder))
	for _, category := range categoryOrder {
		result = append(result, oapi.ExpensesByCategory{
			Category: category,
			Expenses: grouped[category],
		})
	}

	return result, nil
}
