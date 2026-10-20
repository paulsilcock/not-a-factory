// Tests for the adopt skill's script, which adds the not-a-factory rules and
// commit hook to an existing project. Run: node --test .github/scripts/*.test.mjs
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const script = join(import.meta.dirname, "../../plugins/not-a-factory/skills/adopt/adopt.sh");

function project(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "adopt-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const adopt = (dir) => {
  const out = spawnSync("bash", [script], { cwd: dir, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout;
};
const settings = (dir) => JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
const commitHooks = (dir) =>
  (settings(dir).hooks?.PreToolUse ?? []).flatMap((m) => m.hooks).filter((h) => h.command.includes("refactor-before-commit"));

test("adds the workflow rules and the commit hook to a project without them", () => {
  const dir = project();
  adopt(dir);
  assert.ok(existsSync(join(dir, ".claude/rules/tdd-workflow.md")));
  assert.ok(existsSync(join(dir, ".claude/rules/writing-tests.md")));
  assert.ok(existsSync(join(dir, ".claude/hooks/refactor-before-commit.mjs")));
  assert.equal(commitHooks(dir).length, 1);
});

test("keeps the project's own settings and files", () => {
  const dir = project({
    ".claude/settings.json": JSON.stringify({ permissions: { allow: ["Bash(npm test)"] } }),
    ".claude/rules/writing-tests.md": "our own rules",
  });
  const output = adopt(dir);
  assert.deepEqual(settings(dir).permissions, { allow: ["Bash(npm test)"] });
  assert.equal(readFileSync(join(dir, ".claude/rules/writing-tests.md"), "utf8"), "our own rules");
  assert.match(output, /writing-tests\.md.*already exists/);
});

test("adds the commit hook only once when run again", () => {
  const dir = project();
  adopt(dir);
  adopt(dir);
  assert.equal(commitHooks(dir).length, 1);
});
