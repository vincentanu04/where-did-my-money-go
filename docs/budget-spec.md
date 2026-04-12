# Budget Feature — Specification

## Overview

Users can define a spending budget (daily, weekly, or monthly). The app dynamically recalculates the remaining daily allowance for the rest of the current period based on actual spending so far. Users can also look back at any past period to review how they tracked against their budget.

**Example — weekly reset**: Daily budget is ¥1,500. On Monday the user spends ¥2,000 — ¥500 over. The remaining ¥8,500 is split equally across the 6 remaining days → ¥1,417/day.

**Example — monthly reset**: Daily budget is ¥1,500. After 10 days the user has spent ¥18,000 (¥3,000 over the ¥15,000 pace). Remaining pool = ¥27,000 across 20 days → ¥1,350/day for the rest of the month.

---

## Budget Configuration

| Setting | Description |
|---|---|
| **Daily amount** | Integer (¥) — the target spend per day. All other figures (weekly, monthly) are derived from this on the frontend. |
| **Reset period** | `weekly` or `monthly`. Controls when the budget window resets. |
| **Week start day** | Only relevant when `reset_period = weekly`. Day the period resets: Mon – Sun (default: Monday). |
| **Active** | Bool — budget can be disabled without deleting it |

Only one budget configuration exists per user at a time.

The backend stores and operates entirely on `daily_amount`. The frontend lets the user enter the amount in any unit they prefer and converts before saving:
- Daily input → `daily_amount = input`
- Weekly input → `daily_amount = floor(input / 7)`
- Monthly input → `daily_amount = floor(input / days_in_current_month)`

The settings form always shows all three derived values regardless of which input mode is active.

---

## Core Calculation Logic

### Definitions

- **Period**: `[period_start, period_end]` — 7 days for weekly reset, calendar month for monthly reset
- **Period total** `P = daily_amount × D` (computed at query time)
- **Period length** `D`: 7 (weekly) or `days_in_month` (monthly)
- **Days remaining** `R`: days after today until end of period (not counting today)
- **Spent so far** `S`: sum of all expenses in the period up to end of yesterday
- **Today's spend** `T`: sum of today's expenses so far

### Today's allowance

```
remaining_pool  = P − S
today_allowance = floor(remaining_pool / (R + 1))   // +1 to include today
```

Equal distribution of whatever budget remains across today and all future days in the period.

### Remaining today

```
remaining_today = today_allowance − T
```

Can be negative (already over today's share).

### Remaining this period

```
remaining_period = P − S − T
```

### Status labels

| Condition | Label |
|---|---|
| `remaining_today >= today_allowance × 0.5` | On track |
| `remaining_today >= 0` | Getting close |
| `remaining_today < 0` | Over today's budget |
| `remaining_period < 0` | Over period budget |

---

## Period Boundary Behaviour

**Weekly reset**: period starts on the configured `week_start_day`; ends 6 days later. Resets at midnight (user's timezone).

**Monthly reset**: period is always the calendar month (1st → last day). A 28/29/30/31-day month is handled correctly — `D` and `R` are recalculated each day.

- Past periods become read-only once the new period starts.
- If today is the last day (`R = 0`): `today_allowance = remaining_pool`.
- If a period has no expenses: `today_allowance = floor(P / D)` (baseline).

---

## Data Model Changes

### New table: `budget_settings`

```sql
CREATE TABLE budget_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_amount    INTEGER     NOT NULL CHECK (daily_amount > 0),
  reset_period    TEXT        NOT NULL CHECK (reset_period IN ('weekly', 'monthly')),
  week_start_day  INTEGER     NOT NULL DEFAULT 1 CHECK (week_start_day BETWEEN 0 AND 6),
  -- 0 = Sunday, 1 = Monday, …, 6 = Saturday (ignored when reset_period = 'monthly')
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)  -- one setting per user
);
```

No new expense tables are needed — all summaries are computed on-the-fly from existing `expenses` data.

---

## API Endpoints

### `GET /budget/settings`
Returns the user's current budget configuration, or `404` if none set.

**Response `200`**:
```json
{
  "dailyAmount": 1500,
  "resetPeriod": "weekly",
  "weekStartDay": 1,
  "active": true
}
```

---

### `PUT /budget/settings`
Create or update the budget configuration (upsert).

**Request body**:
```json
{
  "dailyAmount": 1500,
  "resetPeriod": "weekly",
  "weekStartDay": 1,
  "active": true
}
```

**Response `200`**: same shape as GET.

---

### `GET /budget/summary`
Returns the calculated budget summary for the **current** period.

Query param: `?tz=Asia/Tokyo` (required; used to determine today and period boundaries).

**Response `200`**:
```json
{
  "periodStart": "2026-04-13",
  "periodEnd":   "2026-04-19",
  "periodTotal": 10500,
  "spentSoFar":  2000,
  "spentToday":  0,
  "todayAllowance": 1417,
  "remainingToday": 1417,
  "remainingPeriod": 8500,
  "status": "on_track",
  "dailyBreakdown": [
    { "date": "2026-04-13", "spent": 2000, "allowance": 1500 },
    { "date": "2026-04-14", "spent": 0,    "allowance": 1417 },
    { "date": "2026-04-15", "spent": null, "allowance": 1417 }
  ]
}
```

`dailyBreakdown`: past days have historical `spent` + the allowance that applied that day. Future days have `spent: null` and the projected allowance.

---

### `GET /budget/history`
Returns a list of **past** period summaries for the authenticated user, most recent first.

Query params:
- `?tz=Asia/Tokyo` (required)
- `?limit=12` (default 12, max 24)

**Response `200`**:
```json
[
  {
    "periodStart": "2026-04-06",
    "periodEnd":   "2026-04-12",
    "periodTotal": 10500,
    "totalSpent":  9800,
    "underOver":   -700,
    "status":      "under_budget",
    "dailyBreakdown": [
      { "date": "2026-04-06", "spent": 1200, "allowance": 1500 },
      ...
    ]
  },
  {
    "periodStart": "2026-03-30",
    "periodEnd":   "2026-04-05",
    "periodTotal": 10500,
    "totalSpent":  11200,
    "underOver":   700,
    "status":      "over_budget",
    "dailyBreakdown": [ ... ]
  }
]
```

`underOver`: negative = under budget (good), positive = over budget. Only fully-elapsed periods are included (current period is excluded — use `GET /budget/summary` instead).

---

## UI / UX

### Home page — Budget bar (new section, below DateHeader)

Shown only when a budget is configured and active. A compact card:

```
┌──────────────────────────────────────────┐
│  Today   ¥1,417 remaining                │
│  ████████████░░░░░░░░  ¥0 / ¥1,417       │
│  This week  ¥8,500 of ¥10,500 left       │
└──────────────────────────────────────────┘
```

- Second line label adapts: "This week" (weekly reset) or "This month" (monthly reset)
- Progress bar fills as spending increases; turns amber at 75%, red at 100%+
- Tapping the card navigates to `/budget` (settings + history)

### Budget page (`/budget`) — two tabs

**Tab 1 — Settings**
- Input mode toggle: `Daily` / `Weekly` / `Monthly` (frontend-only, not stored)
- Amount input (¥) — labelled according to selected mode
- Below the input, read-only derived values for the other two units always shown:
  e.g. user types ¥10,500 in Weekly mode → _"= ¥1,500/day · ≈ ¥45,500/month"_
- When the form loads, it opens in Daily mode showing the stored `daily_amount`
- Conversion on save: Weekly ÷ 7, Monthly ÷ days_in_month (floor), then send `dailyAmount` to backend
- Reset period selector: `Weekly` / `Monthly`
- Week start day selector — only shown when reset period is `Weekly`
- "Active" toggle to pause without deleting
- Accessible from the Home budget bar and from the user avatar dropdown

**Tab 2 — Past Periods**
- Scrollable list of past budget periods, most recent first
- Each row shows: period date range, total spent vs budget, coloured under/over badge
- Tapping a row expands it to show the `dailyBreakdown` as a small bar chart or day-by-day list
- Empty state: _"No past periods yet. Come back after your first period ends."_

```
┌──────────────────────────────────────────┐
│  6 Apr – 12 Apr                          │
│  ¥9,800 spent  of  ¥10,500   ✅ −¥700   │
├──────────────────────────────────────────┤
│  30 Mar – 5 Apr                          │
│  ¥11,200 spent  of  ¥10,500  🔴 +¥700   │
└──────────────────────────────────────────┘
```

### History page — daily budget indicator

In the `ExpenseList`, each day's total line gains a small coloured dot or delta annotation:
- Green: under allowance
- Amber: 75–100% of allowance
- Red: over allowance

---

## Open Questions

1. **Timezone**: Expenses are stored in UTC. Day boundaries need a user timezone. Recommendation: send `?tz=Asia/Tokyo` as a query param from the frontend (`Intl.DateTimeFormat().resolvedOptions().timeZone`). No DB schema change needed.

2. **Mid-period budget change**: If the user changes the amount mid-period, does the new budget apply from the start of the current period (recalculate history) or from tomorrow? Recommendation: apply from start of current period for simplicity.

3. **Shared expenses**: Should expenses accepted from a friend count toward the budget? Recommendation: yes — they appear in the user's ledger.

4. **Carry-over across periods**: Does unspent budget roll into the next period? Recommendation: no — each period is independent (simpler mental model).

5. **Past period snapshot vs recalculation**: When viewing a past period in history, should the daily allowances shown be the ones that were dynamically calculated at the time, or recalculated now against the current budget settings? Recommendation: recalculate on-the-fly using current settings (simpler, no snapshot storage needed) — but note that if the user changed their budget amount, historical periods will look different than they did live.

---

## Implementation Checklist

1. [ ] `0005_add_budget_settings.sql` migration (add `reset_period` column)
2. [ ] SQL query: `UpsertBudgetSettings`, `GetBudgetSettings`
3. [ ] SQL query: `GetExpensesForPeriod` (date range, user-scoped)
4. [ ] `make migrate-up` + `make sqlc-codegen`
5. [ ] OpenAPI: `GET /budget/settings`, `PUT /budget/settings`, `GET /budget/summary`, `GET /budget/history`
6. [ ] `make gen`
7. [ ] Handler stubs + app service implementations
8. [ ] Frontend: `BudgetBar` component on Home
9. [ ] Frontend: `/budget` page with Settings + Past Periods tabs + route in `App.tsx`
10. [ ] Frontend: `ExpenseList` daily budget indicator
