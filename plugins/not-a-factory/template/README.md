# {{APP_NAME}}

Web app (TanStack Router, TanStack Query, shadcn/ui) and API (Hono, Litmus, Drizzle, Postgres) in one pnpm workspace. In production, the API also serves the built web app.

## Needs

- Node.js 24.14.1 or later, pnpm 10
- Docker (for the local Postgres)
- For the Claude Code TypeScript language server: `npm install -g typescript-language-server typescript`

## Start

```sh
pnpm install
pnpm db:up        # Postgres on localhost:5432
pnpm db:migrate
pnpm dev          # web http://localhost:3000, API http://localhost:3001
```

`.env` holds `DATABASE_URL` (see `.env.example`).

## Test

```sh
pnpm test:unit
pnpm test:acceptance   # builds the app image and runs it with Postgres in Docker
pnpm test              # both
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, unit tests, acceptance tests against the app's Docker image, and the build, on every push and pull request.
