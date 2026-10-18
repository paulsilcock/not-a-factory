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
  skills/new-app/   the /not-a-factory:new-app command (copies the template)
  skills/<others>/  TDD skills: plugin skills, also copied into new projects
  template/         the new project, with {{APP_NAME}} placeholders
```

The template has caret version ranges and no lockfile, so each new project gets the latest minor and patch versions. Raise major versions by hand, then create a project and run its checks.

Check the manifests with `claude plugin validate .` and `claude plugin validate plugins/not-a-factory`.
