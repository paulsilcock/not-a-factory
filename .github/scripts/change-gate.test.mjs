// Tests for the template's PreToolUse hook that asks the developer before a
// new dependency or a change to infrastructure.
// Run: node --test .github/scripts/*.test.mjs
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const hook = join(
  import.meta.dirname,
  "../../plugins/not-a-factory/template/.claude/hooks/change-gate.mjs",
);

function decide(tool_name, tool_input) {
  const out = spawnSync("node", [hook], { input: JSON.stringify({ tool_name, tool_input }), encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput.permissionDecision : "allow";
}

test("asks before a package is added", () => {
  for (const command of ["pnpm add @clerk/clerk-react", "pnpm --filter web add zod", "npm i hono", "npm install -D vitest", "yarn add x", "bun add x"]) {
    assert.equal(decide("Bash", { command }), "ask", command);
  }
});

test("allows an install from the lockfile and other commands", () => {
  for (const command of ["pnpm install", "pnpm install --frozen-lockfile", "pnpm test:unit", "git commit -m 'add a claim'"]) {
    assert.equal(decide("Bash", { command }), "allow", command);
  }
});

test("asks before a change to package files, Docker, CI or env files", () => {
  for (const file_path of ["/app/web/package.json", "/app/Dockerfile", "/app/docker-compose.yml", "/app/.github/workflows/ci.yml", "/app/.env", "/app/.env.example"]) {
    assert.equal(decide("Edit", { file_path }), "ask", file_path);
  }
});

test("allows a change to app code", () => {
  assert.equal(decide("Write", { file_path: "/app/api/src/domain/claim.ts" }), "allow");
});
