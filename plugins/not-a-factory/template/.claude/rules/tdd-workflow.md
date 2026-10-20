# How you must work

These rules apply to every change to the code, however small, and also when the developer only says "build X" or "fix Y". Building is how we learn what to build, so the developer decides what comes next, one small tested step at a time. The skills hold the detail. This rule says which skill to use, and what you always do.

## 1. Choose the skill before you change any code

| The change | Skill |
|---|---|
| New behaviour that a user (or another system) can see or use | `new-feature`. It uses `acceptance-test`, `acceptance-dsl` and `acceptance-driver`. |
| A change inside the system: a domain rule, a component that a test needs | `tdd-cycle` |
| A refactor | `tdd-cycle`, REFACTOR only: no new behaviour, and all tests stay green |
| The request or a test has a business rule, limit, state or new business word (for example "at most 3 per member") | `domain-discovery`, before any test. Stop until the developer agrees its summary, in every mode. |
| A review of tests | `test-quality` |

Load the skill before you write the first test. If you are not sure which row applies, ask the developer.

## 2. Before you start

- Ask the developer which mode to use. Show the modes as a list of options (the `AskUserQuestion` tool), with step first, as the default. Keep to the mode until the developer changes it.
- Find where we are: which tests fail, `git status` and `git diff`. Never rewrite code that the developer wrote. If it has no test, say so and ask.

## 3. Modes: where you stop

The mode changes only where you stop. It never changes the steps.

1. **Step (default):** stop after each RED, GREEN, REFACTOR and list review.
2. **Cycle:** stop after each full cycle.
3. **Component:** stop when the component's test list is done, or when you are stuck.
4. **Criterion:** stop when the acceptance test for one criterion passes.

## 4. Every cycle, in this order

Before the first test of a component, write its test list in your message: a short checklist of behaviours, most important first. The list is a guess; it changes after every cycle.


1. **RED:** write one failing test for one behaviour. Run it. It must fail because the behaviour is missing, not because of a typo or a missing import.
2. **GREEN:** fix only the one thing that stops the test passing, with the simplest correct code. Simplest never means a shortcut: no hard-coded value that the system should store or compute, no data dropped on save, no stub left behind. If that is a new collaborator (a domain model, a repository, a service), stop: give it its own test and cycles first, then come back.
3. **REFACTOR:** always. Improve the design without changing behaviour. Remove unused code: any method, export, parameter or file that no test or caller uses. Replace any fixed value that only repeats what the test expects with real code. If nothing needs to change, say so.
4. **Review the test list:** remove, add or reorder, and show the list with what changed.

Write one line for each step as you do it. The line starts with the step name in bold, then what you did:

```
**RED:** a claim over £500 stays waiting after one approval. Fails: the status is "approved".
**GREEN:** the claim counts its approvals.
**REFACTOR:** nothing to change.
**LIST:** removed "two approvals by one manager" (the test above covers it). Next: a second manager approves.
```

Write all four lines for every cycle, in every mode, also when a step changed nothing. The modes only change where you stop, not what you write. Never start the next test before you have written the REFACTOR and LIST lines, so that the developer can see that no step was skipped.

Stubs only satisfy the compiler. They throw or return nothing, and never make a test pass.

## 5. Stay in scope

- Build only what the current failing test asks for.
- Before you write production code, check that a test fails because that code is missing. If none does, stop and write the test first.
- Anything more needs the developer first: a new behaviour, a new criterion, another component, or a refactor outside this step. Put it on the test list, and ask.
- Where a feature lives in the app (its route and navigation) and how it looks are the developer's decisions. Ask; do not decide them yourself.
- A discovery or a business question (a case nobody thought of, two rules that conflict, a limit that changes what users get) stops you in every mode. Tell the developer at once, in plain words, with the options you see. Never decide a business question yourself.

## 6. Small batches

Small batches limit the damage when something goes wrong, and get code to users sooner.

- **Commit** on a branch for the feature at green points, at least once per cycle. The message says the behaviour in business words. Never commit at RED. Never revert by yourself: if a test fails for a reason you did not expect, tell the developer and offer to go back to the last commit.
- **Recommend a merge** to `main` when it is safe. Only the developer merges. It is safe when:
  - All tests pass. An acceptance test in progress is marked `it.fails`, and fails for the expected reason.
  - No entrypoint (a route, a page, a navigation entry, a CLI command, an event subscription) reaches behaviour whose acceptance test does not pass yet. The domain, use cases and infrastructure can merge before it.
  - It works with the version already deployed: a migration only adds.
- **Say what users will see** after the merge, in plain words, for example "staff can submit claims, but nobody can approve them yet".

## Never

- Never write a second test before the first one passes. Not even as a placeholder or `it.todo`.
- Never write production code before a failing test asks for it.
- Never plan classes, files, tables or architecture up front, or write an implementation plan, even in a planning mode. The plan is the next test.
- Never batch work. Every RED, GREEN and REFACTOR is a checkpoint.
- Never stop with code that does not compile or lint. In RED, only the new test fails at its level; an acceptance test stays red while you build what it needs.
