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

func ExportExpensesCSV(
	ctx context.Context,
	deps deps.Deps,
	req oapi.ExpenseExportRequest,
) (io.Reader, int64, error) {
	userID := middleware.UserIDFromContext(ctx)

	switch req.Type {
	case "monthly":
		offset := int(*req.MonthOffset)
		rows, year, month, daysInMonth, err := exportMonthly(ctx, deps, userID, offset)
		if err != nil {
			return nil, 0, err
		}
		return buildMonthlyCSV(year, month, daysInMonth, rows)

	case "yearly":
		if req.Year == nil {
			return nil, 0, fmt.Errorf("year is required")
		}

		start := time.Date(*req.Year, 1, 1, 0, 0, 0, 0, time.UTC)
		end := start.AddDate(1, 0, 0)

		rows, err := exportByRange(ctx, deps, userID, start, end)
		if err != nil {
			return nil, 0, err
		}

		return buildYearlyCSV(*req.Year, rows)

	case "range":
		if req.From == nil || req.To == nil {
			return nil, 0, fmt.Errorf("from and to are required")
		}

		start := time.Time(req.From.Time)
		end := time.Time(req.To.Time).AddDate(0, 0, 1)

		rows, err := exportByRange(ctx, deps, userID, start, end)
		if err != nil {
			return nil, 0, err
		}

		return buildRangeCSV(start, end, rows)

	default:
		return nil, 0, fmt.Errorf("unsupported export type")
	}
}

type ExpenseRow struct {
	Date     time.Time
	Category string
	Amount   int64
	Remark   string
}

func exportMonthly(
	ctx context.Context,
	deps deps.Deps,
	userID uuid.UUID,
	offset int,
) ([]ExpenseRow, int, time.Month, int, error) {

	now := time.Now().UTC()

	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).
		AddDate(0, -offset, 0)

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

	rows := make([]ExpenseRow, len(sqlcRows))
	for i, r := range sqlcRows {
		rows[i] = ExpenseRow{
			Date:     r.ExpenseDate,
			Category: r.Category,
			Amount:   int64(r.Amount),
			Remark:   r.Remark.String,
		}
	}

	daysInMonth := end.Add(-time.Nanosecond).Day()
	return rows, start.Year(), start.Month(), daysInMonth, nil
}

func exportByRange(
	ctx context.Context,
	deps deps.Deps,
	userID uuid.UUID,
	start, end time.Time,
) ([]ExpenseRow, error) {

	sqlcRows, err := deps.DB.ListExpensesByUserAndRange(
		ctx,
		sqlc.ListExpensesByUserAndRangeParams{
			UserID:        userID,
			ExpenseDate:   start,
			ExpenseDate_2: end,
		},
	)
	if err != nil {
		return nil, err
	}

	rows := make([]ExpenseRow, len(sqlcRows))
	for i, r := range sqlcRows {
		rows[i] = ExpenseRow{
			Date:     r.ExpenseDate,
			Category: r.Category,
			Amount:   int64(r.Amount),
			Remark:   r.Remark.String,
		}
	}

	return rows, nil
}

func truncateRemark(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "…"
}

func normalizeRemark(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", "")
	return strings.TrimSpace(s)
}

func colLetter(idx int) string {
	s := ""
	for idx >= 0 {
		s = string('A'+(idx%26)) + s
		idx = idx/26 - 1
	}
	return s
}

func buildMonthlyCSV(
	year int,
	month time.Month,
	daysInMonth int,
	rows []ExpenseRow,
) (io.Reader, int64, error) {

	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)

	_, _ = buf.WriteString(fmt.Sprintf("%s %d\n\n", month.String(), year))

	categorySet := map[string]struct{}{}
	for _, r := range rows {
		categorySet[r.Category] = struct{}{}
	}
	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}
	sort.Strings(categories)

	header := append([]string{"", "Date"}, categories...)
	header = append(header, "TOTAL", "Remarks")
	if err := w.Write(header); err != nil {
		return nil, 0, err
	}

	preDataRows := 3

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

	firstCatCol := 2
	lastCatCol := firstCatCol + len(categories) - 1
	totalColIdx := lastCatCol + 1

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
				parts := make([]string, len(expenses))
				for i, v := range expenses {
					parts[i] = strconv.FormatInt(v, 10)
				}
				row = append(row, fmt.Sprintf("=SUM(%s)", strings.Join(parts, ",")))
			}
		}

		excelRow := day + preDataRows
		if len(categories) == 0 {
			row = append(row, "0")
		} else {
			row = append(row, fmt.Sprintf(
				"=SUM(%s%d:%s%d)",
				colLetter(firstCatCol), excelRow,
				colLetter(lastCatCol), excelRow,
			))
		}

		remark := ""
		if len(dayRemarks[day]) > 0 {
			remark = truncateRemark(strings.Join(dayRemarks[day], ", "), 70)
		}
		row = append(row, remark)

		_ = w.Write(row)
	}

	totalRow := []string{"", "Grand total"}
	for i := 0; i < len(categories); i++ {
		col := colLetter(firstCatCol + i)
		totalRow = append(totalRow, fmt.Sprintf(
			"=SUM(%s%d:%s%d)",
			col, preDataRows+1,
			col, preDataRows+daysInMonth,
		))
	}

	totalRow = append(totalRow, fmt.Sprintf(
		"=SUM(%s%d:%s%d)",
		colLetter(totalColIdx), preDataRows+1,
		colLetter(totalColIdx), preDataRows+daysInMonth,
	))
	_ = w.Write(totalRow)

	avgRow := []string{"", "Average per day"}
	for range categories {
		avgRow = append(avgRow, "")
	}
	avgRow = append(avgRow, fmt.Sprintf(
		"=%s%d/%d",
		colLetter(totalColIdx),
		preDataRows+daysInMonth+1,
		daysInMonth,
	))
	avgRow = append(avgRow, "")
	_ = w.Write(avgRow)

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, 0, err
	}

	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}

func buildYearlyCSV(year int, rows []ExpenseRow) (io.Reader, int64, error) {
	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)

	_, _ = buf.WriteString(fmt.Sprintf("%d\n\n", year))

	categorySet := map[string]struct{}{}
	for _, r := range rows {
		categorySet[r.Category] = struct{}{}
	}
	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}
	sort.Strings(categories)

	header := append([]string{"Month"}, categories...)
	header = append(header, "TOTAL", "AVG / DAY")
	_ = w.Write(header)

	monthCat := map[time.Month]map[string]int64{}
	for _, r := range rows {
		m := r.Date.Month()
		if monthCat[m] == nil {
			monthCat[m] = map[string]int64{}
		}
		monthCat[m][r.Category] += r.Amount
	}

	yearTotal := int64(0)

	for m := time.January; m <= time.December; m++ {
		row := []string{m.String()}
		monthTotal := int64(0)

		for _, cat := range categories {
			val := monthCat[m][cat]
			row = append(row, strconv.FormatInt(val, 10))
			monthTotal += val
		}

		daysInMonth := time.Date(year, m+1, 0, 0, 0, 0, 0, time.UTC).Day()
		avgPerDay := int64(0)
		if daysInMonth > 0 {
			avgPerDay = monthTotal / int64(daysInMonth)
		}

		row = append(row,
			strconv.FormatInt(monthTotal, 10),
			strconv.FormatInt(avgPerDay, 10),
		)

		yearTotal += monthTotal
		_ = w.Write(row)
	}

	daysInYear := 365
	if time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC).YearDay() == 366 {
		daysInYear = 366
	}

	yearAvg := int64(0)
	if daysInYear > 0 {
		yearAvg = yearTotal / int64(daysInYear)
	}

	avgRow := []string{"Average per day (Year)"}
	for range categories {
		avgRow = append(avgRow, "")
	}
	avgRow = append(avgRow,
		strconv.FormatInt(yearTotal, 10),
		strconv.FormatInt(yearAvg, 10),
	)
	_ = w.Write(avgRow)

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, 0, err
	}

	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}

func buildRangeCSV(start, end time.Time, rows []ExpenseRow) (io.Reader, int64, error) {
	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)

	_, _ = buf.WriteString(fmt.Sprintf(
		"%s - %s\n\n",
		start.Format("2006-01-02"),
		end.AddDate(0, 0, -1).Format("2006-01-02"),
	))

	categorySet := map[string]struct{}{}
	for _, r := range rows {
		categorySet[r.Category] = struct{}{}
	}
	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}
	sort.Strings(categories)

	header := append([]string{"", "Date"}, categories...)
	header = append(header, "TOTAL", "Remarks")
	_ = w.Write(header)

	preDataRows := 3

	dayCat := map[string]map[string][]int64{}
	dayRemarks := map[string][]string{}

	for _, r := range rows {
		key := r.Date.Format("2006-01-02")
		if dayCat[key] == nil {
			dayCat[key] = map[string][]int64{}
		}
		dayCat[key][r.Category] = append(dayCat[key][r.Category], r.Amount)

		if r.Remark != "" {
			dayRemarks[key] = append(dayRemarks[key], normalizeRemark(r.Remark))
		}
	}

	firstCatCol := 2
	lastCatCol := firstCatCol + len(categories) - 1
	totalColIdx := lastCatCol + 1

	dayIndex := 0
	for d := start; d.Before(end); d = d.AddDate(0, 0, 1) {
		dayIndex++
		key := d.Format("2006-01-02")

		row := []string{
			d.Weekday().String(),
			strconv.Itoa(d.Day()),
		}

		for _, cat := range categories {
			expenses := dayCat[key][cat]
			if len(expenses) == 0 {
				row = append(row, "0")
			} else if len(expenses) == 1 {
				row = append(row, strconv.FormatInt(expenses[0], 10))
			} else {
				parts := make([]string, len(expenses))
				for i, v := range expenses {
					parts[i] = strconv.FormatInt(v, 10)
				}
				row = append(row, fmt.Sprintf("=SUM(%s)", strings.Join(parts, ",")))
			}
		}

		excelRow := dayIndex + preDataRows
		if len(categories) == 0 {
			row = append(row, "0")
		} else {
			row = append(row, fmt.Sprintf(
				"=SUM(%s%d:%s%d)",
				colLetter(firstCatCol), excelRow,
				colLetter(lastCatCol), excelRow,
			))
		}

		remark := ""
		if len(dayRemarks[key]) > 0 {
			remark = truncateRemark(strings.Join(dayRemarks[key], ", "), 70)
		}
		row = append(row, remark)

		_ = w.Write(row)
	}

	days := dayIndex

	totalRow := []string{"", "Grand total"}
	for i := 0; i < len(categories); i++ {
		col := colLetter(firstCatCol + i)
		totalRow = append(totalRow, fmt.Sprintf(
			"=SUM(%s%d:%s%d)",
			col, preDataRows+1,
			col, preDataRows+days,
		))
	}

	totalRow = append(totalRow, fmt.Sprintf(
		"=SUM(%s%d:%s%d)",
		colLetter(totalColIdx), preDataRows+1,
		colLetter(totalColIdx), preDataRows+days,
	))
	_ = w.Write(totalRow)

	avgRow := []string{"", "Average per day"}
	for range categories {
		avgRow = append(avgRow, "")
	}
	avgRow = append(avgRow, fmt.Sprintf(
		"=%s%d/%d",
		colLetter(totalColIdx),
		preDataRows+days+1,
		days,
	))
	avgRow = append(avgRow, "")
	_ = w.Write(avgRow)

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, 0, err
	}

	return bytes.NewReader(buf.Bytes()), int64(buf.Len()), nil
}
