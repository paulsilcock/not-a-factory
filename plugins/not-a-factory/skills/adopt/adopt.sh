#!/usr/bin/env bash
# Adds the not-a-factory workflow rules and commit hook to the current project.
# Never overwrites a file that exists. Merges the hook into .claude/settings.json.
set -euo pipefail

template="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/template/.claude"

for file in rules/tdd-workflow.md rules/writing-tests.md hooks/refactor-before-commit.mjs; do
  if [ -e ".claude/$file" ]; then
    echo "skipped .claude/$file: it already exists"
  else
    mkdir -p "$(dirname ".claude/$file")"
    cp "$template/$file" ".claude/$file"
    echo "added .claude/$file"
  fi
done

node --input-type=module - "$template/settings.json" <<'EOF'
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const path = ".claude/settings.json";
const settings = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
const ours = JSON.parse(readFileSync(process.argv[2], "utf8")).hooks.PreToolUse;
const current = settings.hooks?.PreToolUse ?? [];
const present = current.some((m) =>
  m.hooks?.some((h) => h.command?.includes("refactor-before-commit")),
);
if (present) {
  console.log(`skipped the commit hook in ${path}: it is already there`);
} else {
  settings.hooks = { ...settings.hooks, PreToolUse: [...current, ...ours] };
  writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
  console.log(`added the commit hook to ${path}`);
}
EOF
