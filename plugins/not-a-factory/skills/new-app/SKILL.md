---
name: new-app
description: Create a new app with not-a-factory - a pnpm workspace with a TanStack Router + shadcn/ui web app, a Hono + Litmus + Drizzle API, local Postgres, GitHub Actions CI, and the outside-in TDD rules, skills and hooks for Claude Code.
argument-hint: <app-name>
disable-model-invocation: true
---

# New app

Create the app named in the arguments: `$ARGUMENTS`.

1. If no name was given, ask for one (lower case, letters, digits and `-`).
2. Ask where to create it if the current directory is not a sensible parent (for example, if it is inside another git repository). Default: the current directory.
3. Run the script. It is in the plugin, two directories above this skill's base directory:

   ```sh
   node "${CLAUDE_PLUGIN_ROOT}/scripts/new-app.mjs" <name> --dir <parent>
   ```

   If `${CLAUDE_PLUGIN_ROOT}` is empty, use `<this skill's base directory>/../../scripts/new-app.mjs`.

   The script takes a few minutes. It needs Node 24.14.1 or later, pnpm, git and network access. Docker is needed later for the local Postgres.
4. If the script fails, show the error and stop. Do not try to finish the setup by hand.
5. When it succeeds, tell the developer the next steps the script printed, and that they should open Claude Code in the new directory to get its rules and skills.
