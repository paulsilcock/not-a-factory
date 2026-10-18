---
name: model-domain
description: Have a short domain discovery conversation with the developer, then shape the domain model for the next test. Use when a test or a request needs a new business concept, rule, state or term; when a name is unclear; when a use case starts making business decisions; or when you are about to write code in api/src/domain/. Produces agreed words, rules and the next behaviour to test, not a design.
---

# Model the domain

Domain code starts with a conversation, not code. Do not guess business rules. Ask.

## Aims

- **One language.** The code uses the same words as the people who know the business, with the same meanings.
- **Each rule in one place.** The model protects its own rules. Use cases and routes do not repeat or bypass them.
- **Easy to change.** Small, cohesive models with few links between them, so that what we learn next costs little to add.
- **Only as much model as the problem needs.** Plain data is fine where there are no rules.

A domain model is part of the solution, not a copy of the business. It is our current best understanding of the problem, shaped by technical limits such as transactions and storage. Expect it to change as we learn more.

## What this produces

- The words: each term and what it means, in the developer's words.
- The rules: what must always be true, and what makes an action not allowed.
- **The next behaviour to test.**

It does NOT produce class diagrams, lists of all aggregates or tables, or an implementation plan.

## Questions

Ask a few at a time, and only those that matter for the next test.

**What happens**
- Walk me through it: what happens first? Then what? (Name each step as an event in the past tense: "order placed", "book returned".)
- What starts each step, and who does it?

**Words**
- When you say "<term>", what exactly do you mean?
- When does a <A> become a <B>?
- Are <X> and <Y> the same thing? Does "<term>" mean the same thing to everyone who uses it?

**Rules**
- What must always be true about a <thing>?
- What must be true before someone can <action>?
- What would make <action> wrong or impossible? What happens then?

**Boundaries**
- What must change together, at the same time, to stay correct?
- If <A> changes now and <B> a moment later, does anything break? Would anyone notice?
- Can a <B> exist without a <A>?

**Is a model needed?**
- Is there a real rule here, or does the app only store and show data? A domain with little or no behaviour is naturally anemic. Then plain CRUD is the right design, and you can stop here: agree the words, and go straight to `tdd-cycle`.

Technique: push on each step: "can they skip this?", "what if this happens twice?", "what if it is late?". If the answer is "that is policy", ask whether the app must enforce it.

## Shaping the model

- **A model is what it does.** Group behaviours that change together and protect the same rules. Start from the behaviours and rules, not from the data or the tables.
- **Methods are business verbs.** `loan.extend()`, `order.cancel(reason)`, not `setStatus()`. The object that holds the data makes the decision ("tell, don't ask").
- **Behaviour methods are the only way to change state.** No setters and no public writable fields. Each method checks the rules before it changes anything, so a model is always valid. Read-only getters are fine for showing and saving data; a decision made from several getters belongs in the model.
- **An aggregate is the smallest group that must be consistent in one transaction.** Test: "which rule breaks if these two are saved separately?" If no rule breaks, they are separate aggregates.
- **Start with one entity and its values.** Make an aggregate bigger only when a real rule needs it.
- **Refer to other aggregates by ID**, not by holding the object.
- **One aggregate changes per command.** If another must change too, do it after, with a domain event and a handler. Ask the developer whether a short delay is acceptable; usually it is.
- **Domain events say "something happened that others care about".** Raise one (`addDomainEvent`) when another aggregate or a side effect, such as an email, must react, and a short delay is acceptable. Name it in the past tense, in business words: `OrderPlaced`, not `SendConfirmationEmail`. A rule that must hold in the same transaction does not belong in an event: keep it inside one aggregate. In Litmus, handlers run in-process after the save commits. A failing handler is logged, not retried, so a reaction that must never be lost needs more than an event, for example an outbox.
- **Value objects** for concepts with rules but no identity (money, email address, date range). They are immutable and check themselves when created.
- **Make states explicit.** If a thing moves through states, name the states and the allowed moves, and reject the others with a `DomainError`.

## Pitfalls

| Pitfall | Sign | Instead |
|---|---|---|
| Anemic model (where there are rules) | Classes with fields and getters; the use case reads them and decides | Move the decision into the model as a method. With no rules, anemic is fine |
| Data first | Starting from tables, columns or an ER diagram | Start from what happens and the rules |
| Big aggregate | "A customer has orders, which have lines, which have shipments" | Separate aggregates, linked by ID |
| Rich model for CRUD | Classes and methods that only copy data | Keep it thin; add a model when a rule appears |
| Guessed words | Terms the developer never used, or one word with two meanings | Ask. Two meanings usually mean two concepts |
| Design up front | Listing all the aggregates or classes before the first test | Model only what the next test needs; refactor as you learn |
| Vague names | `Manager`, `Processor`, `Data`, `Info`, `Helper` | Name it after what it is or does in the business |
| Primitives for concepts | Emails as strings, money as numbers, checks repeated | A value object |
| Events as commands | Event names that give orders (`SendEmail`), or events used to keep a rule consistent | Past-tense facts; keep consistency rules inside one aggregate |
| Infrastructure in the domain | Drizzle types, HTTP, `process.env` in `domain/` | Keep them in `infra/` and entrypoints |

## After the conversation

1. Write the agreed words and rules in a short list in your reply. Use these names in the code.
2. Name the next behaviour to test, in one sentence.
3. Use the `tdd-cycle` skill to write that test.

Come back to this skill when a later test shows a new word or rule, or when a use case starts to make business decisions. The model changes as you learn.

## Further reading

Short and free first:

- Martin Fowler, [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html): why behaviour belongs with the data.
- Martin Fowler, [DDD Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html), [Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html), [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html): one page each.
- Martin Fowler, [Tell Don't Ask](https://martinfowler.com/bliki/TellDontAsk.html): put data and behaviour together, without dropping every query.
- Allen Holub, [Why getter and setter methods are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html): encapsulation and behaviour-first objects.
- Vaughn Vernon, Effective Aggregate Design, [part 1](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf), [part 2](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf), [part 3](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_3.pdf): the clearest guide to aggregate size and boundaries.
- Scott Wlaschin, [Making illegal states unrepresentable](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/): explicit states with types (F#, but the idea carries over).
- Microsoft, [Domain events: design and implementation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation): when to use domain events, and how they differ from integration events.
- Eric Evans, [DDD Reference](https://www.domainlanguage.com/ddd/reference/): free summary of every DDD pattern, for looking things up.

Books, when you want more:

- Vlad Khononov, *Learning Domain-Driven Design* (O'Reilly, 2021): the easiest full introduction, including when not to build a domain model.
- Alberto Brandolini, [*Introducing EventStorming*](https://leanpub.com/introducing_eventstorming): discovering a domain from its events, with the people who know it.
