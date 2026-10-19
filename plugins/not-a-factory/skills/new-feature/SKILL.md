---
name: new-feature
description: Build a new feature outside in - new behaviour that a user (or another system) can see or use through the system's public interface. Agrees the feature and its acceptance criteria with the developer, then for each criterion, one at a time, writes an acceptance test and builds what it needs test-first. Also use to continue a feature that has failing acceptance tests. Not for a new endpoint for existing behaviour, internal changes, refactors or performance work; those use tdd-cycle.
---

# New feature (outer loop)

> The commands and paths below are for a project created by not-a-factory. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

Follow `.claude/rules/workflow.md`: the mode (guided, pair or autonomous), one test at a time, the working list, and discoveries.

## 1. Find where we are

- Are there acceptance tests for this feature already, and do they fail? Run `pnpm test:acceptance` (needs Docker).
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

- The story is one or two sentences about the user's work and why it matters to them. It does not mention the program, its screens or its data.
- Each criterion is one sentence that the least technical person who knows the business would understand. Each one gets its own acceptance test.
- The list is a working list, like the test list. Start with the most important criterion that you are most confident about.
- New business words or rules: use `model-domain` first. Its examples often become criteria.

## 4. One criterion at a time

1. Write its acceptance test with the `acceptance-test` skill. Run it; it must fail because the behaviour is missing.
2. Say in one sentence why it fails, and name the missing piece and the component that should hold it (see the component table in `tdd-cycle`).
3. Build that component:
   - In guided or autonomous mode, use `tdd-cycle`.
   - In pair mode, ask whether the developer wants to build it. If they write the consumer (for example a use case) and name its parts, build each part with `tdd-cycle`, driven by what the consumer needs.
4. Run `pnpm test:acceptance` again. Repeat from step 2 until it passes.
5. Refactor, including the DSL and the drivers.
6. Review the criteria list: remove, add or reorder. Then take the next criterion.

Follow the failure, not a fixed order. It is often route → use case → domain → repository, but not always.

## 5. Done when every criterion has a passing acceptance test

- If there is a UI, check it in the browser (`pnpm dev`).
- Suggest the `test-quality` skill for the feature's tests.
