-- +goose Up
-- +goose StatementBegin
ALTER TABLE shared_expense_splits
    DROP CONSTRAINT IF EXISTS shared_expense_splits_status_check;

ALTER TABLE shared_expense_splits
    ADD CONSTRAINT shared_expense_splits_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE shared_expense_splits
    DROP CONSTRAINT IF EXISTS shared_expense_splits_status_check;

ALTER TABLE shared_expense_splits
    ADD CONSTRAINT shared_expense_splits_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected'));
-- +goose StatementEnd
