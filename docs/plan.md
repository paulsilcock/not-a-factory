# Plan: `not-a-factory` (scaffold + Claude Code skills)

## Why
Build apps quickly with Claude Code without becoming a "software factory". Implementation is part of discovery, so work in small batches: one acceptance test per acceptance criterion of a feature, one unit test at a time, refactor every cycle, decide the next step from what was just learned. No big upfront specs or class plans.

For personal use first; easy to make reusable later. Keep iteration 1 small: anything not needed to create a project and build features with the rules and skills is deferred.

## Iterations
1. **Local + CI.** `new-app`, the rules and skills, local Postgres, local migrations, GitHub Actions. No deploy.
2. **Reviewer agents.** `test-reviewer` and `design-reviewer`, written against the rules as tightened by iteration 1 feedback. Plugin agents, also copied into new projects. No accounts needed; test on the iteration 1 demo project.
3. **Railway + Neon.** Deploy, logging and traces, PR environments, a Neon branch per PR environment (deleted with it), migrate on deploy with a backup first. The README lists the one-off account setup so the developer can test deploys on their own accounts.
4. **Everything else.** Migration safety checks (with `migration-reviewer`), `adopt`, `add-*` skills and the rest of the deferred list.
5. **Auth** (optional, final).

## Shape
One new repo, `paulsilcock/not-a-factory`, which is a Claude Code plugin plus the marketplace that lists it:

```
.claude-plugin/marketplace.json
plugins/not-a-factory/
  .claude-plugin/plugin.json
  skills/new-app/        # entry command: creates a project (plugin only)
  skills/<others>/       # TDD skills: usable from the plugin anywhere, and copied into new projects
  skills/adopt/          # entry command: copies generic skills into an existing repo (iteration 4)
  template/              # the whole new project: workspace, api, web, CI, CLAUDE.md, .claude/rules, settings
```

- Install once per machine: `/plugin marketplace add paulsilcock/not-a-factory`, `/plugin install not-a-factory@not-a-factory` (user scope; stored in local Claude Code config, not the claude.ai account). Develop with `claude --plugin-dir ./plugins/not-a-factory`; check with `claude plugin validate`.
- The TDD skills are plugin skills (`/not-a-factory:new-feature` etc.), so they work in any repo once the plugin is installed. New projects also get their own copies in `.claude/skills/` (local, unprefixed, committed), because plugin skills are namespaced `/not-a-factory:x` and bare names are unreliable (docs; Claude Code issues #22063, #50486). Plugins also cannot carry rules or CLAUDE.md, so the project gets those too.

## new-app: what a fresh project contains
`new-app` copies `template/`, then runs `pnpm install`, `pnpm db:generate` (drizzle-kit writes its migration journal), installs the shadcn skill, and makes the first commit. No script.

- **Template, not bootstrappers (decided 18 Oct).** The template was first made with the bootstrappers (TanStack CLI `--router-only`, `create-hono --template nodejs`), then committed. Running them at create time broke in several ways (`--router-only` ignores `--add-ons`; shadcn init prompts; Intent needs an allowlist; Hono's `@hono/node-server` 2.x clashes with Litmus).
- **Staying current without a bot:** the template has caret version ranges and no lockfile, so each new project gets the latest minor and patch versions. Major versions are raised by hand. Upstream template changes (TanStack, Hono) do not arrive by themselves.
- **Web:** TanStack Router (no Start), TanStack Query, shadcn/ui, TanStack Intent mappings in `AGENTS.md`; the shadcn skill is installed at create time.
- **API:** Hono, Litmus `@litmus-ts/{core,http,db,log,test}`, `@hono/node-ws`, Drizzle, pg, tsyringe.
- **Glue:** pnpm workspace; Hono RPC type shared with web; API serves the built web app (one service); docker-compose Postgres for local; plain Vite + Vitest (not Vite+).
- **App shell only:** one page and a liveness `/health` (process up, no dependency checks; minimal response), no feature code and no acceptance test. The first acceptance test comes from the first real feature via `new-feature`. Litmus's test package (DSL, HTTP/CLI/browser drivers) is installed and wired so that first test is quick to write.
- **CI (GitHub Actions):** install, typecheck, lint, unit tests, acceptance tests against the app's Docker image with Postgres (Docker Compose), on every push and PR.
- **Migrations (iteration 1):** `pnpm db:generate` and `pnpm db:migrate` (drizzle-kit) against the docker-compose Postgres locally, and against the acceptance-test stack in CI.

## Iteration 2: reviewer agents
- `test-reviewer`: reviews tests against `writing-tests.md` and the `test-quality` properties (rates each property; no single score).
- `design-reviewer`: reviews code against `architecture.md` and the layer rules (dependency direction, thin entrypoints, rules in the domain).
- Both report findings and ask before changing code. Exact scope comes from iteration 1 feedback.

## Iteration 3: Railway + Neon
- Railway: prefer Railway's native GitHub integration with PR environments (a temporary environment per PR, removed on merge) and "wait for CI" so Railway deploys only after Actions pass (prior knowledge, medium confidence; verify in current Railway docs). Fallback: deploy from Actions with the Railway CLI (`railway up`); token guidance is inconsistent (project vs account token; a reported auth regression in CLI v5.3.0), so test before relying on it.
- Deploy the same `Dockerfile` that local Docker Compose and CI already use (Railway Dockerfile builds: prior knowledge, verify).
- Run the acceptance tests against each PR environment: they already take its address from `ACCEPTANCE_URL`. Open question: how stubs for external services work in a deployed environment.
- Railway's deploy healthcheck uses `/health` (`healthcheckPath` in railway.json). A DB readiness check is optional and separate; do not fail liveness on a dependency.
- Neon for Postgres (not Railway Postgres): a Neon branch per Railway PR environment, created with it and deleted when the PR environment is removed. How Railway PR environments hook into Neon is not verified; check the current Railway and Neon docs first.
- Migrate on deploy (`drizzle-kit migrate`); on merge to main, back up first (Neon branch or restore point).
- **Logging, traces and metrics.** Verified in Litmus rc.3: `@litmus-ts/log` wraps pino; core, http (`@hono/otel`) and test depend on the OpenTelemetry API and trace SDK; no package ships an exporter. To do: an observability rule (use the Litmus logger, never `console.log`, which the template's `main.ts` still uses; structured fields; no personal data); set up the OpenTelemetry SDK and an exporter in `main.ts` from environment variables; check what Litmus records automatically (probably HTTP spans; not verified).
- `railway.json` in the repo; README lists the one-off setup for both accounts (Railway project, Neon project and API key, connect the GitHub repo, enable PR environments).
- **Claude files:** short `CLAUDE.md` (philosophy, commands, layout), `.claude/rules/` (workflow, testing, domain, architecture; path-scoped with `paths:` where useful), `.claude/skills/` (below), `.claude/settings.json` with the Stop hook (see below) and the `typescript-lsp` plugin enabled.
- **Layout (api):** follow Litmus conventions (domain, use cases, adapters/entrypoints, composition root). Point docs at Litmus's bookshop (`packages/test-acceptance`) as the worked outside-in example.

## Step 0 (prerequisite): publish Litmus as a release candidate
Status 18 Oct: `0.1.0-rc.3` published under `@litmus-ts/*`; `@litmus-ts/test` and `@litmus-ts/db` now peer on `vitest`, not `vite-plus`. All packages need Node >= 24.14.1.

Work in the Litmus repo before the kit. Release as RC (e.g. `0.1.0-rc.0`); only what publishing needs from Litmus #79:
- Needed: exports switched to built `dist` with every sub-path entry built (the known blocker); package metadata (description, repository, license); npm scope decision (a `litmus` org may already exist on npm; fallback `@paulsilcock/*`); a publish workflow on tag with an npm token; versioning.
- Versioning: something must set one version across all seven packages at publish time. Option: Changesets in pre-release mode (`rc` tag) to bump versions, then `bun publish` per package (Bun replaces `workspace:` and `catalog:` with real versions on publish, per Bun 1.2.14 release notes). Changesets + Bun pre-mode interplay not verified; a small script that sets the version from the git tag is the fallback.
- Nice to have, if quick: short READMEs per package (Litmus #64) and good JSDoc on public APIs, so agents in consuming projects can read them.
- Not needed for RC: #11 (create-litmus-app; this kit replaces it for now), eval/AI issues (#84, #131-#135, #132, #93).
- Consumers need `reflect-metadata` and `experimentalDecorators`; Litmus uses explicit `@inject(TOKEN)` (verify under plain Vite/Vitest). `@litmus/test` already has HTTP, CLI and browser (Playwright) drivers.

## Guidance: slim always-on, detail on demand
Principles:
- Context is a cost. `CLAUDE.md` stays short (what the app is, commands, layout, pointers). Anything critical and global goes in rules. Detail lives in skills, loaded when needed.
- Not everything can be enforced. Rules name the skill to use at each point ("before writing domain code, use `model-domain`"), skill descriptions are written so Claude picks them up unprompted, and the developer can call them directly. Hooks report; they do not make Claude act (see Stop hook).
- Distil, don't clone. create-agent-app is the model for the shape and most of the ideas, but it is bloated and partly out of date. Litmus `tdd-workflow.md` (68 lines) has the best TDD wording; its acceptance-test section is thin (treats ATDD as optional "for features where multiple classes must collaborate"; Litmus #118 says the trigger should be a user-facing capability), so the outer ATDD loop needs writing properly.

**Always-on rules (`.claude/rules/`, no `paths:`), each short:**
- `tdd-workflow.md`: outside-in. Every feature's acceptance criteria each get one failing acceptance test (business language, via DSL and driver); inside it, one unit test at a time; RED for the right reason; GREEN by fixing the one thing stopping the test; REFACTOR every cycle; no upfront implementation plans or batch work; a mode agreed at the start (step by default, cycle, component or criterion: it decides only where the agent stops); the test list is a working list, reviewed after every cycle. Names the skills: `new-feature`, `acceptance-test`, `tdd-cycle`, `model-domain`.
- `writing-tests.md`: the few non-negotiables (fakes over mocks, only mock what you own, behaviour-named tests, no test-only behaviour in the app, no `expect` in acceptance test cases).
- `architecture.md`: the layout and dependency direction (Litmus-inspired) in a few lines, plus "use `add-*` skills / layer rules for detail".

**Path-scoped rules (`paths:`), short, one per layer:** domain, use cases, entrypoints, infra/repositories, acceptance tests, web client. Only the rules that matter when touching those files.

**Third-party skills installed by `new-app` (iteration 1):** shadcn skill (`pnpm dlx skills add shadcn/ui`; optionally the shadcn MCP server) and TanStack Intent mappings (`--intent`, which maps the skills TanStack ships inside its npm packages into AGENTS.md); check that Router and Query actually ship skills.

**Code navigation and docs (in always-on rules):** use the TypeScript language server (Claude Code's `typescript-lsp@claude-plugins-official` plugin, already used in Litmus) for definitions, references, types and JSDoc before falling back to grep. For Litmus APIs, read the JSDoc via the language server and the package READMEs in `node_modules/@litmus-ts/*` (or the Litmus skills once Litmus ships them) rather than guessing. `new-app` enables the plugin in `.claude/settings.json`.

**Skills (procedures and depth):** `new-feature` (outer loop: agree the feature and its acceptance criteria, one at a time), `acceptance-test` (Farley's four layers: test case, DSL, protocol driver, system under test), `tdd-cycle` (one component test-first: names the component, its consumer and its test), `model-domain` (discovery conversation; also triggered from the TDD loop when a test needs a new domain concept), `test-quality` (Farley's eight properties, each rated on its own with no single score; plus the acceptance-test layering checks). Iteration 4 candidates from create-agent-app and Litmus #85: `add-use-case`, `add-aggregate`, `add-adapter`/`add-repository`, `add-route`, schema migration.

**Sources:** create-agent-app `.claude/rules/*` and nested CLAUDE.md files (convert frontmatter to `paths:`, replace Bun/tsyringe specifics with Litmus, rewrite the client guidance for TanStack Router + shadcn, fix the known contradictions, cut duplication); Litmus `tdd-workflow.md` + `code-quality.md`; ideas from Kent Beck "Augmented Coding", citypaul/.dotfiles, Böckeler on spec-driven development.

**Stop hooks: two, run side by side** (an event can have several hooks; they run in parallel and any one can block).
1. Typecheck + lint: blocks. Run the linter's auto-fix first (`biome check --write`) so only real errors remain; if typecheck or lint still fails, exit 2 with the errors so Claude fixes them before stopping. These are mechanical fixes, not design decisions, and the rules keep code compiling in RED (stubs throw). Check `stop_hook_active` and exit 0 when true, so it cannot loop.
2. Related tests: never blocks. Skip if no source files changed; run only tests related to changed files (`vitest related <files>` or `vitest --changed`); always exit 0 and show a short summary to the developer as JSON `systemMessage` (shown to the user, not to Claude, per the hooks docs; confirm Stop keeps `systemMessage`). A failing test may be the expected RED, so the developer decides what happens next. Command exposed as a script (e.g. `pnpm test:changed`).

## Migration safety checks (Drizzle, Neon) — iteration 4
Iteration 1: local and CI migrations only. Iteration 3: per-PR Neon branch and migrate on deploy (above).
- Migrations run in CI, never by hand. On merge to main: back up (Neon branch or restore point), then `drizzle-kit migrate` against production.
- Per PR, on top of the iteration 3 branch (Neon's documented pattern, verified 17 Oct): create a Neon branch from main with `neondatabase/create-branch-action` (copy-on-write, so it holds production-like schema and data), run `drizzle-kit migrate` on it, post `neondatabase/schema-diff-action` output as a PR comment, delete the branch on close. The same branch can back the Railway PR environment. The branch run doubles as a rehearsal: it shows how long the migration takes on real data volumes.
- Checks (drizzle-kit generates plain SQL migration files, so SQL linting works): fail CI if `drizzle-kit generate` would produce a new migration (schema changed without one); `drizzle-kit check` for migration history consistency; Squawk (Postgres migration linter, GitHub Action available) on the generated SQL for lock-heavy or unsafe operations.
- `migration-reviewer` agent (reads the schema and migration diff plus Squawk and rehearsal output): flags destructive changes (drops, renames, type narrowing, NOT NULL without default) and slow ones (table rewrites, constraints without NOT VALID, non-concurrent indexes on big tables), and proposes an expand/contract split into smaller migrations. Its instructions carry the practice: expand (add alongside), migrate (dual write, batched backfill, switch reads), contract (drop later, separate release); every step backward compatible so old and new app versions run together; `CREATE INDEX CONCURRENTLY`; constraints as `NOT VALID` then validate; short `lock_timeout`; avoid full-table rewrites; pgroll (Xata; Neon guide) as an option for automating expand/contract, not a default. Run locally as a subagent and in CI (e.g. Claude Code GitHub Action) as a PR comment.
- No branch swap: promoting a migrated branch would lose writes made to main meanwhile; Neon's reset-from-parent overwrites the child and does not apply to the root branch. Expand/contract on main gives the same protection without drift.

## Deferred (iteration 4+)
- Nice to have, after all iterations: evals (they cost money) kept out of the Stop hook; a separate, explicit command developers run, with which suites run where configurable.
`adopt` and `orient` (existing repos; start from Claude Code's `/init` and community onboarding skills), `characterise` (Feathers; citypaul has characterisation-tests and finding-seams), `add-adapter`, `/sync` to refresh copied skills, standalone `npx` entry, options for others.

## Auth (final, optional iteration)
Clerk (good developer experience). Deferred because nothing in iterations 1-2 needs it. When added: Hono middleware on the API, Clerk components in the web app, and a signed-in path for the browser driver in acceptance tests (check Clerk's testing support for Playwright).

## Iteration 1 test
Create a fresh project with `new-app`, then build two or three small features using only the rules and skills. Note where the agent strays from the rules or layout, and tighten the rule text.

## Done for iteration 1
- Plugin installs from GitHub; `/not-a-factory:new-app demo` creates a project where `pnpm dev`, `pnpm test`, `pnpm db:migrate` and CI all work.
- Building one small feature outside in with the skills feels faster than without, and the agent keeps to one test at a time.
