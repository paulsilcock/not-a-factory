---
name: tdd-cycle
description: Build or change one component test-first, one test at a time - RED, GREEN, REFACTOR. Use when an acceptance test points at a missing piece, when the developer names a component to build (for example "the repository this use case needs"), or for a refactor that starts at one component. Names the component and its consumer, clarifies the behaviours, and runs the cycle until the consumer's need is met.
---

# TDD cycle (inner loop)

> The commands and paths below are for a project created by `not-a-factory`. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

TDD is a design method, not a testing strategy. Each test asks "what should happen when...?" The answer shapes the interface, and the interface shapes the design. We learn what the code should be one behaviour at a time.

**One test at a time. Always.** Keep to the mode agreed with the developer (see `.claude/rules/tdd-workflow.md`): it decides where you stop, never which steps you do.

## 1. Find where we are

- What fails now? The acceptance test, a unit test, or nothing yet?
- What changed? `git status` and `git diff`. The developer may have written the consumer, or part of the component.
- What did the developer ask for? If they named the component, use their name and their design.
- The state of the work is in the code, not in your memory. Find it there, so that the developer and you can take over from each other at any checkpoint.
- If the developer wrote code without a test, do not rewrite it. Say what has no test, and ask whether to add one now.

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

Before the first test, read `.claude/rules/writing-tests.md`. Then do one cycle at a time, and stop where the mode says. Each step ends with a check. Do not go to the next step until the check passes.

### RED

Write one failing test for the most important behaviour on the list. Test the public interface: inputs, outputs, effects someone can see. If an idea is easy to say in the test, it will be easy to use in the code.

The test must compile, so add stubs if needed. A stub only satisfies the compiler: it throws or returns nothing. A stub must never make the test pass. No "stub" or "not implemented yet" comments.

Run only this test file, for fast feedback, for example `pnpm --filter api exec vitest run src/domain/loan.test.ts`. That runs Vitest inside `api/`, so the path starts there.

**Check before GREEN:**
- Exactly one new test fails.
- It fails because the behaviour is missing: an assertion fails, or a stub throws. Not a typo, a missing import or a broken setup. If it fails for any other reason, fix the test first.
- Typecheck and lint pass.

### GREEN

Ask: "what is stopping this test from passing right now?" Name that one thing, fix it, run the test, and ask again. Describe what is missing, not what you "need to build":
- Bad: "To let members borrow books I need a loan table, a repository, a use case and a route."
- Good: "The test fails because nothing records the loan. The first missing piece is somewhere to keep it."

If the answer is one line of code, write that line. Do the simplest thing that works, even if it looks too simple: the next test will show what is missing.

If the missing thing is a new collaborator (another object, with its own clear responsibility, that this component works with, such as a domain model or a repository), stop and start a new `tdd-cycle` for it, with its own tests. Never create it inside this GREEN. Its consumer is the component you are building now. Its behaviour must help that consumer fulfil its own responsibility; design it from that need. Then come back.

**Check before REFACTOR:**
- The new test passes, and all the other tests in this file still pass.
- You wrote no code that no test asks for. If you did, remove it, or put the behaviour on the test list.

### REFACTOR

Improve the design without changing behaviour: names, separation of concerns, cohesion, duplication. This is where the design thinking happens; it is not optional cleanup. Read the change as a reviewer would: missing error handling, leaked internals, things that do not match the rest of the code, failure modes no test covers.

**Check before the list review:**
- All tests still pass, and typecheck and lint pass.
- You changed no behaviour. A failure mode that no test covers goes on the test list; it is not fixed here.
- If nothing needed to change, you said so.

## 5. After every cycle, review the list

The list is a guess, never the final list. Use what this cycle taught you:
- Remove behaviours that are now redundant or wrong. Add the ones you found. Change the order if needed. Say what changed and why.
- This includes tests that already exist. A failing test means a bug, behaviour that moved somewhere else, or behaviour that is no longer correct. Only in the last case, delete the test. In step and cycle mode, ask first.
- New words or rules: use `model-domain`.
- A behaviour that a user would see on its own may be a new acceptance criterion or feature: note it for `new-feature`, and ask the developer. Do not build it.
- Pick the next test from the list as it is now: the most important thing the component does not do yet. Importance comes first. Between two equally important tests, take the one you are more confident about; the loop will make the other clearer.

## 6. Done when the consumer's need is met

- Run all the package's unit tests: `pnpm --filter api test:unit` or `pnpm --filter web test`.
- If this component is part of a feature, go back to its acceptance test (the `acceptance-test` skill, step 4 of the ATDD cycle).
- If it is a refactor, run `pnpm test` and stop.
