# Workflow: outside in, one test at a time

TDD is a design method, not a testing strategy. Each test asks "what should happen when...?" The answer shapes the interface, and the interface shapes the design. Building is discovery: we learn what the code should be one behaviour at a time.

**One test at a time. Always.**

## Modes

At the start of a task, ask the developer which mode to use. Keep to it until the developer changes it.

- **Guided:** propose each test and each change, and wait for approval.
- **Pair:** the developer drives. They may write a use case, a test or any code themselves. Suggest the next test, review their changes, or build one component when they ask.
- **Autonomous:** agree the behaviours, then work without stopping.

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

Use the `tdd-cycle` skill. It names the component, its test and the rules that apply.

1. **RED.** Write one failing test for one behaviour. Test the public interface: inputs, outputs, effects someone can see. If an idea is easy to say in the test, it will be easy to use in the code. The test must compile, so add stubs if needed. Run it and check that it fails **for the right reason**: the behaviour is missing, not a typo or a missing import.
2. **GREEN.** Ask: "what is stopping this test from passing right now?" Name that one thing. Fix it. Ask again. If the answer is a collaborator that does not exist, drop down and build it with its own RED → GREEN → REFACTOR loop. If the answer is one line of code, write that line. Do the simplest thing that works.
3. **REFACTOR.** Improve the design without changing behaviour. This is where the design thinking happens: names, separation of concerns, cohesion, duplication. It is not optional cleanup. Read the change as a reviewer would: missing error handling, leaked internals, things that do not match the rest of the code, failure modes no test covers. If nothing needs to change, say so.
4. **Review the test list** (below). Then write the next test.

When a test needs a new domain idea (a new noun, a new rule, a new state), stop and use the `model-domain` skill before you write domain code.

## The test list is a working list

A list of behaviours to test is useful, but it is a guess. It is never the final list.

- Keep the list short and in business words. Write the list, not the tests.
- After every cycle, use what you learnt to update it: remove tests that are now redundant or wrong, add behaviours you found, and change the order if needed. Say what changed and why.
- This includes tests that already exist. A failing test means a bug, behaviour that moved somewhere else, or behaviour that is no longer correct. Only in the last case, delete the test. In guided and pair mode, ask first.
- A change to the list can need another skill. A new word or rule means `model-domain`. A new user-facing feature means `new-feature`.
- Pick the next test from the list as it is now, not as it was at the start: the most important thing the system does not do yet. Importance comes first. Between two equally important tests, take the one you are more confident about; the loop will make the other clearer.

## Discoveries

When the code shows something new about the problem (a case nobody thought of, two rules that conflict, a technical limit that changes what users get), stop and tell the developer at once, in plain words, with the options you see. Do not decide a business question alone, even in autonomous mode. Put the answer in the test list.

## Think in failures, not features

In GREEN, do not describe what you "need to build". Describe what is missing.

- Bad: "To let members borrow books I need a loan table, a repository, a use case and a route."
- Good: "The test fails because nothing answers the borrow request. The first missing piece is the route."

## Stubs

- A stub only satisfies the compiler. It throws or returns nothing.
- **A stub must not make the test pass.** If a stub has real logic, the test goes green before anything is built.
- No "stub" or "not implemented yet" comments.

## DO NOT

- **DO NOT write more than one test before the first one passes.** Not even as placeholders or `it.todo`. The next test comes from what this one teaches you.
- **DO NOT treat the first test list as final.** Review it after every cycle.
- **DO NOT write code before a failing test asks for it.**
- **DO NOT plan classes, files, tables or architecture up front.** Plan which behaviours to test. The design comes out of the tests.
- **DO NOT batch work.** Every RED, GREEN and REFACTOR is a checkpoint.
- **DO NOT write implementation plans**, even in a planning mode. The plan is: the next acceptance test (one sentence) and the first behaviour inside it (one sentence). Nothing more.
- **DO NOT leave the code broken between steps.** Typecheck and lint must pass when you stop. In RED, only the new test fails at its level. The acceptance test stays red while you build the components it needs; that is expected.
