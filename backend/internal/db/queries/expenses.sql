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
