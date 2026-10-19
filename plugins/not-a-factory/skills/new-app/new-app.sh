#!/usr/bin/env bash
# Creates a not-a-factory app named $1 in the current directory.
# Usage: new-app.sh <name>
set -euo pipefail

name="${1:?usage: new-app.sh <name>}"
plugin="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ ! "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "The name must use lower-case letters, digits and '-': $name" >&2
  exit 1
fi
if [[ -e "$name" ]]; then
  echo "$name already exists" >&2
  exit 1
fi

cp -R "$plugin/template" "$name"
mkdir -p "$name/.claude/skills"
for skill in new-feature acceptance-test acceptance-dsl acceptance-driver tdd-cycle model-domain test-quality; do
  cp -R "$plugin/skills/$skill" "$name/.claude/skills/"
done

cd "$name"
grep -rl '{{APP_NAME}}' . | xargs sed -i.bak "s/{{APP_NAME}}/$name/g"
find . -name '*.bak' -delete
cp .env.example .env

pnpm install
pnpm --filter acceptance-tests exec playwright install chromium
pnpm db:generate
pnpm dlx skills add shadcn/ui --skill shadcn --agent claude-code --yes

git init -q -b main
git add -A
git commit -q -m "Create $name with not-a-factory"
