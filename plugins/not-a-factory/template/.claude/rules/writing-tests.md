# Writing tests

## Good tests

- A test says **what the system does**, not how it does it.
- A test fails when behaviour changes and keeps passing when only the structure changes. If a refactor makes you change tests, the tests are coupled to the implementation.
- Test names read as a specification of behaviour: what the code does for whoever uses it. For domain models, use cases and acceptance tests, that is in business words. For a technical component, such as a repository or an adapter, it is what its consumer can rely on ("a saved loan can be found by its member"). Never put a class, function, option, table or framework name in the title.
  - Bad: `"OrderRepository.save sets status to PLACED"`
  - Bad: `"checkout handler returns 201"`
  - Good: `"a customer sees their order after checkout"`
  - Good: `"a customer cannot check out an empty basket"`
- Before you write a test, look for one that already covers the behaviour. If a broader test covers it, do not write the narrow one. Start with the most important behaviour that you are most confident about, and make it pass with the smallest change.
- Use `it()`, and put unit tests next to the code: `thing.ts` and `thing.test.ts`.

## Test doubles

- **Default: classicist.** Use real objects and assert on outcomes.
- **Fakes** (working in-memory versions, such as PGlite for Postgres) when the real thing is too slow or impractical.
- **Only mock what you own. Never mock a library directly.** Where nothing can be faked (LLM calls, HTTP calls to other systems), our code depends on an interface we own, and its tests use a stub or mock of that interface, with canned responses for each case.
- **Design that interface from the consumer's needs,** in our domain's words, not the vendor's. Vendor types and errors stay behind it.
- **Keep the adapter behind it thin,** and test it at its edge: against a local stub of the other service for HTTP, or with evals for LLM calls. Do not unit-test vendor glue by mocking the library.

## Acceptance tests

How to write one with ATDD: the `acceptance-test` skill (DSL words: `acceptance-dsl`; drivers: `acceptance-driver`).

- Real objects and fakes only. No mocks.
- **No `expect` in acceptance test cases.** The case calls DSL methods. A DSL method such as `confirmOrderPlaced()` asks the driver, and the driver does the assertion.
- **No test-only behaviour in the app.** No test endpoints, no reset commands, no flags that only tests use. Drivers use the same public interfaces as real users.
- Tests must not depend on each other. Use the DSL's aliases so that names are unique for each test, and the tests can share one database.

Use the `test-quality` skill to review tests.
