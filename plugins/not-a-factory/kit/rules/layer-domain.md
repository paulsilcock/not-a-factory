---
paths:
  - "api/src/domain/**"
---

# Domain layer

- **Discovery before domain code.** If the test needs a new noun, rule or state, use the `model-domain` skill and ask the developer. Do not guess business rules.
- Use the developer's words for names. If a term is unclear, ask.
- No I/O and no framework: no database, no HTTP, no tsyringe, no `process.env`. Only Litmus core types and plain TypeScript.
- Not every capability needs a rich model. If a capability only stores and shows data, keep the domain thin.
- An aggregate (`AggregateRoot`) is a consistency boundary. Keep it small: only what must change together in one transaction. Refer to other aggregates by ID.
- Rules live on the aggregate as methods that protect its invariants. A use case asks the aggregate to do something; it does not check the rules itself.
- `ValueObject` for values with no identity (money, email address, date range). Validate in the constructor.
- A broken rule throws a `DomainError` subclass with a business name (`BasketIsEmpty`, not `ValidationError`). `serve` maps it to an HTTP status by class name in `main.ts`.
- IDs: `prefixedUlid("order")` from `@litmus-ts/core/id`, typed as `PrefixedUlid<"order">`.
- Test domain objects directly, with no infrastructure. These tests are fast; most rules are tested here.
