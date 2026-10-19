# {{APP_NAME}}

<!-- One or two sentences: what the app is for and who uses it. -->

## How we work

The aim is to build the right thing, quickly and safely, with the developer in the loop. Building is discovery: each small, tested step shows what to build next. So work in tight feedback loops and small batches, one test at a time, and decide the next step from what you just learned. No big specs or implementation plans up front. The rules are in `.claude/rules/tdd-workflow.md`.

Which skill when:
- New behaviour that a user can see or use → `new-feature`. It uses `acceptance-test`, `acceptance-dsl` and `acceptance-driver`.
- Any other change, or one component that a test needs → `tdd-cycle`.
- Business rules, limits, states or new business words → `domain-discovery`, before domain code.
- Review tests → `test-quality`.

## Commands

| What | Command |
|---|---|
| Start Postgres | `pnpm db:up` |
| Run web + API | `pnpm dev` (web on :3000, API on :3001) |
| All tests | `pnpm test` |
| Unit tests | `pnpm test:unit` |
| Acceptance tests | `pnpm test:acceptance` (starts the app in Docker, and leaves it running) |
| Stop the acceptance-test stack | `pnpm test:acceptance:down` |
| Tests for changed files | `pnpm test:changed` |
| Typecheck / lint | `pnpm typecheck` / `pnpm lint:fix` |
| New migration / apply | `pnpm db:generate` / `pnpm db:migrate` |

## Layout

`web/` React app. `api/` Hono + Litmus API. `acceptance-tests/` acceptance tests for the whole system. Details: `.claude/rules/architecture.md`.

## Finding things out

- Use the TypeScript language server (the `typescript-lsp` plugin) for definitions, references, types and JSDoc before you grep.
- For Litmus, read the JSDoc through the language server and the `.d.mts` files in `node_modules/@litmus-ts/*`. Do not guess an API.
- For TanStack libraries, use the TanStack Intent skills (see `AGENTS.md`). For UI components, use the `shadcn` skill.

## Hooks

A Stop hook runs typecheck and lint and blocks until they pass. A second Stop hook runs related unit tests and reports to the developer only.

@AGENTS.md
