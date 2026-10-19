# `not-a-factory`

A Claude Code plugin for building the right thing, with Claude as a partner and not a factory. It sets up a full-stack TypeScript app with the rules and skills for tight feedback loops and small batches.

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
- **Fast output costs quality.** Tools that release almost every day show it: in one week of October 2026, more than half of the [changelog entries](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) of a widely used AI coding tool were fixes.

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
