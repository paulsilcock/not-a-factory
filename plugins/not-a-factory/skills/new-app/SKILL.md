---
name: new-app
description: Create a new app with not-a-factory - a pnpm workspace with a TanStack Router + shadcn/ui web app, a Hono + Litmus + Drizzle API, local Postgres, GitHub Actions CI, and the outside-in TDD rules, skills and hooks for Claude Code. Optionally with an app shell (a floating sidebar that collapses to icons) and sign-in (Clerk), tested from the start.
argument-hint: <app-name>
disable-model-invocation: true
allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/new-app.sh *)
---

# New app

Create the app named in the arguments: `$ARGUMENTS`.

The app is a copy of the plugin's `template/` folder, with the TDD skills.

1. If no name was given, ask for one (lower case, letters, digits and `-`). Create it in the current directory unless the developer says otherwise.
2. Ask two questions together (the `AskUserQuestion` tool):
   - **"Start with an app shell?"** Options: "Yes: a floating sidebar that collapses to icons (Recommended)", "No: a single page, decide later". The shell uses shadcn/ui with Base UI; also ask the style if they care (Nova by default; also Vega, Maia, Lyra, Mira).
   - **"Do you want sign-in?"** Options: "Yes, with Clerk", "Not now". Clerk is the only provider for now. With sign-in, the app has `/sign-in` and `/sign-up` pages, a person who is not signed in sees only those, and the sidebar has Clerk's user button (account, sign out).
3. Run this skill's script, with `--shell` and `--auth clerk` as answered (`--preset <style>` for another style):

   ```sh
   bash ${CLAUDE_SKILL_DIR}/new-app.sh <name> [--shell [--preset <style>]] [--auth clerk]
   ```

   It copies the template and the skills, puts the name in, installs the dependencies and the browser for the acceptance tests, creates the migration journal, installs the shadcn skill, sets up the shell, and makes the first commit. With `--auth clerk`, it then runs the `add-clerk` script, and commits "Add sign-in with Clerk". If it fails, stop and show the error. Do not work around a failure by hand.
   - `pnpm install` fails if Node is older than 24.14.1.
   - The first commit needs git's `user.name` and `user.email`.
   - On Linux, if the browser later fails to start, run `pnpm --filter acceptance-tests exec playwright install --with-deps chromium`.
4. **With sign-in:** follow the `add-clerk` skill from section 3 ("Keys and Clerk instance settings"): the developer puts the keys of a Clerk development instance in `.env`, and sets the instance as that section says. Then `pnpm test:acceptance` runs the five sign-in tests. Until the keys are in `.env`, the API does not start.
5. Tell the developer the next steps:

   ```sh
   cd <name>
   pnpm db:up        # needs Docker
   pnpm db:migrate
   pnpm dev          # web http://localhost:3000, API http://localhost:3001
   ```

   Then open Claude Code in `<name>/` to load its rules and skills.
