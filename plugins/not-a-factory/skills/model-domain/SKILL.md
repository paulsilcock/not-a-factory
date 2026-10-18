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
- **An aggregate is the smallest group that must be consistent in one transaction.** Test: "which rule breaks if these two are saved separately?" If no rule breaks, they are separate aggregates.
- **Start with one entity and its values.** Make an aggregate bigger only when a real rule needs it.
- **Refer to other aggregates by ID**, not by holding the object.
- **One aggregate changes per command.** If another must change too, do it after, with a domain event and a handler. Ask the developer whether a short delay is acceptable; usually it is.
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
| Infrastructure in the domain | Drizzle types, HTTP, `process.env` in `domain/` | Keep them in `infra/` and entrypoints |

## After the conversation

1. Write the agreed words and rules in a short list in your reply. Use these names in the code.
2. Name the next behaviour to test, in one sentence.
3. Use the `tdd-cycle` skill to write that test.

Come back to this skill when a later test shows a new word or rule, or when a use case starts to make business decisions. The model changes as you learn.
