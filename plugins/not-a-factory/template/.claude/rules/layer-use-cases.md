---
paths:
  - "api/src/use-cases/**"
---

# Use cases

A use case describes one way the system is used (Holub, after Bob Martin): the input a user gives, the processing, and the output. It is part of the solution, not the user's story. A feature usually needs one or more use cases.

- **Commands** (`CommandHandler<Command>`) perform an action on the system, usually with side effects. **Queries** (`QueryHandler<Query, Result>`) read, and have no side effects.
- **One class per use case,** named as the intent: `BorrowBook`, `ListMemberLoans`. Put the zod schema for its input next to it, and export both.
- **A dumb orchestrator in the application layer.** It loads what it needs, asks the domain model to decide, saves the result, and calls services. Important decisions belong to the domain layer. External systems are reached through infrastructure services such as repositories, behind interfaces that this project owns.
- **Agnostic to how it is reached:** no HTTP, CLI, request objects or status codes. Entrypoints translate between the world and the use case.
- `@injectable()`, and `@inject(Token)` on every constructor parameter.
- Test a use case through `handle()`, with real repositories on PGlite and fakes for other services. Assert on outcomes (what is stored, what is returned), not on calls.
