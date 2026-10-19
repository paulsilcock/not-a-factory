# TDD workflow: outside in, one test at a time

TDD is a design method, not a testing strategy. Each test asks "what should happen when...?" The answer shapes the interface, and the interface shapes the design. Building is discovery: we learn what the code should be one behaviour at a time.

**One test at a time. Always.**

## Modes

At the start of a task, ask the developer which mode to use. Show the modes as a list of options (the `AskUserQuestion` tool), with step mode first, as the default. Keep to the mode until the developer changes it.

The mode decides only where you stop. In every mode, each cycle is RED → GREEN → REFACTOR → review the test list, in that order, with the same checks. In every mode, a discovery or a business question stops you at once (see "Discoveries").

1. **Step (default):** stop after each RED, GREEN, REFACTOR and list review. Show what you did, and wait for approval.
2. **Cycle:** complete one full cycle, then stop.
3. **Component:** continue the cycles until the component's test list is done, then stop. Stop earlier if you are stuck.
4. **Criterion:** do all the work for one acceptance test, outside in, until it passes. Then stop.

The developer may write code themselves at any time, in any mode: a test, a use case, anything. When they do, find where we are (see "Handovers"), review their changes, and continue from there.

## Handovers

The state of the work is in the code, not in your memory. Before you start or continue, find where we are: which tests fail (`pnpm test:changed`, `pnpm test:acceptance`) and what changed (`git status`, `git diff`). Then the developer and you can take over from each other at any checkpoint.

If the developer wrote code without a test, do not rewrite it. Say what has no test, and ask whether to add one now.

## Outer loop: acceptance tests drive each feature

An acceptance test is an executable specification: it says what the system must do for a user, in the user's words, before any code exists. It guides the work until the specification is met, and it keeps checking it after every later change. Together with TDD, it catches mistakes in what we build, not only in how we build it.

A feature is new behaviour that a user (or another system) can see or use through the system's public interface. Use the `new-feature` skill. It agrees the feature's acceptance criteria with the developer; each criterion gets its own acceptance test.

1. Take ONE acceptance criterion and write its acceptance test (the `acceptance-test` skill).
2. Run it. Ask: "why does it fail? What is the first missing piece?" Build that piece with the inner loop.
3. Come back up. Does the acceptance test pass? If not, find the next missing piece and repeat.
4. When it passes, review the list of criteria (as for the test list below), then take the next one. The feature is done when every criterion has a passing acceptance test.

Not a feature: a new endpoint for behaviour that already exists, an internal change, a refactor, performance work. These start at the component where the change is, with the inner loop only. A bug fix gets an acceptance test only when it shows a criterion that no test covers.

## Inner loop: RED → GREEN → REFACTOR

Use the `tdd-cycle` skill: it names the component, and has the detail of each step. In short:

1. **RED:** one failing test for one behaviour. It must fail for the right reason: the behaviour is missing.
2. **GREEN:** fix the one thing that stops it passing. The simplest thing that works.
3. **REFACTOR:** improve the design without changing behaviour. Not optional.
4. **Review the test list,** then the next test.

When a test needs a new domain idea (a new noun, a new rule, a new state), stop and use the `model-domain` skill before you write domain code.

## The test list is a working list

A list of behaviours to test is useful, but it is a guess. It is never the final list.

- Keep the list short and in business words. Write the list, not the tests.
- After every cycle, use what you learnt to update it: remove tests that are now redundant or wrong, add behaviours you found, and change the order if needed. Say what changed and why.
- This includes tests that already exist. A failing test means a bug, behaviour that moved somewhere else, or behaviour that is no longer correct. Only in the last case, delete the test. In step and cycle mode, ask first.
- A change to the list can need another skill. A new word or rule means `model-domain`. A new user-facing feature means `new-feature`.
- Pick the next test from the list as it is now, not as it was at the start: the most important thing the system does not do yet. Importance comes first. Between two equally important tests, take the one you are more confident about; the loop will make the other clearer.

## Discoveries

When the code shows something new about the problem (a case nobody thought of, two rules that conflict, a technical limit that changes what users get), stop and tell the developer at once, in plain words, with the options you see. Do not decide a business question alone, in any mode. Put the answer in the test list.

## DO NOT

- **DO NOT write more than one test before the first one passes.** Not even as placeholders or `it.todo`. The next test comes from what this one teaches you.
- **DO NOT treat the first test list as final.** Review it after every cycle.
- **DO NOT write code before a failing test asks for it.**
- **DO NOT plan classes, files, tables or architecture up front.** Plan which behaviours to test. The design comes out of the tests.
- **DO NOT batch work.** Every RED, GREEN and REFACTOR is a checkpoint, in every mode: the code compiles, and you can say what changed.
- **DO NOT write implementation plans**, even in a planning mode. The plan is: the next acceptance test (one sentence) and the first behaviour inside it (one sentence). Nothing more.
- **DO NOT leave the code broken between steps.** Typecheck and lint must pass when you stop. In RED, only the new test fails at its level. The acceptance test stays red while you build the components it needs; that is expected.
