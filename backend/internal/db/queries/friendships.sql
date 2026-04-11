-- name: GetFriendshipByPair :one
SELECT * FROM friendships
WHERE (requester_id = $1 AND addressee_id = $2)
   OR (requester_id = $2 AND addressee_id = $1)
LIMIT 1;

-- name: GetFriendshipByID :one
SELECT * FROM friendships
WHERE id = $1;

-- name: CreateFriendship :one
INSERT INTO friendships (requester_id, addressee_id)
VALUES ($1, $2)
RETURNING *;

-- name: ListAcceptedFriendships :many
SELECT * FROM friendships
WHERE (requester_id = $1 OR addressee_id = $1)
  AND status = 'accepted';

-- name: ListPendingIncomingRequests :many
SELECT * FROM friendships
WHERE addressee_id = $1
  AND status = 'pending';

-- name: UpdateFriendshipStatus :one
UPDATE friendships
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteFriendship :exec
DELETE FROM friendships
WHERE id = $1
  AND (requester_id = $2 OR addressee_id = $2);

-- name: CountPendingFriendRequests :one
SELECT COUNT(*)::integer AS count
FROM friendships
WHERE addressee_id = $1
  AND status = 'pending';
