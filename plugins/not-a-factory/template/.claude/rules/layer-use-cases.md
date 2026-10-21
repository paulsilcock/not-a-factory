---
paths:
  - "api/src/use-cases/**"
---

# Use cases

A use case describes one way the system is used (Holub, after Bob Martin): the input a user gives, the processing, and the output. It is part of the solution, not the user's story. A feature usually needs one or more use cases.

- **Commands** (`CommandHandler<Command>`) perform an action on the system, usually with side effects. **Queries** (`QueryHandler<Query, Result>`) read, and have no side effects.
- **One class per use case,** named as the intent: `BorrowBook`, `ListMemberLoans`. Put the zod schema for its input next to it, and export both.
- **A use case never parses, converts, calculates or decides.** Code like `Math.round(Number(amount) * 100)` is a missing value object: move it to the domain, with its own test. Lint blocks `Math`, `Number`, `parseFloat`, `parseInt` and `Date` here. For a real exception, ask the developer, then write `// biome-ignore lint/style/noRestrictedGlobals: <reason>` on that line.
- **A command is a dumb orchestrator in the application layer.** It loads an aggregate through its repository, asks the domain model to decide, saves the result, and calls services. Important decisions belong to the domain layer. External systems are reached through infrastructure services such as repositories, behind interfaces that this project owns.
- **A query reads, and returns a result shaped for its consumer.** It can read the database directly, without repositories (see `repositories.md`).
- **A reaction to a domain event is an ordinary command** (`CloseCart` after `OrderPlaced`). Make it idempotent: it can run twice with the same result. Test it through `handle()`; the acceptance test covers the wiring (see `layer-entrypoints.md`).
- **Agnostic to how it is reached:** no HTTP, CLI, request objects or status codes. Entrypoints translate between the world and the use case.
- `@injectable()`, and `@inject(Token)` on every constructor parameter.
- Test a use case through `handle()`, with real repositories and fakes for other services. Assert on outcomes (what is stored, what is returned), not on calls. Check what is stored through a public interface, such as a repository finder or a query, never by reading tables directly; then a change to the schema does not break the test.
