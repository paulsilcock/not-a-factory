---
name: tdd-cycle
description: Build or change one component test-first, one test at a time. Use when an acceptance test points at a missing piece, when the developer names a component to build (for example "the repository this use case needs"), or for a bug fix or refactor that starts at one component. Names the component, its consumer, its test and the rules that apply, then runs RED → GREEN → REFACTOR until the consumer's need is met.
---

# TDD cycle (inner loop)

> The commands and paths below are for a project created by not-a-factory. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

The cycle itself (RED, GREEN, REFACTOR, stubs, the DO NOT list, the modes) is in `.claude/rules/workflow.md`. This skill decides **what** the cycle builds.

## 1. Find where we are

- What fails now? The acceptance test, a unit test, or nothing yet?
- What changed? `git status` and `git diff`. The developer may have written the consumer, or part of the component.
- What did the developer ask for? If they named the component, use their name and their design.

## 2. Name the component and its consumer

Say it in one sentence: "Building <component> in <layer>, because <consumer> needs <behaviour>." The consumer is the code or test that will call it: the acceptance test, a route, a use case.

| Missing piece | Component | Where | Its test | Runs against | Read first |
|---|---|---|---|---|---|
| A business rule, state or calculation | Aggregate or value object | `api/src/domain/` | `<name>.test.ts`, calls the model directly | Plain objects | `layer-domain.md`; `model-domain` skill if the words or rules are new |
| Something a user intends to do | Use case | `api/src/use-cases/` | `<intent>.test.ts`, calls `handle()` | Real repositories on PGlite, fakes for other services | `layer-use-cases.md` |
| Saving and loading | Repository and table | `api/src/infra/repositories/`, `infra/db/schema.ts` | `<name>-repository.test.ts` | PGlite (`setupTestDb`) | `layer-infra.md`; then `pnpm db:generate` |
| Another service (email, payments) | Interface, adapter and fake | `api/src/infra/<service>/` | Use cases use the fake; the adapter is tested against a local stub of the service | Fake or stub | `layer-infra.md` |
| An HTTP route, status or input check | Route | `api/src/entrypoints/http/` | Usually the acceptance test covers it; write a route test only for HTTP behaviour | The Hono app | `layer-entrypoints.md` |
| What a page shows or does | Route or component | `web/src/routes/`, `web/src/components/` | `<name>.test.tsx`, by role and label | jsdom | `layer-web.md`; `shadcn` skill; TanStack Intent skills |

If the piece does not fit a row, or fits two, ask the developer.

## 3. Start a short test list

List the behaviours the consumer needs from this component, in business words. Only what the consumer needs, not everything the component could do. Write the list, not the tests.

## 4. Cycle, one test at a time

Pick one behaviour from the list and run RED → GREEN → REFACTOR (see the workflow rule).

Run one test file while you work:

- API: `pnpm --filter api exec vitest run src/domain/loan.test.ts`
- Web: `pnpm --filter web exec vitest run src/routes/index.test.tsx`

Paths are relative to the package. Other commands are in `CLAUDE.md`.

In GREEN, if the missing thing is another component (a collaborator), start a new `tdd-cycle` for it. Its consumer is the component you are building now. Then come back.

## 5. After every cycle, review the list

- Remove behaviours that are now redundant or wrong. Add the ones you found. Change the order if needed. Say what changed.
- New words or rules: use `model-domain`.
- A behaviour that a user would see on its own may be a new acceptance criterion or feature: note it for `new-feature`.
- In pair mode, ask the developer whether to continue, or whether they want to take the next step.

## 6. Done when the consumer's need is met

- Run all the package's unit tests: `pnpm --filter api test:unit` or `pnpm --filter web test`.
- If this component is part of a feature, go back to its acceptance test (`new-feature`, step 4).
- If it is a bug fix or a refactor, run `pnpm test` and stop.
