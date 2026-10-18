---
name: model-domain
description: Have a short domain discovery conversation with the developer before writing domain code. Use when a test or a request needs a new business concept, rule, state or term; when a name is unclear; or when you are about to write code in api/src/domain/. Produces agreed words, rules and the next behaviour to test, not a design.
---

# Model the domain

Domain code starts with a conversation, not code. Do not guess business rules. Ask.

## What this produces

- The words: each term and what it means, in the developer's words.
- The rules: what must always be true, and what makes an action not allowed.
- **The next behaviour to test.**

It does NOT produce class diagrams, lists of all aggregates or tables, or an implementation plan.

## Questions

Ask a few at a time, and only those that matter for the next test.

**Words**
- When you say "<term>", what exactly do you mean?
- When does a <A> become a <B>?
- Are <X> and <Y> the same thing?

**Rules**
- What must always be true about a <thing>?
- What must be true before someone can <action>?
- What would make <action> wrong or impossible? What happens then?

**Boundaries**
- What must change together, at the same time, to stay correct?
- Can a <B> exist without a <A>?

**Is a model needed?**
- Is there a real rule here, or does the app only store and show data? If it only stores and shows data, keep the domain thin.

Technique: ask the developer to walk through what a person does, step by step. Then push on each step: "can they skip this?", "what if this happens twice?", "what if it is late?". If the answer is "that is policy", ask whether the app must enforce it.

## After the conversation

1. Write the agreed words and rules in a short list in your reply. Use these names in the code.
2. Name the next behaviour to test, in one sentence.
3. Use the `tdd-cycle` skill to write that test.

Come back to this skill when a later test shows a new word or rule. The model changes as you learn.
