// Tests for the adopt skill's script, which adds the not-a-factory rules to an
// existing project. Run: node --test .github/scripts/*.test.mjs
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

test("adds the workflow rules to a project without them", () => {
  const dir = project();
  adopt(dir);
  assert.ok(existsSync(join(dir, ".claude/rules/tdd-workflow.md")));
  assert.ok(existsSync(join(dir, ".claude/rules/writing-tests.md")));
});

test("keeps the project's own files", () => {
  const dir = project({ ".claude/rules/writing-tests.md": "our own rules" });
  const output = adopt(dir);
  assert.equal(readFileSync(join(dir, ".claude/rules/writing-tests.md"), "utf8"), "our own rules");
  assert.match(output, /writing-tests\.md.*already exists/);
});
