# `not-a-factory`

A Claude Code plugin that creates a full-stack TypeScript app, and gives Claude rules and skills for building it outside in, one test at a time.

**What a new app gets:**
- **A working app:** a web app with TanStack Router, TanStack Query and shadcn/ui; an API with Hono, Litmus and Drizzle; Postgres in Docker; and GitHub Actions CI.
- **Rules for Claude:** a TDD workflow, how to write tests, the architecture, and a rule for each layer.
- **Skills for Claude:**
  - `new-feature`: agree a feature's story and acceptance criteria;
  - `acceptance-test`, `acceptance-dsl`, `acceptance-driver`: acceptance tests in Dave Farley's style;
  - `tdd-cycle`: build one component test-first;
  - `model-domain`: talk through new business words and rules;
  - `test-quality`: review tests.
- **Hooks:** typecheck and lint must pass before Claude stops.

The skills also work in other repositories when the plugin is installed.

## This is not a software factory

More and more people try to automate all of software development. This is a mistake:
- **Building is part of discovery.** Writing the code shows what the problem really is. Hand that work to a machine without looking, and that learning is lost.
- **Most software does not need many agents that work in parallel.** They make more busy work and more context switching, not more value.
- **Speed of output is not speed of learning.** Many features released quickly give users too much change at once, and nobody can see which change helped. Learning gets slower, not faster.
- **Fast output costs quality.** In the last 30 releases of Claude Code (2.1.271 to 2.1.303), 1,202 of the 2,428 [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) entries are fixes (counted on 19 October 2026).

`not-a-factory` does the opposite. It helps developers and Claude use good engineering practices: tight feedback loops, small batches, and one test at a time. The aim is to build the right thing, quickly and safely.

## Install

```
/plugin marketplace add paulsilcock/not-a-factory
/plugin install not-a-factory@not-a-factory
```

Or, from a clone, without installing:

```sh
claude --plugin-dir ./plugins/not-a-factory
```

## Use

```
/not-a-factory:new-app my-app
```

Needs Node.js 24.14.1 or later, pnpm, git and Docker. Then open Claude Code in `my-app` and describe a feature: the `new-feature` skill takes it from there.

## Layout

```
.claude-plugin/marketplace.json
plugins/not-a-factory/
  skills/new-app/   the /not-a-factory:new-app command (copies the template)
  skills/<others>/  TDD skills: plugin skills, also copied into new projects
  template/         the new project, with {{APP_NAME}} placeholders
docs/plan.md        the plan and the decisions behind it
```

The template has caret version ranges and no lockfile, so each new project gets the latest minor and patch versions. Raise major versions by hand, then create a project and run its checks.

Check the manifests with `claude plugin validate .` and `claude plugin validate plugins/not-a-factory`.
