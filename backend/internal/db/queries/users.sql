-- name: GetUserByEmail :one
SELECT id, email, password_hash
FROM users
WHERE email = $1;

-- name: GetUserById :one
SELECT *
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING id, email, created_at;
