-- +goose Up
-- +goose StatementBegin
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
  UNIQUE (user_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS budget_settings;
-- +goose StatementEnd
