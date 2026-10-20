#!/usr/bin/env bash
# Adds the not-a-factory workflow rules to the current project.
# Never overwrites a file that exists.
set -euo pipefail

template="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/template/.claude"

for file in rules/tdd-workflow.md rules/writing-tests.md; do
  if [ -e ".claude/$file" ]; then
    echo "skipped .claude/$file: it already exists"
  else
    mkdir -p "$(dirname ".claude/$file")"
    cp "$template/$file" ".claude/$file"
    echo "added .claude/$file"
  fi
done
