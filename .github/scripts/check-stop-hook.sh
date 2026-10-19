#!/usr/bin/env bash
# Checks the blocking Stop hook of a generated app: a type error blocks (exit 2),
# the stop_hook_active guard exits 0, and clean code exits 0. Run from the app's root.
set -u
hook=$(jq -r '.hooks.Stop[0].hooks[0].command' .claude/settings.json)
run() { echo "{\"stop_hook_active\": $1}" | CLAUDE_PROJECT_DIR="$PWD" bash -c "$hook" >/dev/null 2>&1; echo $?; }

echo 'export const broken: number = "text";' > api/src/broken.ts
blocked=$(run false)
guarded=$(run true)
rm api/src/broken.ts
clean=$(run false)

echo "blocked=$blocked guarded=$guarded clean=$clean"
[ "$blocked" -eq 2 ] && [ "$guarded" -eq 0 ] && [ "$clean" -eq 0 ]
