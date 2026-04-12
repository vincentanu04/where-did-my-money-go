-- name: GetBudgetSettings :one
SELECT * FROM budget_settings WHERE user_id = $1;

-- name: UpsertBudgetSettings :one
INSERT INTO budget_settings (user_id, daily_amount, reset_period, week_start_day, active)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id) DO UPDATE
SET
  daily_amount   = EXCLUDED.daily_amount,
  reset_period   = EXCLUDED.reset_period,
  week_start_day = EXCLUDED.week_start_day,
  active         = EXCLUDED.active,
  updated_at     = NOW()
RETURNING *;
