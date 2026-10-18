# Workflow: outside in, one test at a time

TDD is a design method, not a testing strategy. Each test asks "what should happen when...?" The answer shapes the interface, and the interface shapes the design. Building is discovery: we learn what the code should be one behaviour at a time.

**One test at a time. Always.**

At the start of a task, ask the developer: **guided** (propose each test and wait for approval) or **autonomous** (agree the behaviours, then work without stopping)? Keep to that mode until the developer changes it.

## Outer loop: one acceptance test per capability

Every user-facing capability starts with ONE failing acceptance test. A capability is something a user (or another system) can do or see. Use the `next-capability` skill.

1. Write ONE acceptance test in business language, through the DSL and a driver. It reads like a requirement. No URLs, no JSON, no class names.
2. Run it. Ask: "why does it fail? What is the first missing piece?" Drop into the inner loop for that piece.
3. Come back up. Does the acceptance test pass? If not, find the next missing piece and repeat.
4. When it passes, ask whether this capability needs a second acceptance test. Usually it does not.

Bug fixes, refactors and internal changes can start at the layer where the problem is and use the inner loop only.

## Inner loop: RED → GREEN → REFACTOR

Use the `tdd-cycle` skill for the exact commands.

1. **RED.** Write one failing test for one behaviour. Test the public interface: inputs, outputs, effects someone can see. If an idea is easy to say in the test, it will be easy to use in the code. The test must compile, so add stubs if needed. Run it and check that it fails **for the right reason**: the behaviour is missing, not a typo or a missing import.
2. **GREEN.** Ask: "what is stopping this test from passing right now?" Name that one thing. Fix it. Ask again. If the answer is a collaborator that does not exist, drop down and build it with its own RED → GREEN → REFACTOR loop. If the answer is one line of code, write that line. Do the simplest thing that works.
3. **REFACTOR.** Improve the design without changing behaviour. This is where the design thinking happens: names, separation of concerns, cohesion, duplication. It is not optional cleanup. Read the change as a reviewer would: missing error handling, leaked internals, things that do not match the rest of the code, failure modes no test covers. If nothing needs to change, say so.
4. **Review.** Is a planned test now redundant? Did a new behaviour appear? Then write the next test.

When a test needs a new domain idea (a new noun, a new rule, a new state), stop and use the `model-domain` skill before you write domain code.

## Think in failures, not features

In GREEN, do not describe what you "need to build". Describe what is missing.

- Bad: "To let members borrow books I need a loan table, a repository, a use case and a route."
- Good: "The test fails because nothing answers the borrow request. The first missing piece is the route."

## Stubs

- A stub only satisfies the compiler. It throws or returns nothing.
- **A stub must not make the test pass.** If a stub has real logic, the test goes green before anything is built.
- No "stub" or "not implemented yet" comments.

## DO NOT

- **DO NOT write more than one test before the first one passes.**
- **DO NOT write code before a failing test asks for it.**
- **DO NOT plan classes, files, tables or architecture up front.** Plan which behaviours to test. The design comes out of the tests.
- **DO NOT batch work.** Every RED, GREEN and REFACTOR is a checkpoint.
- **DO NOT write implementation plans**, even in a planning mode. The plan is: the next acceptance test (one sentence) and the first behaviour inside it (one sentence). Nothing more.
- **DO NOT leave the code broken between steps.** Typecheck and lint must pass when you stop. In RED, only the new test fails.
