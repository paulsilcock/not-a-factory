---
paths:
  - "api/src/use-cases/**"
---

# Use cases

- One class per user intent, named as the intent: `PlaceOrder`, `ListOpenOrders`.
- Change something: `CommandHandler<Command>`. Read something: `QueryHandler<Query, Result>`. Put the zod schema for the input next to the class and export both.
- A use case orchestrates: load aggregates, ask them to act, save them, call ports. Business rules belong in the domain.
- `@injectable()`, and `@inject(Token)` on every constructor parameter.
- Depend on interfaces for anything outside the process (email, payments, other APIs). Define the interface and its token in `infra/<thing>/`.
- Test a use case through `handle()`, with real repositories on PGlite and fakes for other ports. Assert on outcomes (what is stored, what the result is), not on calls.
