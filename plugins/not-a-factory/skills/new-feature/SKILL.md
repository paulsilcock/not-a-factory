---
name: new-feature
description: Build a new feature outside in - new behaviour that a user (or another system) can see or use through the system's public interface. Agrees the feature and its acceptance criteria with the developer, then for each criterion, one at a time, writes an acceptance test and builds what it needs test-first. Also use to continue a feature that has failing acceptance tests. Not for a new endpoint for existing behaviour, internal changes, refactors or performance work; those use tdd-cycle.
---

# New feature (outer loop)

> The commands and paths below are for a project created by `not-a-factory`. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

Follow `.claude/rules/tdd-workflow.md`: the mode, one test at a time, the working list, and discoveries.

## 1. Find where we are

- Are there acceptance tests for this feature already, and do they fail? Run `pnpm test:acceptance`.
- What changed? `git status` and `git diff`. The developer may have written some of it.
- If a test for this feature already fails, go to step 4.

## 2. Is it a feature?

A feature lets a user do or see something new through the public interface. If the request is only a new endpoint for something users can already do, an internal change, a refactor or performance work, say so and use `tdd-cycle` instead.

## 3. Agree the feature and its acceptance criteria

Think about it from the user's side. Ask the developer, a few questions at a time:
- Who uses it, and what do they want to get done?
- What must be true for them to say it works? What must not happen?

Write it down in plain words:

```
**Story:** Members borrow books to read at home. Each member can have three books out at a time, so that there are books on the shelves for everyone.
**Acceptance criteria**
1. A member can borrow a book that is on the shelf.
2. A member cannot borrow a book when every copy is out.
3. A member with three books out cannot borrow another.
```

- The story is one or two sentences about the user's work and why it matters to them, in the user's own words: their description of their problem. It does not mention the program, its screens or its data. Do not use "As a <role>, I want...".
- Each criterion is one sentence that the least technical person who knows the business would understand. Each one gets its own acceptance test.
- The list is a working list, like the test list. Start with the most important criterion that you are most confident about.
- If the story or the criteria contain business rules, limits, states or new business words, load `domain-discovery` before you write the first acceptance test. Its examples often become criteria.

## 4. One criterion at a time

1. Make the criterion pass with the `acceptance-test` skill.
2. Run the `test-quality` skill on the tests written for this criterion. Report the results, and ask before you change any test.
3. Review the criteria list: remove, add or reorder. Then take the next criterion.

The feature is done when every criterion has a passing acceptance test.
