#!/usr/bin/env bash
# Checks a generated app: placeholders, third-party skills, references and rule paths.
# Run from the app's root.
set -uo pipefail
status=0
fail() { echo "$1"; status=1; }

grep -rl --exclude-dir=node_modules '{{APP_NAME}}' . && fail "Placeholders left (above)"

pnpm exec intent list | grep -q '@tanstack/router' || fail "No TanStack Router skills in intent list"
[ -f .claude/skills/shadcn/SKILL.md ] || fail "No shadcn skill"

# Our rules and skills only; the shadcn skill is third-party.
docs=".claude CLAUDE.md"
for f in $(grep -rohE --exclude-dir=shadcn '`[A-Za-z0-9_./-]+\.md`' $docs | tr -d '`' | sort -u); do
  [ "$f" = pending-tests.md ] && continue # written while Claude works
  [ -n "$(find . -name "$(basename "$f")" -not -path './node_modules/*' | head -1)" ] || fail "Missing file: $f"
done
for s in $(grep -rohE --exclude-dir=shadcn '`[a-z][a-z-]+` skill|skill `[a-z][a-z-]+`|use `[a-z][a-z-]+`' $docs | grep -oE '`[a-z-]+`' | tr -d '`' | sort -u); do
  [ -f ".claude/skills/$s/SKILL.md" ] || fail "Missing skill: $s"
done

for p in $(sed -n '/^paths:/,/^---/p' .claude/rules/*.md | sed -n 's/^  - "\(.*\)"$/\1/p' | sort -u); do
  [ -e "${p%%/\**}" ] || fail "No match for rule path: $p"
done

exit $status
