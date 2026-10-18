---
name: test-quality
description: Review the quality of tests against Dave Farley's eight properties of good tests and the acceptance-test layering rules. Use when the developer asks to review tests, after a capability is finished, or when tests feel slow, brittle or hard to read.
---

# Test quality review

Review the tests the developer names, or the tests changed since the last commit (`git diff --name-only HEAD` and untracked `*.test.ts(x)` files).

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
- Does the test name a class, function, table or framework? Rename it as behaviour.
- Does a refactor make you change it? It is coupled to the implementation.

## Acceptance tests, also check

- Business words only in test cases. No `expect`, URLs, JSON or status codes.
- The DSL has no protocol details. The driver does the assertions.
- No test-only behaviour in the app.
- Names are aliased, so tests do not depend on each other or on the order they run in.
- One acceptance test per acceptance criterion; no criterion without one, and no test without a criterion.

## Report

1. A table: property, rating, evidence.
2. The three changes that would help most, each with file and test name.
3. Ask the developer which ones to make. Do not change tests without approval.

Source: the eight properties are from Dave Farley's work on test quality, as used in citypaul's test-design-reviewer skill.
