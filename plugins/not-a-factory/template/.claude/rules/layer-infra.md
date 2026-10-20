---
paths:
  - "api/src/infra/**"
---

# Infrastructure

Infrastructure is the way out of the system: driven adapters, in hexagonal terms. The app uses it to reach the outside world, for example:
- a database (through repositories and query code);
- a payment gateway, an email service, an LLM, another team's API;
- files, queues and clocks.

## Every adapter

- **It implements an interface that the application core owns** (a port), designed from what the use cases need, in our domain's words. Vendor types and errors stay behind it.
- **Keep it thin,** and test it at its edge: against a local stub of the other service for HTTP, or with evals for LLM calls. Do not unit-test vendor glue by mocking the library (see "Test doubles" in `writing-tests.md`).
- **Use cases get a fake or stub of the interface** in their tests.
- **Read config (`process.env`) only in `main.ts`,** and pass the values in.
- **Wire the real adapter in `main.ts` only.**

For repositories, read `repositories.md`. For the default database stack (Postgres and Drizzle), read `db-drizzle.md`.
