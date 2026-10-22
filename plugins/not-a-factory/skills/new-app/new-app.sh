#!/usr/bin/env bash
# Creates a not-a-factory app named $1 in the current directory.
# Usage: new-app.sh <name> [--shell [--preset <style>]] [--auth clerk]
#   --shell        shadcn/ui (Base UI) and an app shell: a floating sidebar
#                  that collapses to icons. --preset picks the style (nova).
#   --auth clerk   sign-in with Clerk (the add-clerk skill), in its own commit.
set -euo pipefail

usage="usage: new-app.sh <name> [--shell [--preset <style>]] [--auth clerk]"
name="${1:?$usage}"
shift
shell=false
preset=nova
auth=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --shell) shell=true ;;
    --preset) preset="${2:?$usage}"; shift ;;
    --auth) auth="${2:?$usage}"; shift ;;
    *) echo "$usage" >&2; exit 1 ;;
  esac
  shift
done
if [[ -n "$auth" && "$auth" != clerk ]]; then
  echo "The only sign-in provider is clerk: $auth" >&2
  exit 1
fi
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
for skill in new-feature acceptance-test acceptance-dsl acceptance-driver tdd-cycle domain-discovery test-quality; do
  cp -R "$plugin/skills/$skill" "$name/.claude/skills/"
done

if $shell; then
  cp -R "$plugin/skills/new-app/shell/." "$name/"
fi

cd "$name"
grep -rl '{{APP_NAME}}' . | xargs sed -i.bak "s/{{APP_NAME}}/$name/g"
find . -name '*.bak' -delete
cp .env.example .env

pnpm install
pnpm --filter acceptance-tests exec playwright install chromium
pnpm db:generate
pnpm dlx skills add shadcn/ui --skill shadcn --agent claude-code --yes
if $shell; then
  (cd web && pnpm dlx shadcn@latest init --template vite --base base --preset "$preset" -y)
  (cd web && pnpm dlx shadcn@latest add sidebar -y)
  pnpm --filter web generate-routes
  pnpm lint:fix
fi

git init -q -b main
git add -A
git commit -q -m "Create $name with not-a-factory"

if [[ "$auth" == clerk ]]; then
  node "$plugin/skills/add-clerk/add-clerk.mjs"
  pnpm --filter web generate-routes
  git add -A
  git commit -q -m "Add sign-in with Clerk"
fi
