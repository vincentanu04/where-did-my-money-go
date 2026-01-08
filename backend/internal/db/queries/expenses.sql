-- name: ListExpensesByUserAndRange :many
SELECT *
FROM expenses
WHERE user_id = $1
  AND expense_date >= $2
  AND expense_date <  $3
ORDER BY
  category ASC,
  created_at ASC;

-- name: CreateExpense :one
INSERT INTO expenses (
  user_id,
  category,
  amount,
  expense_date
)
VALUES (
  $1, $2, $3, $4
)
RETURNING
  id,
  user_id,
  category,
  amount,
  expense_date,
  created_at;

-- name: ExportExpenses :many
SELECT
  expense_date,
  category,
  amount,
  created_at
FROM expenses
WHERE user_id = $1
  AND expense_date >= $2
  AND expense_date <  $3
ORDER BY expense_date ASC, created_at ASC;
