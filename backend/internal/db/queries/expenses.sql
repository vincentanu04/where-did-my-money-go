-- name: ListExpensesByUserAndRange :many
SELECT *
FROM expenses
WHERE user_id = $1
  AND expense_date >= $2
  AND expense_date <  $3
ORDER BY
  expense_date ASC,
  category ASC,
  created_at ASC;

-- name: CreateExpense :one
INSERT INTO expenses (
  user_id,
  category,
  amount,
  expense_date,
  remark
)
VALUES (
  $1, $2, $3, $4, $5
)
RETURNING
  id,
  user_id,
  category,
  amount,
  expense_date,
  remark,
  created_at;

-- name: GetExpenseByIDAndUser :one
SELECT
  *
FROM expenses
WHERE id = $1
  AND user_id = $2;

-- name: UpdateExpense :one
UPDATE expenses
SET
  category     = $3,
  amount       = $4,
  expense_date = $5,
  remark       = $6,
  updated_at   = now()
WHERE id = $1
  AND user_id = $2
RETURNING
  id,
  user_id,
  category,
  amount,
  expense_date,
  remark,
  created_at,
  updated_at;


-- name: DeleteExpense :exec
DELETE FROM expenses WHERE id = $1;