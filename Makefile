OPENAPI_SPEC=backend/api/openapi.yml
OAPI_CONFIG=backend/api/oapi-server.yml

GO_API_OUT=backend/internal/api
TS_API_OUT=frontend/src/api

.PHONY: gen gen-go gen-ts tidy

## Generate everything
gen: gen-go gen-ts tidy

## Generate Go server + types
gen-go:
	cd backend && go tool oapi-codegen \
	  -config api/oapi-server.yml \
	  api/openapi.yml

## Generate TypeScript client
gen-ts:
	cd frontend && bunx openapi-typescript \
	  ../backend/api/openapi.yml \
	  --output src/api/client.ts

## Clean up go.mod
tidy:
	cd backend && go mod tidy
