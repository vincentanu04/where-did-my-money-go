package integration_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	appdb "github.com/vincentanu04/where-did-my-money-go/internal/db"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	appserver "github.com/vincentanu04/where-did-my-money-go/internal/server"
	"github.com/vincentanu04/where-did-my-money-go/internal/server/middleware"
	"golang.org/x/crypto/bcrypt"
)

const (
	testJWTSecret = "integration-test-secret"
	testUserEmail = "budget-integration-test@test.local"
	defaultDBURL  = "postgres://wdmmg_user:wdmmg_password@localhost:5432/wdmmg_db?sslmode=disable"
)

// Path constants matching the routes registered by oapi.HandlerFromMux in server.gen.go.
const (
	pathBudgetSettings = "/budget/settings"
	pathBudgetSummary  = "/budget/summary"
	pathBudgetHistory  = "/budget/history"
)

// Package-level state shared across all tests in this file.
var (
	testSrv    *httptest.Server
	testPool   *pgxpool.Pool
	testUserID uuid.UUID
)

// TestMain sets up a single HTTP test server and test user, then tears everything down after.
func TestMain(m *testing.M) {
	// Ensure env vars used by the app are set before anything else.
	if os.Getenv("DATABASE_URL") == "" {
		os.Setenv("DATABASE_URL", defaultDBURL)
	}
	os.Setenv("JWT_SECRET", testJWTSecret)

	ctx := context.Background()
	pool, err := appdb.New(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: cannot connect to DB: %v\n", err)
		os.Exit(1)
	}
	testPool = pool

	// Create a dedicated test user (delete first so re-runs are idempotent).
	pool.Exec(ctx, `DELETE FROM users WHERE email = $1`, testUserEmail)
	hash, _ := bcrypt.GenerateFromPassword([]byte("testpassword"), bcrypt.MinCost)
	row := pool.QueryRow(ctx, `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
		testUserEmail, string(hash))
	if err := row.Scan(&testUserID); err != nil {
		fmt.Fprintf(os.Stderr, "integration: cannot create test user: %v\n", err)
		pool.Close()
		os.Exit(1)
	}

	// Build the same Chi router as main.go.
	queries := sqlc.New(pool)
	router := chi.NewRouter()
	router.Use(chi_middleware.Recoverer)
	apiRouter := chi.NewRouter()
	apiRouter.Use(middleware.Auth)

	handler := oapi.NewStrictHandlerWithOptions(
		appserver.NewServer(deps.Deps{DB: queries}),
		[]oapi.StrictMiddlewareFunc{},
		oapi.StrictHTTPServerOptions{},
	)
	oapi.HandlerFromMux(handler, apiRouter)
	router.Mount("/api", apiRouter)

	testSrv = httptest.NewServer(router)

	code := m.Run()

	// Teardown: delete test user (cascade removes budget_settings, expenses, etc.)
	pool.Exec(ctx, `DELETE FROM users WHERE email = $1`, testUserEmail)
	testSrv.Close()
	pool.Close()

	os.Exit(code)
}

// mintJWT creates a valid signed JWT for the given user ID.
func mintJWT(userID uuid.UUID) string {
	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(testJWTSecret))
	return signed
}

// authClient returns an http.Client that attaches a valid auth cookie on every request.
func authClient() *http.Client {
	jar, _ := cookiejar.New(nil)
	u, _ := url.Parse(testSrv.URL)
	jar.SetCookies(u, []*http.Cookie{
		{Name: middleware.COOKIE_NAME, Value: mintJWT(testUserID)},
	})
	return &http.Client{Jar: jar}
}

// apiURL returns the full URL for an API path.
func apiURL(path string) string {
	return testSrv.URL + "/api" + path
}

type response struct {
	*http.Response
	body []byte
}

// do makes a JSON request, reads the body, and returns both.
func do(t *testing.T, client *http.Client, method, url string, payload any) response {
	t.Helper()
	var req *http.Request
	var err error
	if payload != nil {
		b, _ := json.Marshal(payload)
		req, err = http.NewRequest(method, url, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	if err != nil {
		t.Fatalf("build request: %v", err)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer resp.Body.Close()
	var buf bytes.Buffer
	buf.ReadFrom(resp.Body)
	return response{resp, buf.Bytes()}
}

func (r response) decode(t *testing.T, v any) {
	t.Helper()
	if err := json.Unmarshal(r.body, v); err != nil {
		t.Fatalf("decode response: %v\nbody: %s", err, r.body)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

// TestBudgetSettingsCRUD tests the full GET→PUT→GET flow for budget settings.
func TestBudgetSettingsCRUD(t *testing.T) {
	client := authClient()

	t.Run("GET settings returns 404 when none configured", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL("/budget/settings"), nil)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404, got %d; body: %s", resp.StatusCode, resp.body)
		}
	})

	t.Run("PUT settings creates weekly budget", func(t *testing.T) {
		resp := do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
			DailyAmount:  1500,
			ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
			WeekStartDay: 1,
			Active:       true,
		})
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got oapi.BudgetSettings
		resp.decode(t, &got)
		if got.DailyAmount != 1500 {
			t.Errorf("dailyAmount: got %v, want 1500", got.DailyAmount)
		}
		if got.ResetPeriod != oapi.BudgetSettingsResetPeriodWeekly {
			t.Errorf("resetPeriod: got %v, want weekly", got.ResetPeriod)
		}
		if !got.Active {
			t.Error("active: got false, want true")
		}
	})

	t.Run("GET settings returns saved values", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSettings), nil)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got oapi.BudgetSettings
		resp.decode(t, &got)
		if got.DailyAmount != 1500 {
			t.Errorf("dailyAmount: got %v, want 1500", got.DailyAmount)
		}
		if got.WeekStartDay != 1 {
			t.Errorf("weekStartDay: got %v, want 1", got.WeekStartDay)
		}
	})

	t.Run("PUT settings updates to monthly budget", func(t *testing.T) {
		resp := do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
			DailyAmount:  2000,
			ResetPeriod:  oapi.BudgetSettingsResetPeriodMonthly,
			WeekStartDay: 1,
			Active:       true,
		})
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got oapi.BudgetSettings
		resp.decode(t, &got)
		if got.DailyAmount != 2000 {
			t.Errorf("dailyAmount: got %v, want 2000", got.DailyAmount)
		}
		if got.ResetPeriod != oapi.BudgetSettingsResetPeriodMonthly {
			t.Errorf("resetPeriod: got %v, want monthly", got.ResetPeriod)
		}
	})
}

// TestBudgetSummary tests GET /budget/summary with an active budget and no expenses.
func TestBudgetSummary(t *testing.T) {
	client := authClient()

	// Ensure a known weekly budget is active.
	weeklyBudget := oapi.BudgetSettings{
		DailyAmount:  1000,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
		WeekStartDay: 1,
		Active:       true,
	}
	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), weeklyBudget)

	t.Run("returns summary structure", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got oapi.BudgetSummary
		resp.decode(t, &got)
		if got.DailyBreakdown == nil {
			t.Error("dailyBreakdown is nil")
		}
	})

	t.Run("periodTotal equals dailyAmount * 7 for weekly budget", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
		var got oapi.BudgetSummary
		resp.decode(t, &got)
		if got.PeriodTotal != 7000 { // 1000 * 7
			t.Errorf("periodTotal: got %v, want 7000", got.PeriodTotal)
		}
	})

	t.Run("dailyBreakdown has 7 entries for weekly period", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
		var got oapi.BudgetSummary
		resp.decode(t, &got)
		if len(got.DailyBreakdown) != 7 {
			t.Errorf("dailyBreakdown length: got %d, want 7", len(got.DailyBreakdown))
		}
	})

	t.Run("status is on_track with no spending", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
		var got oapi.BudgetSummary
		resp.decode(t, &got)
		if got.Status != oapi.OnTrack {
			t.Errorf("status: got %v, want %v", got.Status, oapi.OnTrack)
		}
	})

	t.Run("404 when budget is inactive", func(t *testing.T) {
		// Disable budget.
		do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
			DailyAmount:  1000,
			ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
			WeekStartDay: 1,
			Active:       false,
		})
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404 for inactive budget, got %d", resp.StatusCode)
		}
		// Re-enable for subsequent tests.
		do(t, client, http.MethodPut, apiURL(pathBudgetSettings), weeklyBudget)
	})
}

// TestBudgetSummaryMonthly tests the monthly period calculation.
func TestBudgetSummaryMonthly(t *testing.T) {
	client := authClient()

	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount:  500,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodMonthly,
		WeekStartDay: 1,
		Active:       true,
	})

	resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
	}

	var got oapi.BudgetSummary
	resp.decode(t, &got)

	// periodTotal should be 500 * days_in_current_month
	now := time.Now().UTC()
	daysInMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	expectedTotal := 500 * daysInMonth
	if got.PeriodTotal != expectedTotal {
		t.Errorf("periodTotal: got %v, want %v", got.PeriodTotal, expectedTotal)
	}

	// dailyBreakdown should have daysInMonth entries
	if len(got.DailyBreakdown) != daysInMonth {
		t.Errorf("dailyBreakdown length: got %d, want %d", len(got.DailyBreakdown), daysInMonth)
	}
}

// TestBudgetHistory tests GET /budget/history.
func TestBudgetHistory(t *testing.T) {
	client := authClient()

	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount:  1500,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
		WeekStartDay: 1,
		Active:       true,
	})

	t.Run("returns empty array when no past periods", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC"), nil)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got []oapi.BudgetHistoryEntry
		resp.decode(t, &got)
		// Past periods have no expenses so they exist structurally (history always
		// returns the requested count of past periods, even if spend=0).
		if got == nil {
			t.Error("expected non-nil array")
		}
	})

	t.Run("honours limit param", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC&limit=3"), nil)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
		}
		var got []oapi.BudgetHistoryEntry
		resp.decode(t, &got)
		if len(got) != 3 {
			t.Errorf("expected 3 past periods, got %d", len(got))
		}
	})

	t.Run("each entry has required fields", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC&limit=1"), nil)
		var got []oapi.BudgetHistoryEntry
		resp.decode(t, &got)
		if len(got) == 0 {
			t.Fatal("expected at least one history entry")
		}
		entry := got[0]
		if entry.PeriodStart.IsZero() {
			t.Error("periodStart is zero")
		}
		if entry.PeriodEnd.IsZero() {
			t.Error("periodEnd is zero")
		}
		if entry.DailyBreakdown == nil {
			t.Error("dailyBreakdown is nil")
		}
	})

	t.Run("history entries have under_budget status when no spending", func(t *testing.T) {
		resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC&limit=1"), nil)
		var got []oapi.BudgetHistoryEntry
		resp.decode(t, &got)
		if got[0].Status != oapi.UnderBudget {
			t.Errorf("status: got %v, want %v", got[0].Status, oapi.UnderBudget)
		}
	})

	t.Run("404 when no budget configured", func(t *testing.T) {
		// Use a brand new user with no budget.
		otherUserID := uuid.New()
		pool := testPool
		ctx := context.Background()
		hash, _ := bcrypt.GenerateFromPassword([]byte("x"), bcrypt.MinCost)
		pool.Exec(ctx, `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`,
			otherUserID, "no-budget@test.local", string(hash))
		defer pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, otherUserID)

		jar, _ := cookiejar.New(nil)
		parsedURL, _ := url.Parse(testSrv.URL)
		jar.SetCookies(parsedURL, []*http.Cookie{
			{Name: middleware.COOKIE_NAME, Value: mintJWT(otherUserID)},
		})
		otherClient := &http.Client{Jar: jar}

		resp := do(t, otherClient, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC"), nil)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404 for user with no budget, got %d", resp.StatusCode)
		}
	})
}

// TestBudgetSummaryWithExpenses creates expenses and verifies the maths.
func TestBudgetSummaryWithExpenses(t *testing.T) {
	client := authClient()
	ctx := context.Background()
	queries := sqlc.New(testPool)

	// Weekly budget: ¥1000/day = ¥7000/week.
	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount:  1000,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
		WeekStartDay: 1,
		Active:       true,
	})

	// Insert two expenses for today directly in the DB.
	now := time.Now().UTC()
	todayMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	for _, amount := range []int32{400, 600} {
		_, err := queries.CreateExpense(ctx, sqlc.CreateExpenseParams{
			UserID:      testUserID,
			Category:    "Test",
			Amount:      amount,
			ExpenseDate: todayMidnight,
		})
		if err != nil {
			t.Fatalf("insert expense: %v", err)
		}
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM expenses WHERE user_id = $1 AND category = 'Test'`, testUserID)
	})

	resp := do(t, client, http.MethodGet, apiURL(pathBudgetSummary+"?tz=UTC"), nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
	}

	var got oapi.BudgetSummary
	resp.decode(t, &got)

	if got.SpentToday != 1000 {
		t.Errorf("spentToday: got %v, want 1000", got.SpentToday)
	}
	// remainingToday must equal todayAllowance - spentToday regardless of which day of the period it is
	expected := got.TodayAllowance - got.SpentToday
	if got.RemainingToday != expected {
		t.Errorf("remainingToday: got %v, want %v (todayAllowance %v - spentToday %v)",
			got.RemainingToday, expected, got.TodayAllowance, got.SpentToday)
	}
}

// TestBudgetHistoryAccuracy inserts real expenses in a past period and verifies
// that the history endpoint returns correct totals and status.
func TestBudgetHistoryAccuracy(t *testing.T) {
	client := authClient()
	ctx := context.Background()
	queries := sqlc.New(testPool)

	const dailyAmount = 1000
	const weekStartDay = 1 // Monday

	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount:  dailyAmount,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
		WeekStartDay: weekStartDay,
		Active:       true,
	})

	// Calculate the last fully-completed weekly period (same logic as the backend).
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	daysSinceMonday := (int(todayStart.Weekday()) - weekStartDay + 7) % 7
	currentWeekStart := todayStart.AddDate(0, 0, -daysSinceMonday)
	lastWeekStart := currentWeekStart.AddDate(0, 0, -7)
	lastWeekEnd := currentWeekStart // exclusive

	periodTotal := dailyAmount * int(lastWeekEnd.Sub(lastWeekStart).Hours()/24) // 7000

	// Insert expenses: 3000 on day 0, 2500 on day 2 = totalSpent 5500 (under budget).
	expenses := []struct {
		dayOffset int
		amount    int32
	}{
		{0, 3000},
		{2, 2500},
	}
	totalSpent := 0
	for _, e := range expenses {
		insertDate := lastWeekStart.AddDate(0, 0, e.dayOffset)
		_, err := queries.CreateExpense(ctx, sqlc.CreateExpenseParams{
			UserID:      testUserID,
			Category:    "HistoryAccuracyTest",
			Amount:      e.amount,
			ExpenseDate: insertDate,
		})
		if err != nil {
			t.Fatalf("insert expense: %v", err)
		}
		totalSpent += int(e.amount)
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM expenses WHERE user_id = $1 AND category = 'HistoryAccuracyTest'`, testUserID)
	})

	resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC&limit=1"), nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d; body: %s", resp.StatusCode, resp.body)
	}
	var entries []oapi.BudgetHistoryEntry
	resp.decode(t, &entries)
	if len(entries) == 0 {
		t.Fatal("expected at least one history entry")
	}

	entry := entries[0]

	if entry.PeriodTotal != periodTotal {
		t.Errorf("periodTotal: got %d, want %d", entry.PeriodTotal, periodTotal)
	}
	if entry.TotalSpent != totalSpent {
		t.Errorf("totalSpent: got %d, want %d", entry.TotalSpent, totalSpent)
	}
	wantUnderOver := totalSpent - periodTotal // negative = under
	if entry.UnderOver != wantUnderOver {
		t.Errorf("underOver: got %d, want %d", entry.UnderOver, wantUnderOver)
	}
	if entry.Status != oapi.UnderBudget {
		t.Errorf("status: got %v, want %v", entry.Status, oapi.UnderBudget)
	}

	// Verify the daily breakdown sums match totalSpent
	breakdownSum := 0
	for _, day := range entry.DailyBreakdown {
		if day.Spent != nil {
			breakdownSum += *day.Spent
		}
	}
	if breakdownSum != totalSpent {
		t.Errorf("dailyBreakdown sum: got %d, want %d", breakdownSum, totalSpent)
	}
}

// TestBudgetHistoryOverBudget verifies over_budget status and positive underOver.
func TestBudgetHistoryOverBudget(t *testing.T) {
	client := authClient()
	ctx := context.Background()
	queries := sqlc.New(testPool)

	const dailyAmount = 1000
	const weekStartDay = 1

	do(t, client, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount:  dailyAmount,
		ResetPeriod:  oapi.BudgetSettingsResetPeriodWeekly,
		WeekStartDay: weekStartDay,
		Active:       true,
	})

	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	daysSinceMonday := (int(todayStart.Weekday()) - weekStartDay + 7) % 7
	currentWeekStart := todayStart.AddDate(0, 0, -daysSinceMonday)
	lastWeekStart := currentWeekStart.AddDate(0, 0, -7)
	lastWeekEnd := currentWeekStart

	periodTotal := dailyAmount * int(lastWeekEnd.Sub(lastWeekStart).Hours()/24) // 7000

	// Insert 9000 total — 2000 over budget.
	totalSpent := 0
	for _, amt := range []int32{5000, 4000} {
		_, err := queries.CreateExpense(ctx, sqlc.CreateExpenseParams{
			UserID:      testUserID,
			Category:    "HistoryOverTest",
			Amount:      amt,
			ExpenseDate: lastWeekStart,
		})
		if err != nil {
			t.Fatalf("insert expense: %v", err)
		}
		totalSpent += int(amt)
	}
	t.Cleanup(func() {
		testPool.Exec(ctx, `DELETE FROM expenses WHERE user_id = $1 AND category = 'HistoryOverTest'`, testUserID)
	})

	resp := do(t, client, http.MethodGet, apiURL(pathBudgetHistory+"?tz=UTC&limit=1"), nil)
	var entries []oapi.BudgetHistoryEntry
	resp.decode(t, &entries)
	if len(entries) == 0 {
		t.Fatal("expected at least one history entry")
	}

	entry := entries[0]
	if entry.TotalSpent != totalSpent {
		t.Errorf("totalSpent: got %d, want %d", entry.TotalSpent, totalSpent)
	}
	wantUnderOver := totalSpent - periodTotal // positive = over
	if entry.UnderOver != wantUnderOver {
		t.Errorf("underOver: got %d, want %d", entry.UnderOver, wantUnderOver)
	}
	if entry.Status != oapi.OverBudget {
		t.Errorf("status: got %v, want %v", entry.Status, oapi.OverBudget)
	}
}

// TestBudgetUnauthorised verifies the auth middleware protects budget endpoints.
func TestBudgetUnauthorised(t *testing.T) {
	bare := &http.Client{} // no cookie jar
	for _, path := range []string{pathBudgetSettings, pathBudgetSummary + "?tz=UTC", pathBudgetHistory + "?tz=UTC"} {
		resp := do(t, bare, http.MethodGet, apiURL(path), nil)
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("GET %s: expected 401, got %d", path, resp.StatusCode)
		}
	}
	resp := do(t, bare, http.MethodPut, apiURL(pathBudgetSettings), oapi.BudgetSettings{
		DailyAmount: 100, ResetPeriod: oapi.BudgetSettingsResetPeriodWeekly, WeekStartDay: 1, Active: true,
	})
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("PUT /budget/settings: expected 401, got %d", resp.StatusCode)
	}
}
