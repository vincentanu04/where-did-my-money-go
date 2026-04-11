-- +goose Up
-- +goose StatementBegin
CREATE TABLE shared_expense_splits (
    id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    source_expense_id    UUID    REFERENCES expenses(id) ON DELETE SET NULL,
    shared_by_user_id    UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id  UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    split_amount         INTEGER NOT NULL,
    original_total       INTEGER NOT NULL,
    status               TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    recipient_expense_id UUID    REFERENCES expenses(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS shared_expense_splits;
-- +goose StatementEnd
