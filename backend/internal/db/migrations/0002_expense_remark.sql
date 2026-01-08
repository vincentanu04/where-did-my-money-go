-- +goose Up
ALTER TABLE expenses
ADD COLUMN remark TEXT DEFAULT NULL;

-- +goose Down
ALTER TABLE expenses
DROP COLUMN remark;
