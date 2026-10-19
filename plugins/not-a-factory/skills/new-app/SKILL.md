---
name: new-app
description: Create a new app with not-a-factory - a pnpm workspace with a TanStack Router + shadcn/ui web app, a Hono + Litmus + Drizzle API, local Postgres, GitHub Actions CI, and the outside-in TDD rules, skills and hooks for Claude Code.
argument-hint: <app-name>
disable-model-invocation: true
---

# New app

Create the app named in the arguments: `$ARGUMENTS`.

The app is a copy of the plugin's `template/` folder, with the TDD skills.

1. If no name was given, ask for one (lower case, letters, digits and `-`). Create it in the current directory unless the developer says otherwise.
2. Run `new-app.sh`, which is in this skill's base directory. `${CLAUDE_PLUGIN_ROOT}` is the plugin's folder; if it is empty, use the path of this skill's base directory instead.

   ```sh
   bash "${CLAUDE_PLUGIN_ROOT}/skills/new-app/new-app.sh" <name>
   ```

   It copies the template and the skills, puts the name in, installs the dependencies and the browser for the acceptance tests, creates the migration journal, installs the shadcn skill, and makes the first commit. If it fails, stop and show the error. Do not work around a failure by hand.
   - `pnpm install` fails if Node is older than 24.14.1.
   - The first commit needs git's `user.name` and `user.email`.
   - On Linux, if the browser later fails to start, run `pnpm --filter acceptance-tests exec playwright install --with-deps chromium`.
3. Tell the developer the next steps:

   ```sh
   cd <name>
   pnpm db:up        # needs Docker
   pnpm db:migrate
   pnpm dev          # web http://localhost:3000, API http://localhost:3001
   ```

   Then open Claude Code in `<name>/` to load its rules and skills.
