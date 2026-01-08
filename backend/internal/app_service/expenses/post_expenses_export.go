package app_service_expenses

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
)

/*
	Public entry
*/

func ExportExpensesCSV(
	ctx context.Context,
	deps deps.Deps,
	req oapi.ExpenseExportRequest,
) (io.Reader, int64, error) {
	userID := middleware.UserIDFromContext(ctx)

	if req.Type != "monthly" {
		return nil, 0, fmt.Errorf("only monthly export is supported")
	}

	offset := int(*req.MonthOffset)

	rows, year, month, daysInMonth, err := exportMonthly(
		ctx,
		deps,
		userID,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}

	return buildMonthlyCSV(
		year,
		month,
		daysInMonth,
		rows,
	)
}

/*
	DB rows
*/

type ExpenseRow struct {
	Date     time.Time
	Category string
	Amount   int64
	Remark   string
}

/*
	Export strategy
*/

func exportMonthly(
	ctx context.Context,
	deps deps.Deps,
	userID uuid.UUID,
	offset int,
) ([]ExpenseRow, int, time.Month, int, error) {

	now := time.Now().UTC()

	start := time.Date(
		now.Year(),
		now.Month(),
		1,
		0, 0, 0, 0,
		time.UTC,
	).AddDate(0, -offset, 0)

	end := start.AddDate(0, 1, 0)

	sqlcRows, err := deps.DB.ListExpensesByUserAndRange(
		ctx,
		sqlc.ListExpensesByUserAndRangeParams{
			UserID:        userID,
			ExpenseDate:   start,
			ExpenseDate_2: end,
		},
	)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	// map sqlc.Expense → ExpenseRow
	rows := make([]ExpenseRow, len(sqlcRows))
	for i, r := range sqlcRows {
		rows[i] = ExpenseRow{
			Date:     r.ExpenseDate,
			Category: r.Category,
			Amount:   int64(r.Amount),
			Remark:   r.Remark.String, // include remark
		}
	}

	daysInMonth := end.Add(-time.Nanosecond).Day()

	return rows, start.Year(), start.Month(), daysInMonth, nil
}

/*
	CSV
*/

// truncateRemark limits remark length for CSV readability
func truncateRemark(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "…"
}

// normalizeRemark converts multi-line remarks into single line
func normalizeRemark(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", "")
	return strings.TrimSpace(s)
}

func buildMonthlyCSV(
	year int,
	month time.Month,
	daysInMonth int,
	rows []ExpenseRow,
) (io.Reader, int64, error) {

	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)

	// ---- Month header
	_, _ = buf.WriteString(fmt.Sprintf("%s %d\n\n", month.String(), year))

	// ---- Compute dynamic categories from the DB
	categorySet := map[string]struct{}{}
	for _, r := range rows {
		categorySet[r.Category] = struct{}{}
	}
	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}
	sort.Strings(categories) // optional: alphabetical order

	// ---- Header row: add "Day" + "Remark" column
	header := append([]string{"", "Date"}, categories...)
	header = append(header, "TOTAL", "Remark")
	if err := w.Write(header); err != nil {
		return nil, 0, err
	}

	preDataRows := 3 // Month header + blank + header row

	// Group rows per day per category and collect remarks
	dayCatMap := map[int]map[string][]int64{}
	dayRemarks := map[int][]string{}
	for _, r := range rows {
		day := r.Date.Day()
		if dayCatMap[day] == nil {
			dayCatMap[day] = map[string][]int64{}
		}
		dayCatMap[day][r.Category] = append(dayCatMap[day][r.Category], r.Amount)

		if r.Remark != "" {
			dayRemarks[day] = append(dayRemarks[day], normalizeRemark(r.Remark))
		}
	}

	// ---- Per-day rows with formulas and truncated remark
	for day := 1; day <= daysInMonth; day++ {
		date := time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
		weekday := date.Weekday().String()

		row := []string{weekday, strconv.Itoa(day)}

		for _, cat := range categories {
			expenses := dayCatMap[day][cat]
			if len(expenses) == 0 {
				row = append(row, "0")
			} else if len(expenses) == 1 {
				row = append(row, strconv.FormatInt(expenses[0], 10))
			} else {
				sumParts := ""
				for i, val := range expenses {
					if i > 0 {
						sumParts += ","
					}
					sumParts += strconv.FormatInt(val, 10)
				}
				row = append(row, fmt.Sprintf("=SUM(%s)", sumParts))
			}
		}

		// Daily total formula (sum only category columns)
		excelRow := day + preDataRows
		if len(categories) == 0 {
			row = append(row, "0")
		} else {
			firstCategoryCol := "C"
			lastCategoryCol := string('C' + len(categories) - 1)
			row = append(row, fmt.Sprintf("=SUM(%s%d:%s%d)", firstCategoryCol, excelRow, lastCategoryCol, excelRow))
		}

		// Join multiple remarks into one string and truncate
		remark := ""
		if len(dayRemarks[day]) > 0 {
			remark = truncateRemark(strings.Join(dayRemarks[day], ", "), 70)
		}
		row = append(row, remark)

		if err := w.Write(row); err != nil {
			return nil, 0, err
		}
	}

	// ---- Grand total row
	grandTotalRowIndex := daysInMonth + preDataRows + 1
	totalRow := []string{"", "Grand total"} // first column empty for "Day"

	for i := 0; i < len(categories); i++ {
		col := string('B' + i)
		totalRow = append(totalRow, fmt.Sprintf("=SUM(%s%d:%s%d)", col, preDataRows+1, col, preDataRows+daysInMonth))
	}

	// Total column formula in grand total row
	totalCol := string('C' + len(categories)) // TOTAL column
	totalRow = append(totalRow, "")           // Remark column empty for grand total
	totalRow = append(totalRow, fmt.Sprintf("=SUM(%s%d:%s%d)", totalCol, preDataRows+1, totalCol, preDataRows+daysInMonth))

	_ = w.Write(totalRow)

	// ---- Average per day row
	avgRow := []string{"", "Average per day"}
	for range categories {
		avgRow = append(avgRow, "")
	}
	avgRow = append(avgRow, fmt.Sprintf("=%s%d/%d", totalCol, grandTotalRowIndex, daysInMonth))
	avgRow = append(avgRow, "") // Remark column empty
	_ = w.Write(avgRow)

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, 0, err
	}

	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}
