# Where Did My Money Go — AI Coding Agent Instructions

## Project Overview

Personal **expense tracker** full-stack web app with a **Go backend** (Chi router, PostgreSQL, sqlc) and **React/TypeScript frontend** (Vite, RTK Query, shadcn/ui, Tailwind v4).

**Architecture**: Monorepo with `backend/` and `frontend/` directories. Backend uses OpenAPI-first design with code generation. Frontend consumes auto-generated RTK Query hooks.

**Go Module Name**: `github.com/vincentanu04/where-did-my-money-go`

**Local Development**:
- Run via Docker Compose (all 3 services: postgres, backend with air hot-reload, frontend with Vite dev server)
- `cd backend && make run` starts Docker Compose (not air directly)
- Environment variables in `.env.local` at repo root (loaded by Makefile via `-include ../.env.local`)

**Production Deployment**: Fly.io — single Go binary embeds the built React SPA. Region: `nrt` (Tokyo).

---

## Critical Development Workflows

### Backend: OpenAPI-First Development
**All API changes must follow this exact sequence:**

1. **Edit OpenAPI spec** (`backend/api/openapi.yml`)
   - Define new paths, request/response schemas
   - Mark public routes with `security: []`

2. **Generate code**: `cd backend && make gen`
   - `make gen-go` → generates `generated/server/server.gen.go` — strict server interface + Chi router wiring
   - `make gen-ts` → generates `frontend/src/api/client.ts` — RTK Query hooks (do NOT edit manually)
   - `make tidy` → runs `go mod tidy`

3. **Implement the handler method** in `internal/server/handlers.go`
   - One method per operation on the `*Server` struct
   - Handler delegates entirely to the corresponding `app_service` function
   - Names must match the oapi interface (e.g. `PostExpensesCreate`, `GetAuthMe`)

4. **Implement business logic** in `internal/app_service/<domain>/<operation>.go`
   - One file per operation, named after the HTTP operation (e.g. `post_expenses_create.go`)
   - App service functions return oapi response objects directly

5. **Routes are auto-wired** by `oapi.HandlerFromMux(handler, apiRouter)` in `main.go`

**Example handler in `handlers.go`**:
```go
func (s *Server) PostExpensesCreate(ctx context.Context, request oapi.PostExpensesCreateRequestObject) (oapi.PostExpensesCreateResponseObject, error) {
    return app_service_expenses.PostExpensesCreate(ctx, s.Deps, request)
}
```

**Example app service** (normal JSON response):
```go
// internal/app_service/expenses/post_expenses_create.go
func PostExpensesCreate(ctx context.Context, d deps.Deps, request oapi.PostExpensesCreateRequestObject) (oapi.PostExpensesCreateResponseObject, error) {
    userID := middleware.UserIDFromContext(ctx)

    expense, err := d.DB.CreateExpense(ctx, sqlc.CreateExpenseParams{
        UserID:      userID,
        Category:    request.Body.Category,
        Amount:      request.Body.Amount,
        ExpenseDate: pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
    })
    if err != nil {
        return nil, err
    }

    return oapi.PostExpensesCreate201JSONResponse{
        Id:       expense.ID,
        Category: expense.Category,
        Amount:   expense.Amount,
    }, nil
}
```

**Example app service** (custom response — e.g. CSV or cookie):
```go
// For responses not managed by oapi (cookies, binary, etc.), implement the VisitXxx interface
type loginCookieResponse struct {
    user  oapi.AuthUser
    token string
}

func (r loginCookieResponse) VisitPostAuthLoginResponse(w http.ResponseWriter) error {
    http.SetCookie(w, &http.Cookie{
        Name:     middleware.CookieName,
        Value:    r.token,
        HttpOnly: true,
        Path:     "/",
    })
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(200)
    return json.NewEncoder(w).Encode(r.user)
}
```

### Backend: Database Migrations
**Pattern**: Sequential Goose migrations + auto-generated type-safe queries (sqlc)

1. **Create migration file** manually in `backend/internal/db/migrations/`
   - Filename format: `NNNN_description.sql` (4-digit sequential, e.g. `0004_add_tags.sql`)
   - Include both `-- +goose Up` and `-- +goose Down` blocks

2. **Run migrations**: `cd backend && make migrate-up`
   - Runs `goose up` against `DATABASE_URL` from env
   - Automatically regenerates sqlc models in `internal/db/generated/`

3. **Rollback**: `make migrate-down`

4. **Update queries if schema changed**: edit `internal/db/queries/*.sql`, then `make sqlc-codegen`

**Migration file format**:
```sql
-- +goose Up
-- +goose StatementBegin
CREATE TABLE tags (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS tags;
-- +goose StatementEnd
```

**Never write raw SQL in business logic** — define named queries in `internal/db/queries/*.sql` and use the generated `*sqlc.Queries` methods from `deps.Deps.DB`.

### Backend: sqlc Query Pattern

Query files live in `internal/db/queries/`. After editing them, run `make sqlc-codegen` to regenerate `internal/db/generated/`.

**Query file example** (`expenses.sql`):
```sql
-- name: CreateExpense :one
INSERT INTO expenses (id, user_id, category, amount, expense_date, remark)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
RETURNING *;

-- name: ListExpensesByUserAndRange :many
SELECT * FROM expenses
WHERE user_id = $1
  AND expense_date BETWEEN $2 AND $3
ORDER BY expense_date, category, created_at;

-- name: UpdateExpense :one
UPDATE expenses
SET amount = $1, remark = $2, updated_at = now()
WHERE id = $3 AND user_id = $4
RETURNING *;

-- name: DeleteExpense :exec
DELETE FROM expenses WHERE id = $1 AND user_id = $2;
```

**sqlc gotchas**:
- `:one` returns a single row (error if none), `:many` returns a slice, `:exec` returns only an error
- Nullable columns map to `pgtype.Text`, `pgtype.Timestamp`, etc. — not plain Go types
- Always scope write queries by `user_id` to prevent cross-user access
- `pgtype.Timestamptz{Time: t.UTC(), Valid: true}` is the pattern for passing timestamps

### Backend: App Service Layer

`internal/app_service/<domain>/<operation>.go` — one file per API operation.

- Receives `deps.Deps` (not raw DB) so it can access all dependencies
- Returns oapi response objects directly — no intermediate domain types
- `middleware.UserIDFromContext(ctx)` — extracts authenticated `uuid.UUID`
- For unexpected errors: return `nil, err` (becomes HTTP 500)
- For expected failures: return appropriate oapi response (e.g. `oapi.GetAuthMe401JSONResponse`)

**Grouping/sorting is done in Go, not SQL** — e.g. `GetExpensesByCategory` fetches a flat list and groups by category in Go code after the query.

**CSV export uses `encoding/csv` + `bytes.Buffer` + `io.Reader`** — build response manually since oapi doesn't handle binary.

### Backend: Authentication

- JWT stored in `HttpOnly` cookie named `access_token` (see `middleware.CookieName`)
- Cookie is set on login/register, cleared on logout
- Signing algorithm: `HS256`, expiry: 7 days, secret from `JWT_SECRET` env var
- `Secure: true` flag only set when `APP_ENV=prod`
- Middleware (`internal/server/middleware/auth.go`) validates the token on every request
- Public routes are bypassed by method+path check at the top of `Auth()`:
  ```go
  if r.Method == "POST" && (r.URL.Path == "/api/auth/login" || r.URL.Path == "/api/auth/register") {
      next.ServeHTTP(w, r)
      return
  }
  ```
- To add a new public route: add its method+path to that bypass block
- User ID is available in app services via `middleware.UserIDFromContext(ctx)` — returns `uuid.UUID`

### Backend: Rate Limiting

`internal/server/middleware/rate_limit.go` — in-memory per-IP sliding window.
- 100 requests per minute per IP
- Uses `sync.Mutex` + map of `*client` structs tracking `Requests` count + `WindowStart`
- Returns `429 Too Many Requests` when exceeded
- No external dependency — pure stdlib

### Backend: Adding Dependencies

- Add to `internal/deps/deps.go` — currently only `DB *sqlc.Queries`
- `pgxpool.Pool` is created in `main.go` and passed to `sqlc.New(pool)` before building `deps.Deps`
- Pass `deps.Deps` through handler → app_service (never pass raw `*pgxpool.Pool` to app services)
- Go tool dependencies (codegen, migration runner): add to `go.mod` `tool` block, then `go mod tidy`

### Backend: Running Locally

```bash
# Full dev environment (DB + backend + frontend) — preferred
cd backend && make run   # runs: docker compose up -d

# Migrations only
cd backend && make migrate-up

# Generate all code (oapi + sqlc + typescript client)
cd backend && make gen
```

**Ports**: backend on `:8080`, frontend dev server on `:5173`

**Vite dev proxy**: requests to `/api` are forwarded to `wdmmg-backend:8080` (Docker service hostname). This only works inside Docker Compose. For bare-metal dev, change `wdmmg-backend` to `localhost` in `frontend/vite.config.ts`.

### Backend: DB Alive Job

`jobs/keep_db_alive.go` — pings the PostgreSQL pool periodically. Required because Fly.io free-tier machines stop when idle, closing DB connections. Started in `main.go` as a goroutine.

### Backend: Key Files Reference

| File | Purpose |
|---|---|
| `main.go` | Chi router setup, CORS, auth + rate-limit middleware, SPA fallback, `KeepDBAlive` job |
| `api/openapi.yml` | Source of truth for all API endpoints and schemas |
| `api/oapi-server.yml` | oapi-codegen config → generates `generated/server/server.gen.go` |
| `Makefile` | All dev commands (codegen, migrations, run) |
| `air.toml` | Hot reload config |
| `internal/server/server.go` | `Server` struct + `NewServer` constructor |
| `internal/server/handlers.go` | All handler methods — one per oapi operation |
| `internal/server/middleware/auth.go` | JWT cookie auth + public route bypass |
| `internal/server/middleware/rate_limit.go` | Per-IP rate limiter (100 req/min) |
| `internal/deps/deps.go` | `type Deps struct { DB *sqlc.Queries }` |
| `internal/db/postgres.go` | `pgxpool.New` with `max_conns=10`, `min_conns=2` |
| `internal/db/sqlc.yml` | sqlc codegen config |
| `internal/db/queries/` | Raw SQL query files (edit these to add/change queries) |
| `internal/db/migrations/` | Goose SQL migration files |
| `internal/db/generated/` | Auto-generated sqlc models + query methods — do NOT edit |
| `generated/server/server.gen.go` | Auto-generated oapi strict server — do NOT edit |
| `jobs/keep_db_alive.go` | Background DB ping job for Fly.io idle machines |

---

## Frontend: Architecture

**Tech stack**: React 19, TypeScript 5.9, Vite 7 (`@vitejs/plugin-react-swc`), Tailwind v4, RTK Query, shadcn/ui (`new-york` style, `gray` base).

**Key principle**: All API hooks are auto-generated — only write page/component code that calls those hooks.

### Frontend: Type-Safe API Calls

**Generated hooks** live in `src/api/client.ts` — do NOT edit manually. Regenerate via:
```bash
cd backend && make gen-ts
# or from frontend/:
npm run codegen
```

**Base API** (`src/store/api.ts`):
- `baseUrl: import.meta.env.VITE_API_URL` — empty string in dev (uses Vite proxy), full URL in prod
- `credentials: 'include'` — sends `HttpOnly` JWT cookie with every request
- `tagTypes: ['Expenses']` — used for cache invalidation
- On `401` response: dispatches `loggedOut()` action from `authSlice`

**RTK Query config** (`frontend/rtk-query.config.cjs`):
```js
schemaFile: "../backend/api/openapi.yml"
apiFile: "./src/store/api.ts"
apiImport: "api"
outputFile: "./src/api/client.ts"
hooks: true
tag: true
```

**Using hooks**:
```tsx
import { usePostExpensesCreateMutation, useGetAuthMeQuery } from '@/api/client'

const MyComponent = () => {
  const { data: me } = useGetAuthMeQuery()
  const [createExpense, { isLoading }] = usePostExpensesCreateMutation()
  // ...
}
```

### Frontend: Auth Bootstrap Pattern

`src/layouts/AuthBootstrap.tsx` wraps the entire app and fires `GET /auth/me` on mount:
- Success → dispatches `loggedIn(user)` to `authSlice`
- Error → dispatches `loggedOut()`
- Shows a loading spinner while `isLoading` is true (prevents flash of login page)

`src/layouts/RequireAuth.tsx` checks `isBootstrapped` before redirecting — avoids premature redirects while auth state is being loaded.

**After login/register**: use `window.location.href = "/"` (full page reload) to re-trigger `AuthBootstrap` and refresh auth state. Do not use `useNavigate()` for this.

### Frontend: Adding a New Page

1. If there is a new API endpoint, update `backend/api/openapi.yml` and run `make gen`
2. Create `frontend/src/pages/MyPage.tsx`
3. Add the route to `src/App.tsx` — wrap in `<RequireAuth>` if auth is required, nest under `<AppLayout>` for the standard shell

**Page component pattern** (always use arrow functions):
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSomeMutation } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const MyPage = () => {
  const navigate = useNavigate()
  const [doThing, { isLoading }] = useSomeMutation()

  const handleSubmit = async () => {
    try {
      await doThing({ ... }).unwrap()
      navigate('/somewhere')
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Page Title</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSubmit} disabled={isLoading}>Go</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyPage
```

### Frontend: Route Structure (`App.tsx`)

```
/login     → <Login>    (public)
/register  → <Register> (public)
/          → <AppLayout>
               └─ <RequireAuth>
                    ├─ /        → <Home>
                    └─ /history → <History>
```

When adding a new protected route, nest it inside `<RequireAuth>` under the `<AppLayout>` route.

### Frontend: Redux State

Three slices in `src/store/`:

| Slice | State | Actions |
|---|---|---|
| `authSlice` | `user`, `isAuthenticated`, `isBootstrapped` | `loggedIn(user)`, `loggedOut()` |
| `homeDateSlice` | `date` (ISO string of currently-viewed day) | `setHomeDate(date)`, `prevHomeDay()`, `nextHomeDay()` |
| `api` (RTK Query) | all server cache | auto-generated per-endpoint |

**`useHomeDate` hook** (`src/hooks/useHomeDate.tsx`): wraps `homeDateSlice` and exposes `date`, `oapiDate` (formatted for API params), `prevDay()`, `nextDay()`.

### Frontend: CSV Export

CSV downloads cannot use RTK Query (no `Blob` support). Use the raw `fetch` wrapper:

```ts
// src/utils/api.ts
export const fetchBlob = async (url: string, body: unknown): Promise<Blob> => {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.blob()
}
```

Then trigger download with `downloadBlob(blob, filename)` from `src/utils/download.ts`.

### Frontend: UI Components (shadcn/ui)

Components live in `src/components/ui/`. Install new ones with:
```bash
cd frontend && npx --yes shadcn@latest add <component-name>
```

**Always use shadcn components over raw HTML**:
- `Button` — with `variant` (`default`, `outline`, `destructive`, `ghost`) and `size` (`sm`, `default`, `lg`)
- `Input` — controlled inputs
- `Label` — form labels (pair with `htmlFor`)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` — layout containers
- `Dialog`, `DialogTrigger`, `DialogContent` — modals
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — tabbed panels

**Toasts**: use `sonner` — `toast.success(...)` and `toast.error(...)`. `<Toaster />` is mounted in `App.tsx`.

**`cn()` utility** (`src/lib/utils.ts`): merges Tailwind classes safely — always use it when combining class strings:
```tsx
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class', className)} />
```

### Frontend: Styling Conventions

- Tailwind v4 utility classes — no inline styles, no `tailwind.config.js`
- CSS variables for theming: `bg-muted`, `text-muted-foreground`, `text-destructive`, `bg-background`, etc.
- Spacing: use Tailwind scale (`p-4`, `gap-2`, `mt-6`) rather than custom pixel values
- Always arrow functions for components and handlers — no `function` declarations

### Frontend: General Conventions

- No i18n — all user-visible strings hardcoded in English
- Local `Expense` type in `src/types/expense.ts` is a simplified version of the oapi type — prefer oapi-generated types for API calls
- `src/utils/formatDate.ts` — use `formatDate(date)` for display strings; do not use `date.toLocaleDateString()` directly
- `src/utils/user.ts` — use `getInitials(user)` for avatar initials

### Frontend: Key Files Reference

| File | Purpose |
|---|---|
| `src/App.tsx` | Route definitions — add all new routes here |
| `src/main.tsx` | App entry point — Redux `Provider` + `<Toaster>` wrap |
| `src/api/client.ts` | Auto-generated RTK Query hooks — do NOT edit |
| `src/store/api.ts` | Base RTK Query API (baseUrl, credentials, 401 handler, tagTypes) |
| `src/store/authSlice.ts` | Auth Redux slice (`user`, `isAuthenticated`, `isBootstrapped`) |
| `src/store/homeDateSlice.ts` | Home date Redux slice (currently-viewed day) |
| `src/store/index.ts` | Redux `configureStore` |
| `src/layouts/AppLayout.tsx` | Shell layout with header, back button, user avatar/logout |
| `src/layouts/AuthBootstrap.tsx` | Fires `GET /auth/me` on mount, bootstraps auth state |
| `src/layouts/RequireAuth.tsx` | Auth gate — redirects to `/login` if not authenticated |
| `src/hooks/useHomeDate.tsx` | Reads `homeDateSlice`, exposes date helpers |
| `src/types/expense.ts` | Local `Expense` type (separate from oapi-generated) |
| `src/utils/api.ts` | Raw `fetch` wrapper for CSV blob downloads |
| `src/utils/formatDate.ts` | `formatDate(date)` display helper |
| `src/utils/download.ts` | `downloadBlob(blob, filename)` |
| `src/utils/user.ts` | `getInitials(user)` |
| `src/components/ui/` | shadcn/ui primitives |
| `src/pages/` | One file per page/route |
| `vite.config.ts` | Vite config — `/api` proxy to `wdmmg-backend:8080` |
| `rtk-query.config.cjs` | RTK Query codegen config |
| `components.json` | shadcn/ui config (`new-york`, `gray`, CSS vars, `lucide`) |

---

## Docker Compose (Dev Environment)

```yaml
services:
  wdmmg-db:       # Postgres 17, port 5432, pgdata_wdmmg volume
  wdmmg-backend:  # golang:1.25, mounts ./backend, runs: goose up → sqlc generate → air
  wdmmg-frontend: # node:22, mounts ./frontend, runs: npm install → npm run dev --host 0.0.0.0
```

**Backend startup sequence** in compose command:
1. `goose up` — run pending migrations
2. `sqlc generate` — regenerate type-safe query methods
3. `air` — start backend with hot reload

**Vite proxy**: All `/api` requests are proxied from the browser to `wdmmg-backend:8080`. This Docker hostname only resolves inside the Compose network. For bare-metal dev, change to `localhost:8080` in `vite.config.ts`.

---

## Production Build (Dockerfile)

Multi-stage build:
1. **`frontend`** stage: `node:22` → `npm install` → `npm run build` (with `VITE_API_URL` build arg)
2. **`backend`** stage: `golang:1.24` → `go mod download` → `go build -o main` → copies `frontend/dist`
3. **`final`** stage: `debian:bullseye-slim` → single binary + `frontend/dist` → `EXPOSE 8080`

The Go binary serves both:
- `GET /api/...` — REST API
- Everything else — SPA fallback (serves `frontend/dist/index.html`)

**Fly.io config** (`fly.toml`):
- App: `where-did-my-money-go`, region: `nrt` (Tokyo)
- `build.args.VITE_API_URL = "https://where-did-my-money-go.fly.dev/api"`
- `auto_stop_machines = 'stop'` — stops on idle (free tier); `KeepDBAlive` job mitigates DB connection drops

---

## Common Pitfalls

1. **Never edit generated files**: `generated/server/server.gen.go`, `frontend/src/api/client.ts`, `internal/db/generated/`
2. **Always run `make gen` after OpenAPI changes** — regenerates both backend interface and frontend hooks together
3. **Always run `make sqlc-codegen` after editing `.sql` query files** — or use `make migrate-up` which runs it automatically
4. **Migration numbers are sequential** — 4-digit zero-padded (`0004_...`), never skip or reuse
5. **After `make migrate-up`, sqlc models regenerate automatically** — commit both migration SQL and `internal/db/generated/` changes
6. **Never scope DB queries without `user_id`** — all expense queries must filter by the authenticated user's ID
7. **JWT auth cookie requires `credentials: 'include'`** on the frontend base query — already set in `store/api.ts`
8. **New public routes must be added to the bypass block** in `internal/server/middleware/auth.go`
9. **CSV export must use raw `fetch`**, not RTK Query — RTK Query doesn't handle `Blob` responses
10. **After login/register use `window.location.href = "/"` not `useNavigate()`** — forces re-trigger of `AuthBootstrap`
11. **Vite proxy `wdmmg-backend` hostname only resolves inside Docker Compose** — not on bare-metal host dev

---

## Adding a New Feature (End-to-End Checklist)

1. [ ] Add migration if new table/column needed: create `internal/db/migrations/NNNN_description.sql` → `make migrate-up`
2. [ ] Add/update SQL query in `internal/db/queries/*.sql` → `make sqlc-codegen`
3. [ ] Add OpenAPI path + schemas in `backend/api/openapi.yml`
4. [ ] Run `make gen` — generates handler stub + frontend hook
5. [ ] Add handler method stub in `internal/server/handlers.go` (one-liner delegating to app service)
6. [ ] Implement app service in `internal/app_service/<domain>/<operation>.go`
7. [ ] If public route: add method+path to bypass block in `internal/server/middleware/auth.go`
8. [ ] Create frontend page in `frontend/src/pages/` (if new route needed)
9. [ ] Add route in `frontend/src/App.tsx` (nest under `<AppLayout>` + `<RequireAuth>` if private)
10. [ ] Run `go build ./...` to verify backend compiles
