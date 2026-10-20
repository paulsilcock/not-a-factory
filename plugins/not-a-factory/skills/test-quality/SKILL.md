---
name: test-quality
description: Review the quality of tests against Dave Farley's eight properties of good tests and the acceptance-test layering rules, and check the code they drive for what REFACTOR should have removed (unused code, fixed values, duplication). Use when the developer asks to review tests, after a capability is finished, or when tests feel slow, brittle or hard to read.
---

# Test quality review

Review the tests the developer names, or the tests changed since the last commit (`git diff --name-only HEAD` and untracked `*.test.ts(x)` files). After a criterion, review everything the criterion changed: `git diff --name-only main...HEAD` and uncommitted files.

## The eight properties

Rate each property **Strong**, **Mixed**, **Weak** or **Not assessed**. Give evidence (file and test name) for each rating. Do not add the ratings up into one number. The risks are not equal, so one number hides more than it shows.

| Property | Look at | Strong means |
|---|---|---|
| Understandable | names, arrange/act/assert, business words | You can see the behaviour and the failure without reading the code under test |
| Maintainable | coupling, duplication, fixtures, public interfaces only | A refactor that keeps behaviour does not break the test |
| Repeatable | time, randomness, network, shared data | Same result every run, also in parallel |
| Atomic | shared state, order, cleanup | The test runs alone, and a failure points to one behaviour |
| Necessary | the risk it protects | Delete it and you lose real evidence |
| Granular | scope and failure messages | One outcome per test; related assertions can stay together |
| Fast | measured time for its layer | Fast enough for the loop it is used in |
| First | git history, RED runs | The test failed for the right reason before the code was written |

Mark **Fast** "Not assessed" if you did not run the tests. Mark **First** "Not assessed" if there is no history to show it.

Quick checks:
- Would the test still pass if you deleted the production code? Then it tests nothing.
- Would the test still pass if the code returned a fixed value? Then it cannot tell real behaviour from a fake. Add an example with a different value.
- Does the test name a class, function, table or framework? Rename it as behaviour.
- Does a refactor make you change it? It is coupled to the implementation.

## The code the tests drive

REFACTOR is easy to skip. Check the production code that these tests drove, and give file, line and name for each finding:
- **Unused code:** a method, export, parameter, type or file that no production code calls. A method that only its own test calls is unused, for example a repository finder that no use case calls yet. If the project has a `knip` script, run it (`pnpm knip`) first. Otherwise, search for each new name (`grep -rn`, or the language server's references) and ignore the test files.
- **Fixed values:** a value in production code that only repeats what a test expects, where the system should store or compute it.
- **Duplication** in production code that one name would remove.
- **Names** that are not the business's words, or that no longer say what the code does.

## Acceptance tests, also check

- Business words only in test cases. No `expect`, URLs, JSON or status codes.
- The DSL has no protocol details. The driver does the assertions.
- No test-only behaviour in the app.
- Names are aliased, so tests do not depend on each other or on the order they run in.
- One acceptance test per acceptance criterion; no criterion without one, and no test without a criterion.

## Report

1. A table: property, rating, evidence.
2. The findings in the code the tests drive, each with file, line and name. Write "none" if there are none.
3. The three changes that would help most, each with file and test name.
4. Ask the developer which ones to make. Do not change tests or code without approval.

Sources:
- The eight properties: Dave Farley's work on test quality, as used in citypaul's [test-design-reviewer](https://smithery.ai/skills/citypaul/test-design-reviewer) skill.
- Acceptance tests: Dave Farley, [Acceptance Testing for Continuous Delivery](https://edinburgh.bcs.org/events/2015/acceptance_testing_for_continuous_delivery.pdf) (slides) and [ATDD how-to guide](https://continuous-delivery.co.uk/downloads/ATDD%20Guide%2026-03-21.pdf).
