# {{APP_NAME}}

<!-- One or two sentences: what the app is for and who uses it. -->

## How we work

Outside in, in small steps. One acceptance test for each acceptance criterion of a feature, one unit test at a time, refactor every cycle. Decide the next step from what you just learned. No big specs or implementation plans up front. See `.claude/rules/workflow.md`.

Skills: `new-feature` (a new feature, outside in), `acceptance-test` (one acceptance test), `tdd-cycle` (one component, test-first), `model-domain` (new business words or rules), `test-quality` (review tests).

## Commands

| What | Command |
|---|---|
| Start Postgres | `pnpm db:up` |
| Run web + API | `pnpm dev` (web on :3000, API on :3001) |
| All tests | `pnpm test` |
| Unit tests | `pnpm test:unit` |
| Acceptance tests | `pnpm test:acceptance` (starts the app in Docker) |
| Tests for changed files | `pnpm test:changed` |
| Typecheck / lint | `pnpm typecheck` / `pnpm lint:fix` |
| New migration / apply | `pnpm db:generate` / `pnpm db:migrate` |

## Layout

`web/` React app. `api/` Hono + Litmus API. `api/test-acceptance/` acceptance tests. Details: `.claude/rules/architecture.md`.

A Stop hook runs typecheck and lint and blocks until they pass. A second Stop hook runs related unit tests and reports to the developer only.

@AGENTS.md
