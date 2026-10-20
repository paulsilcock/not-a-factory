# Decisions

The work is in the GitHub issues. This file keeps the decisions that the code does not explain.

- **A committed template, not bootstrappers.** Running the TanStack CLI, shadcn and `create-hono` at create time broke in several ways: `--router-only` ignores add-ons, shadcn `init` asks questions, Intent needs an allowlist, and Hono's `@hono/node-server` 2.x clashes with Litmus. The template was made with them once, then committed.
- **Caret version ranges and no lockfile in the template.** Each new app gets the latest minor and patch versions. Raise major versions by hand, then create an app and run its checks (CI does this).
- **No `version` in `plugin.json`.** Claude Code then uses the commit SHA, so each push is an update for people who installed from the marketplace.
- **Skills are plugin skills, and are also copied into each new app.** Plugin skills are namespaced (`/not-a-factory:x`) and plugins cannot carry rules or `CLAUDE.md`, so the app gets its own copies, unprefixed and committed.
- **Rules are short and always on; detail is in skills.** Context is a cost. Rules name the skill to use at each point.
- **Two Stop hooks.** Typecheck and lint block (exit 2), after the linter's auto-fix, with a guard on `stop_hook_active`. Related unit tests only report to the developer, because a failing test can be the expected RED.
- **Acceptance tests treat the app as a black box.** They run against the app's Docker image, or against `ACCEPTANCE_URL`. No in-process app, no test-only routes.
- **Sources** for the rules and skills: Dave Farley (ATDD, test properties), Kent Beck, Allen Holub (use cases and stories), Martin Fowler, Daniel Terhorst-North, domain-driven design, Kent C. Dodds and Dan Abramov (UI testing), Litmus's `tdd-workflow.md`, and create-agent-app.
