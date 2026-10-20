---
name: adopt
description: Add the not-a-factory way of working to an existing project - the TDD workflow rule (modes, one test at a time, step names, small batches), the writing-tests rule, and a hook that blocks a commit until the cycle's REFACTOR and LIST lines are written. Never overwrites the project's own files.
disable-model-invocation: true
allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/adopt.sh)
---

# Adopt not-a-factory in this project

1. Tell the developer what this adds to `.claude/` in the current project, and ask before you run it:
   - `rules/tdd-workflow.md`: which skill to use, the modes, one test at a time, step names, small batches.
   - `rules/writing-tests.md`: what makes a good test, and test doubles.
   - `hooks/refactor-before-commit.mjs`, and a `PreToolUse` entry for it in `settings.json`. It needs Node.js.

   It does not add the rules for the generated app's stack (architecture, layers, Litmus). They do not fit other projects.
2. Run this skill's script from the project root:

   ```sh
   bash ${CLAUDE_SKILL_DIR}/adopt.sh
   ```

   It never overwrites a file. Show the developer what it added and what it skipped. If it fails, stop and show the error.
3. Review the added rules with the developer, and change them to fit the project:
   - The commands for the unit tests, typecheck and lint. The rules say "the related unit tests, typecheck and lint".
   - Where acceptance tests live and how they run, if the project has them.
   - Examples that do not fit, such as PGlite as a fake for Postgres.

   Do not change the project's own code or tests.
4. Suggest, and do not do without agreement:
   - A rule that describes the project's own architecture and layers, if it has none.
   - A `Stop` hook that runs typecheck and lint, if the project has those commands.
   - A first commit of the changes in `.claude/`.
