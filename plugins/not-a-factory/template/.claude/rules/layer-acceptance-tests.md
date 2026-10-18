---
paths:
  - "api/test-acceptance/**"
---

# Acceptance tests

Use the `acceptance-test` skill. It explains the four layers, the DSL, drivers, stubs and isolation.

Always:
- Test cases are in the user's words: no `expect`, URLs, JSON, status codes or selectors.
- Each layer calls only the one below it: test case → DSL → driver → system.
- The DSL aliases every name (`this.context.alias(...)`) and gives defaults for what a test does not care about.
- Only the driver knows how the system is reached. It does the checks and throws a clear `Error` when an outcome is wrong.
- Tests treat the app as a black box: only its address and its public interfaces. They never import or run app code (type imports for the typed client are fine), and never touch its database.
- No test depends on data from another test.
