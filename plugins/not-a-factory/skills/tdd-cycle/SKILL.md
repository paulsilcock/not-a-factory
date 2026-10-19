---
name: tdd-cycle
description: Build or change one component test-first, one test at a time - RED, GREEN, REFACTOR. Use when an acceptance test points at a missing piece, when the developer names a component to build (for example "the repository this use case needs"), or for a bug fix or refactor that starts at one component. Names the component and its consumer, clarifies the behaviours, and runs the cycle until the consumer's need is met.
---

# TDD cycle (inner loop)

> The commands and paths below are for a project created by `not-a-factory`. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

This skill finds the component, its consumer and its tests. The cycle itself (RED, GREEN, REFACTOR, review the list) is in `.claude/rules/tdd-workflow.md`. **One test at a time. Always.** Keep to the mode agreed with the developer: it decides where you stop, never which steps you do (see `tdd-workflow.md`).

## 1. Find where we are

- What fails now? The acceptance test, a unit test, or nothing yet?
- What changed? `git status` and `git diff`. The developer may have written the consumer, or part of the component.
- What did the developer ask for? If they named the component, use their name and their design.

## 2. Name the component and its consumer

Say it in one sentence: "Building <component> in <layer>, because <consumer> needs <behaviour>." The consumer is the code or test that will use it: the acceptance test, a route, a use case.

| Missing piece | Component | Where | Its test | Runs against | Read first |
|---|---|---|---|---|---|
| A business rule, state or calculation | Domain model or value object | `api/src/domain/` | `<name>.test.ts`, calls the model directly | Plain objects | `layer-domain.md`; `model-domain` skill if the words or rules are new |
| One way the system is used: a command (changes it) or a query (reads it) | Use case | `api/src/use-cases/` | `<intent>.test.ts`, calls `handle()` | Real repositories, fakes for other services | `layer-use-cases.md` |
| Saving and loading an aggregate | Repository | `api/src/infra/repositories/` | `<name>-repository.test.ts` | The database, or a fake of it | `repositories.md`; `db-drizzle.md` for the default stack |
| Another service (email, a payment gateway, an LLM) | Interface we own, and a thin adapter | `api/src/infra/<service>/` | The interface is designed from use-case tests; the adapter is tested at its edge | Fake or stub of the interface | `layer-infra.md`; "Test doubles" in `writing-tests.md` |
| A new way in: an HTTP route, CLI command, queue consumer, scheduled job | Entrypoint | `api/src/entrypoints/<kind>/` | Usually the acceptance test covers it; write an entrypoint test only for behaviour of that channel | The entrypoint | `layer-entrypoints.md` |
| Complex stateful logic in the client, such as a reducer | Client logic | `web/src/` | `<name>.test.ts`, plain unit test | Plain objects | `layer-web.md` (other UI tests follow its "Testing the UI") |

If the piece does not fit a row, or fits two, ask the developer.

## 3. Clarify the behaviour, then start a short test list

Before the first test, be clear about what the consumer needs:
- What outcome does it expect?
- What are the inputs, and the effects someone can see?
- Which edge cases and failure modes do we already know about?

List **behaviours**, not classes or methods. Write the list, not the tests. Keep it short: only what the consumer needs, not everything the component could do. The list is a guess, and it will change (step 5).

## 4. RED → GREEN → REFACTOR

Follow "Inner loop" in `.claude/rules/tdd-workflow.md`, one cycle at a time, and stop where the mode says. Before the first test, read `.claude/rules/writing-tests.md`.

For this component:
- If GREEN needs a collaborator, start a new `tdd-cycle` for it. Its consumer is the component you are building now. Then come back.
- Run only the test file you are working on, for fast feedback, for example `pnpm --filter api exec vitest run src/domain/loan.test.ts`. That runs Vitest inside `api/`, so the path starts there. Other commands are in `CLAUDE.md`.
- Good tests: see `writing-tests.md`. The `test-quality` skill reviews tests against Farley's properties.

## 5. After every cycle, review the list

- Remove behaviours that are now redundant or wrong. Add the ones you found. Change the order if needed. Say what changed.
- New words or rules: use `model-domain`.
- A behaviour that a user would see on its own may be a new acceptance criterion or feature: note it for `new-feature`.

## 6. Done when the consumer's need is met

- Run all the package's unit tests: `pnpm --filter api test:unit` or `pnpm --filter web test`.
- If this component is part of a feature, go back to its acceptance test (the `acceptance-test` skill, step 4 of the ATDD cycle).
- If it is a bug fix or a refactor, run `pnpm test` and stop.
