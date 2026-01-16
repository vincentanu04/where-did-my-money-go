-- +goose Up
ALTER TABLE expenses
ADD COLUMN updated_at TIMESTAMP DEFAULT NULL;

-- +goose Down
ALTER TABLE expenses
DROP COLUMN updated_at;