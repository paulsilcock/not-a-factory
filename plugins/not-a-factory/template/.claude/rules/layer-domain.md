---
paths:
  - "api/src/domain/**"
---

# Domain layer

- **Discovery before domain code.** If the test needs a new noun, rule or state, use the `model-domain` skill and ask the developer. Do not guess business rules.
- Use the developer's words for names. If a term is unclear, ask.
- No I/O and no framework: no database, no HTTP, no tsyringe, no `process.env`. Only Litmus core types and plain TypeScript.
- A domain with little or no behaviour is naturally anemic. Then plain CRUD is the right design; keep the domain thin.

## Shaping models

- **A model is what it does.** Group behaviours that change together and protect the same rules. Start from the behaviours and rules, not from the data.
- **Methods are business verbs:** `loan.extend()`, not `setStatus()`. The object that holds the data makes the decision.
- **Only behaviour methods change state.** No setters, no public writable fields. Each method checks the rules before it changes anything, so a model is always valid. Read-only getters are fine for showing and saving data; a decision made from several getters belongs in the model.
- **An aggregate (`AggregateRoot`) is the smallest group that must be consistent in one transaction.** Ask: "which rule breaks if these two are saved separately?" If none, they are separate aggregates. Start with one entity and its values. Refer to other aggregates by ID.
- **One aggregate changes per command.** Others react afterwards to a domain event.
- **Domain events** (`addDomainEvent`) are past-tense facts in business words: `OrderPlaced`, not `SendConfirmationEmail`. Use one when another aggregate or a side effect must react and a short delay is acceptable. Not for a rule that must hold in the same transaction. How to react to one: "Domain event subscriptions" in `layer-entrypoints.md`.
- **`ValueObject`** for values with rules but no identity (money, email address, date range). Immutable; checks itself in the constructor.
- **Explicit states.** Name the states and the allowed moves. A broken rule throws a `DomainError` subclass with a business name (`BasketIsEmpty`, not `ValidationError`). `serve` maps it to an HTTP status by class name in `main.ts`.
- IDs: `prefixedUlid("order")` from `@litmus-ts/core/id`, typed as `PrefixedUlid<"order">`.
- Test domain objects directly, with no infrastructure. Most rules are tested here.

## Pitfalls

| Pitfall | Sign | Instead |
|---|---|---|
| Anemic model where there are rules | The use case reads fields and decides | Move the decision into the model |
| Big aggregate | "A customer has orders, which have lines, which have shipments" | Separate aggregates, linked by ID |
| Vague names | `Manager`, `Processor`, `Data`, `Helper` | Name it after what it is or does in the business |
| Primitives for concepts | Emails as strings, money as numbers | A value object |
| Events as commands | `SendEmail`, or an event that keeps a rule consistent | Past-tense facts; rules inside one aggregate |
