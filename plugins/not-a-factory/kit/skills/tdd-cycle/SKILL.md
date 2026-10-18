---
name: tdd-cycle
description: Run one RED → GREEN → REFACTOR cycle for one behaviour, with this project's commands. Use whenever you are about to write or change code in api/ or web/, when a test is failing and you are making it pass, or when the acceptance test points at a missing piece.
---

# TDD cycle (inner loop)

One behaviour per cycle. In guided mode, stop after each step and wait for the developer.

## Commands

| What | Command |
|---|---|
| One API test file | `pnpm --filter api exec vitest run src/domain/order.test.ts` |
| One web test file | `pnpm --filter web exec vitest run src/routes/index.test.tsx` |
| API unit tests | `pnpm --filter api test:unit` |
| Acceptance tests | `pnpm test:acceptance` (needs `pnpm db:up`) |
| Typecheck | `pnpm typecheck` |
| Lint and format | `pnpm lint:fix` |

Paths for `--filter <pkg> exec` are relative to that package.

## 1. RED

- Pick the behaviour from the failure: "what is stopping the outer test right now?"
- Write one test for it. Name it as behaviour: `"a basket with no items cannot be checked out"`.
- Put it next to the code: `api/src/domain/basket.ts` → `api/src/domain/basket.test.ts`.
- If the code does not exist, add a stub so it compiles. The stub throws `new Error()` or returns nothing.
- Run the file. Check that it fails **for the right reason**: the assertion fails, or the stub throws. A missing import or a type error is the wrong reason; fix that and run again.
- Say: "RED: <test name> fails because <reason>."

## 2. GREEN

- Name the one thing that stops the test from passing. Fix only that.
- If the missing thing is a collaborator (a repository, a port, a value object), start a new cycle for it first. Then come back.
- Run the file again. Then run the other tests in the package so you know nothing else broke.
- Say: "GREEN: <what changed>."

## 3. REFACTOR

- Look at the code you changed and the code around it, and the test too.
- Look for: unclear names, duplication, logic in the wrong layer (see the layer rules), leaked internals, missing error handling.
- Change one thing at a time and keep the tests green.
- Run `pnpm typecheck` and `pnpm lint:fix`.
- Say what you changed, or "REFACTOR: nothing to change, because <reason>."

## 4. Next

- Is a planned test now redundant? Did the cycle show a new behaviour?
- Go back to the acceptance test, or start the next cycle.
