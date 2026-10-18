---
name: model-domain
description: Have a short domain discovery conversation with the developer, then shape the domain model for the next tests. Use when a test or a request needs a new business concept, rule, state or term; when a name is unclear; when a use case starts making business decisions; or when you are about to write code in api/src/domain/. Produces, in plain English - the agreed words, the rules with examples, open questions, a first guess at where the rules go, and the first test. Each example becomes a test.
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

A short summary in your reply, in plain English that the developer could read to someone who knows the business. Only for the capability being built now.

```
**What we agreed**
- A *loan* is one book borrowed by one member.
- A member can *extend* a loan, or *return* the book.

**Rules, with examples**
- A loan lasts two weeks. Borrowed on 1 March, due back on 15 March.
- A member can extend a loan by one week, at most twice. Extended twice already: the third try is refused.
- An overdue loan cannot be extended. Due on 15 March, asked on 16 March: refused.

**Still to answer**
- Can a member extend a loan when someone else is waiting for the book?

**Where the rules go (a first guess)**
- All three rules are about one loan, so the loan keeps them. It only needs to know which member and which book.

**First test:** a new loan is due back in two weeks.
```

- **Every rule has at least one concrete example**, with real dates, amounts or names. Each example is a test, so the examples are the starting test list.
- **Say the rules out loud.** If a sentence sounds awkward in the business's words, the words or the model are wrong. Find an easier way to say it.
- **"Still to answer"** goes back to the developer. Do not write a test that depends on an open question. Many open questions mean the capability is not ready to build.
- **Many examples under one rule** mean the rule is too complex. Split it.
- **"Where the rules go"** is a guess, in plain words, not class names. It tells `tdd-cycle` which component to build first. The tests may prove it wrong.

It does NOT produce class diagrams, fields, tables, code, or models for later capabilities. For a domain with no real rules (CRUD), the summary is "What we agreed" only.

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
- Can you give me an example? And one where it is not allowed?

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

## Into TDD

1. Agree the summary with the developer. Use its words in the code and in the test names.
2. Use the `tdd-cycle` skill. The component is the one from "Where the rules go". The test list is the examples. Start with the first test.
3. Use "Shaping the model" while you build: in GREEN for where code goes, and in REFACTOR to check the design.
4. After each cycle, review the test list (see the workflow rule). If a test shows a new word or rule, a rule in the wrong place, or an open question, come back to this skill and update the summary.

Also come back when a use case starts to make business decisions. The model changes as you learn.

## Further reading

Short and free first:

- Cucumber, [Example Mapping](https://cucumber.io/docs/bdd/example-mapping): rules, examples and questions for one story, on cards.
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
