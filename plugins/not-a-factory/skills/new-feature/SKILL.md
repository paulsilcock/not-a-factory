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
- The list is a working list, like the pending tests. Start with the most important criterion that you are most confident about.
- If the story or the criteria contain business rules, limits, states or new business words, load `domain-discovery` before you write the first acceptance test. Its examples often become criteria.

**Where it lives in the app.** If the feature has a UI, the developer decides where it goes and how it is reached. Ask:
- **The look, if shadcn is not set up yet** (there is no `web/components.json`): ask for the component library (Base UI by default, or Radix), the style (Nova by default; also Vega, Maia, Lyra, Mira), the base colour, and the font (for example Geist or Inter). Then run, in `web/`: `pnpm dlx shadcn@latest init --template vite --base <base> --preset <style> -y`. Change the font and colours afterwards in `web/src/styles.css` if the developer asked for others. Run typecheck and lint (`pnpm lint:fix` formats the generated files).
- **A new app with no app shell yet** (no navigation, only the starter page): what shell do they want, for example a sidebar, a top navbar, or a single page? Build it once, with shadcn blocks (use the `shadcn` skill), before the first feature's page. Every later feature fits into it.
- **Every feature:** a new route with an entry in the navigation (with what label), or part of an existing page?
- **Who builds it:** offer to let the developer build the shell or the layout themselves, with the `shadcn` skill, while you build the behaviour. In pair work, they often will.

## 4. One criterion at a time

1. Make the criterion pass with the `acceptance-test` skill.
2. **Shape the UI** (if the criterion has a UI). The acceptance test passes with just enough page; now make it fit the app. Take a screenshot of the page and show it to the developer. Propose a layout with shadcn components or blocks. The developer decides, or does it themselves. Make the agreed change, and keep the acceptance tests green: they find elements by role and label, so a new layout does not break them. This is not REFACTOR: users can see the change.
3. Run the `test-quality` skill on the tests written for this criterion. Report the results, and ask before you change any test.
4. Review the criteria list: remove, add or reorder. Then take the next criterion.

The feature is done when every criterion has a passing acceptance test.
