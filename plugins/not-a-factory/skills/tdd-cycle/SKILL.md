---
name: tdd-cycle
description: Build or change one component test-first, one test at a time - RED, GREEN, REFACTOR. Use when an acceptance test points at a missing piece, when the developer names a component to build (for example "the repository this use case needs"), or for a bug fix or refactor that starts at one component. Names the component and its consumer, clarifies the behaviours, and runs the cycle until the consumer's need is met.
---

# TDD cycle (inner loop)

> The commands and paths below are for a project created by `not-a-factory`. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

TDD is a design method, not a testing strategy. Each test asks "what should happen when...?" The answer shapes the interface, and the interface shapes the design. We learn what the code should be one behaviour at a time. **One test at a time. Always.** Keep to the mode agreed with the developer: it decides where you stop, never which steps you do (see `tdd-workflow.md`).

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

1. **RED.** Write one failing test for the most important behaviour on the list. Test the public interface: inputs, outputs, effects someone can see. If an idea is easy to say in the test, it will be easy to use in the code. The test must compile, so add stubs if needed. Run it and check that it fails **for the right reason**: the behaviour is missing, not a typo or a missing import.
2. **GREEN.** Ask: "what is stopping this test from passing right now?" Name that one thing, fix it, and ask again. Describe what is missing, not what you "need to build":
   - Bad: "To let members borrow books I need a loan table, a repository, a use case and a route."
   - Good: "The test fails because nothing records the loan. The first missing piece is somewhere to keep it."

   If the missing thing is a collaborator (another object, with its own clear responsibility, that this component works with), start a new `tdd-cycle` for it. Its consumer is the component you are building now. Then come back. If the answer is one line of code, write that line. Do the simplest thing that works.
3. **REFACTOR.** Improve the design without changing behaviour: names, separation of concerns, cohesion, duplication. This is where the design thinking happens; it is not optional cleanup. Read the change as a reviewer would: missing error handling, leaked internals, things that do not match the rest of the code, failure modes no test covers. If nothing needs to change, say so.

Run only the test file you are working on, for fast feedback, for example `pnpm --filter api exec vitest run src/domain/loan.test.ts`. That runs Vitest inside `api/`, so the path starts there. Other commands are in `CLAUDE.md`.

**Stubs** only satisfy the compiler: they throw or return nothing. A stub must not make the test pass. No "stub" or "not implemented yet" comments.

## What makes a good test

- It says **what** the component does for its consumer, not how. It fails when behaviour changes, and keeps passing when only the structure changes. If a refactor makes you change tests, they are coupled to the implementation.
- **Its name is a specification:** in business words for domain models and use cases; in terms of what the consumer can rely on for technical components ("a saved loan can be found by its member"). Never a class, function or framework name.
- **Look for an existing test first.** If a broader test already covers the behaviour, do not write the narrow one.
- Aim for Farley's properties: understandable, maintainable, repeatable, atomic, necessary, granular, fast, and written first. The `test-quality` skill reviews tests against them.
- Real objects and fakes by default; stubs or mocks only of interfaces we own. See "Test doubles" in `writing-tests.md`.

## 5. After every cycle, review the list

- Remove behaviours that are now redundant or wrong. Add the ones you found. Change the order if needed. Say what changed.
- New words or rules: use `model-domain`.
- A behaviour that a user would see on its own may be a new acceptance criterion or feature: note it for `new-feature`.

## 6. Done when the consumer's need is met

- Run all the package's unit tests: `pnpm --filter api test:unit` or `pnpm --filter web test`.
- If this component is part of a feature, go back to its acceptance test (the `acceptance-test` skill, step 4 of the ATDD cycle).
- If it is a bug fix or a refactor, run `pnpm test` and stop.
