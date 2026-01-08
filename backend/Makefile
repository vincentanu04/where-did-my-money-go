include .env

.PHONY: gen gen-go gen-ts tidy migrate-up migrate-down sqlc-codegen

run:
	go run main.go
	
## Generate everything
gen: gen-go gen-ts tidy

## Generate Go server + types
gen-go:
	go tool oapi-codegen \
	  -config api/oapi-server.yml \
	  api/openapi.yml

## Generate TypeScript client
gen-ts:
	cd ../frontend && bunx @rtk-query/codegen-openapi rtk-query.config.cjs

## Clean up go.mod
tidy:
	go mod tidy

## Migrate up
migrate-up: migrate-up-only sqlc-codegen
migrate-up-only:
	go tool goose -dir internal/db/migrations postgres $(DATABASE_URL) up

## Migrate down
migrate-down: migrate-down-only sqlc-codegen
migrate-down-only:
	go tool goose -dir internal/db/migrations postgres $(DATABASE_URL) down

## Migrate codegen
sqlc-codegen:
	go tool sqlc generate -f internal/db/sqlc.yml