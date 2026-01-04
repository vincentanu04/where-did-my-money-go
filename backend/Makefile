include .env

.PHONY: gen gen-go gen-ts tidy migrate-up

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

migrate-up:
	go tool goose -dir internal/db/migrations postgres ${DATABASE_URL} up
	
migrate-down:
	go tool goose -dir internal/db/migrations postgres ${DATABASE_URL} down

migrate-codegen:
	go tool sqlc generate -f internal/db/sqlc.yml