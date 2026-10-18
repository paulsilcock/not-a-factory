# Testing

## Good tests

- A test says **what the system does**, not how it does it.
- A test fails when behaviour changes and keeps passing when only the structure changes. If a refactor makes you change tests, the tests are coupled to the implementation.
- Test names read as a specification of behaviour that someone can see. Never put a class, function, option, table or framework name in the title.
  - Bad: `"OrderRepository.save sets status to PLACED"`
  - Bad: `"checkout handler returns 201"`
  - Good: `"a customer sees their order after checkout"`
  - Good: `"a customer cannot check out an empty basket"`
- Before you write a test, look for one that already covers the behaviour. If a broader test covers it, do not write the narrow one. Write the broadest useful test first.
- Use `it()`, and put unit tests next to the code: `thing.ts` and `thing.test.ts`.

## Fakes, not mocks

- **Default: classicist.** Use real objects and assert on outcomes.
- **Fakes** (simple, working in-memory versions, such as PGlite for Postgres) when real infrastructure is too slow or not practical. A fake has real logic, not expectations.
- **Mocks** (objects that record calls) only at real boundaries, when the interaction is the behaviour.
- **Only mock what you own.** Wrap third-party services in an interface that this project owns, and fake that interface. Never mock a library.

## Acceptance tests

- Real objects and fakes only. No mocks.
- **No `expect` in acceptance test cases.** The case calls DSL methods. A DSL method such as `confirmOrderPlaced()` asks the driver, and the driver does the assertion.
- **No test-only behaviour in the app.** No test endpoints, no reset commands, no flags that only tests use. Drivers use the same public interfaces as real users.
- Tests must not depend on each other. Use the DSL's aliases so that names are unique for each test, and the tests can share one database.

Use the `test-quality` skill to review tests.
