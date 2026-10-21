---
name: domain-discovery
description: Use before building anything that adds business rules, limits, states or new business words - for example "a member can borrow at most 3 books", "refunds only within 30 days", "an account is locked after 5 failed logins". Also when a name is unclear, or a use case starts making business decisions. A short conversation with the developer that ends, in plain English, with the agreed words, the rules with examples (each becomes a test), open questions, and the first test.
---

# Domain discovery

Domain code starts with a conversation, not code. Do not guess business rules. Ask.

## Aims

- **One language:** the code uses the business's words, with the same meanings.
- **Each rule in one place,** protected by the model.
- **Easy to change:** small models with few links between them.
- **Only as much model as the problem needs.**

A domain model is part of the solution, not a copy of the business. It is our current best understanding of the problem, shaped by technical limits such as transactions. Expect it to change as we learn.

## Questions

Ask a few at a time, and only those that matter for the feature being built now.

- **What happens:** walk me through it. What happens first? Then what? Who does it?
- **Words:** when you say "<term>", what exactly do you mean? When does an <A> become a <B>? Are <X> and <Y> the same thing?
- **Rules:** what must always be true? What must be true before someone can <act>? What makes it wrong or impossible, and what happens then?
- **Examples:** can you give me an example? And one where it is not allowed?
- **Values:** for each value with rules (an amount, a date, a quantity, an email address): what is its unit, and its exact format? What precision? What is refused? For example: "Amount: pounds, as `12.30`; more than 0; exactly two decimals; anything else is refused." Each refusal is an example, so it becomes a test.
- **Together or apart:** what must change at the same time to stay correct? If <A> changes now and <B> a moment later, does anything break?
- **Is a model needed?** Is there a real rule, or does the app only store and show data? With no real rules, plain CRUD is right: agree the words and go to `tdd-cycle`.

Push on each step: "can they skip this?", "what if it happens twice?", "what if it is late?". If the answer is "that is policy", ask whether the app must enforce it.

## What this produces

A short summary in your reply, in plain English that the developer could read to someone who knows the business:

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

- Always write all five headings. If a heading has nothing in it, write "none".
- Every rule has at least one concrete example, with real dates, amounts or names. Each example is a test.
- Say the rules out loud. If a sentence sounds awkward, the words or the model are wrong.
- Do not write a test that depends on an open question.
- "Where the rules go" is a guess in plain words, not class names. The tests may prove it wrong.
- No class diagrams, fields, tables, code, or models for later features. Design up front locks in what we do not know yet.

## Into TDD

1. **Stop and agree the summary, in every mode.** Write the whole summary, with every heading, then stop and ask the developer to agree or correct it. Do not write a test, an acceptance test included, until they agree. The mode does not change this: the summary holds business decisions, and those are the developer's. Use its words in the code and in the test names.
2. Use `tdd-cycle`. The component is the one from "Where the rules go"; its pending tests are the examples, and the open questions go under **Questions**.
3. While you build, follow the `layer-domain` rule: it covers how to shape models, aggregates, domain events and value objects.
4. After each cycle, review the pending tests. If a test shows a new word or rule, a rule in the wrong place, or an open question, come back here and update the summary.

## Further reading

- Martin Fowler, [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html), [Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html), [DDD Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html), [Tell Don't Ask](https://martinfowler.com/bliki/TellDontAsk.html): one page each.
- Allen Holub, [Why getter and setter methods are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html).
- Vaughn Vernon, Effective Aggregate Design, [part 1](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf), [part 2](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf), [part 3](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_3.pdf).
- Microsoft, [Domain events: design and implementation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation).
- Eric Evans, [DDD Reference](https://www.domainlanguage.com/ddd/reference/): a free summary of the patterns.
- Vlad Khononov, *Learning Domain-Driven Design* (O'Reilly, 2021): the easiest full introduction.
- Alberto Brandolini, [*Introducing EventStorming*](https://leanpub.com/introducing_eventstorming): discovering a domain from its events.
