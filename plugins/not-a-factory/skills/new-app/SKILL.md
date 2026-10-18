---
name: new-app
description: Create a new app with not-a-factory - a pnpm workspace with a TanStack Router + shadcn/ui web app, a Hono + Litmus + Drizzle API, local Postgres, GitHub Actions CI, and the outside-in TDD rules, skills and hooks for Claude Code.
argument-hint: <app-name>
disable-model-invocation: true
---

# New app

Create the app named in the arguments: `$ARGUMENTS`.

The app is a copy of the plugin's `template/` folder. `PLUGIN` below is `${CLAUDE_PLUGIN_ROOT}`. If that is empty, it is two directories above this skill's base directory.

1. If no name was given, ask for one (lower case, letters, digits and `-`). The directory `<name>` must not exist. Create it in the current directory unless the developer says otherwise.
2. Run these commands. Stop and show the error if one fails. Do not work around a failure by hand.

   ```sh
   cp -R "PLUGIN/template" <name>
   mkdir -p <name>/.claude/skills
   cp -R "PLUGIN/skills/new-capability" "PLUGIN/skills/tdd-cycle" "PLUGIN/skills/model-domain" "PLUGIN/skills/test-quality" <name>/.claude/skills/
   cd <name>
   grep -rl '{{APP_NAME}}' . | xargs sed -i.bak 's/{{APP_NAME}}/<name>/g'
   find . -name '*.bak' -delete
   cp .env.example .env
   pnpm install
   pnpm db:generate
   pnpm dlx skills add shadcn/ui --skill shadcn --agent claude-code --yes
   git init -q -b main && git add -A && git commit -q -m "Create <name> with not-a-factory"
   ```

   `pnpm install` fails if Node is older than 24.14.1 (`engine-strict`). `pnpm db:generate` lets drizzle-kit create its migration journal.
3. Tell the developer the next steps:

   ```sh
   cd <name>
   pnpm db:up        # needs Docker
   pnpm db:migrate
   pnpm dev          # web http://localhost:3000, API http://localhost:3001
   ```

   Then open Claude Code in `<name>/` to load its rules and skills.
