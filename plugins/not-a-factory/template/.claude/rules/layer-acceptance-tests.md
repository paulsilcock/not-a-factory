---
paths:
  - "api/test-acceptance/**"
---

# Acceptance tests

Four layers. Each layer knows only the one below it.

```
test case   WHAT the user does and sees, in business language
DSL         the business words: dsl.orders.place(...), dsl.orders.confirmPlaced(...)
driver      HOW: HTTP calls (or browser, or CLI). Holds protocol state. Does the assertions.
system      the real app, started by system.ts
```

- Test cases have no `expect`, no URLs, no JSON, no status codes.
- The DSL turns business words into driver calls. It uses `this.context.alias(name)` so names are unique for each test.
- The driver interface (`driver.ts`) is in business words too. Each protocol has a class that implements it (`driver/http.ts`). An assertion that fails throws an error with a clear message.
- Add a DSL area (`dsl/orders.ts`) when the first test needs it, not before.
- Start the system only through `system.ts`. Do not reach into the container or the database from a test.
- Use the `new-capability` skill.
