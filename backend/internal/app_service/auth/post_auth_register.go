package app_service_auth

import (
	"context"
	"database/sql"
	"errors"

	oapi "github.com/vincentanu04/where-did-my-money-go/generated/server"
	sqlc "github.com/vincentanu04/where-did-my-money-go/internal/db/generated"
	"github.com/vincentanu04/where-did-my-money-go/internal/deps"
	"golang.org/x/crypto/bcrypt"
)

func PostAuthRegister(ctx context.Context, deps deps.Deps, email string, password string) (oapi.PostAuthRegisterResponseObject, error) {
	db := deps.DB

	_, err := db.GetUserByEmail(ctx, email)
	if err == nil {
		// user already exists
		return oapi.PostAuthRegister409Response{}, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	passwordHash, err := hashPassword(password)
	if err != nil {
		return nil, err
	}

	user, err := db.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        email,
		PasswordHash: passwordHash,
	})
	if err != nil {
		return nil, err
	}

	cookie, err := createLoginCookie(user.ID.String())
	if err != nil {
		return nil, err
	}

	res := oapi.PostAuthRegister204Response{
		Headers: oapi.PostAuthRegister204ResponseHeaders{
			SetCookie: cookie.String(),
		},
	}

	return res, nil
}

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}
