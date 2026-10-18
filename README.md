# not-a-factory

A Claude Code plugin (and its marketplace) that creates apps you build outside in, one test at a time. See `docs/plan.md`.

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
/not-a-factory:new-app demo
```

Needs Node.js 24.14.1 or later, pnpm, git and Docker.

## Layout

```
.claude-plugin/marketplace.json
plugins/not-a-factory/
  skills/new-app/      the /not-a-factory:new-app command
  scripts/new-app.mjs  what new-app runs
  kit/rules/           copied to <app>/.claude/rules/
  kit/skills/          copied to <app>/.claude/skills/
  kit/files/           copied to <app>/ (workspace, api, web, CI, hooks)
```

Check the manifests with `claude plugin validate .` and `claude plugin validate plugins/not-a-factory`.
