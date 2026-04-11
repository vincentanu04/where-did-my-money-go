-- name: CreateSharedExpenseSplit :one
INSERT INTO shared_expense_splits (
    source_expense_id,
    shared_by_user_id,
    shared_with_user_id,
    split_amount,
    original_total
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSharedSplitByID :one
SELECT * FROM shared_expense_splits
WHERE id = $1;

-- name: ListPendingSplitsForUser :many
SELECT * FROM shared_expense_splits
WHERE shared_with_user_id = $1
  AND status = 'pending';

-- name: UpdateSharedSplitStatus :one
UPDATE shared_expense_splits
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: SetSplitRecipientExpense :one
UPDATE shared_expense_splits
SET recipient_expense_id = $2, status = 'accepted', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ListSplitsForExpense :many
SELECT * FROM shared_expense_splits
WHERE source_expense_id = $1;

-- name: CountPendingSharedSplitsForUser :one
SELECT COUNT(*)::integer AS count
FROM shared_expense_splits
WHERE shared_with_user_id = $1
  AND status = 'pending';

-- name: ListPendingShareCountsByExpense :many
SELECT source_expense_id, COUNT(*)::int AS pending_count
FROM shared_expense_splits
WHERE shared_by_user_id = $1
  AND status = 'pending'
  AND source_expense_id IS NOT NULL
GROUP BY source_expense_id;

-- name: ListSharedFromEmailForRecipient :many
SELECT ses.recipient_expense_id, u.email AS shared_by_email
FROM shared_expense_splits ses
JOIN users u ON u.id = ses.shared_by_user_id
WHERE ses.shared_with_user_id = $1
  AND ses.status = 'accepted'
  AND ses.recipient_expense_id IS NOT NULL;

-- name: CountPendingSplitsForExpense :one
SELECT COUNT(*)::integer AS count
FROM shared_expense_splits
WHERE source_expense_id = $1
  AND status = 'pending';

-- name: CancelPendingSplitsForExpense :exec
UPDATE shared_expense_splits
SET status = 'cancelled', updated_at = NOW()
WHERE source_expense_id = $1
  AND status = 'pending';
