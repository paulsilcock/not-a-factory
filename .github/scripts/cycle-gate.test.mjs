// Tests for the template's PreToolUse hook that blocks a commit of a unit test
// until the cycle has a complete entry in tdd-log.md.
// Run: node --test .github/scripts/*.test.mjs
import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const hook = join(
  import.meta.dirname,
  "../../plugins/not-a-factory/template/.claude/hooks/cycle-gate.mjs",
);

const entry = (heading, lines) => `## ${heading}\n${lines.join("\n")}\n`;
const complete = (heading = "a new loan is due in two weeks") =>
  entry(heading, [
    "RED: fails, no due date.",
    "GREEN: a loan sets its due date.",
    "REFACTOR: nothing to change; knip clean.",
    "LIST: removed the due-date test. Learnt: nothing new. Next: extending a loan, because it matters most.",
  ]);

// A git project with one commit, and a new unit test in the working tree.
function project({ unitTest = true, log } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-"));
  const git = (args) => execSync(`git -c user.name=t -c user.email=t@t ${args}`, { cwd: dir, stdio: "pipe" });
  writeFileSync(join(dir, "README.md"), "app\n");
  git("init -q");
  git("add -A");
  git("commit -q -m start");
  mkdirSync(join(dir, "api"));
  writeFileSync(join(dir, unitTest ? "api/loan.test.ts" : "api/shell.tsx"), "export {}\n");
  if (log !== undefined) writeFileSync(join(dir, "tdd-log.md"), log);
  return { dir, git };
}

function gate(dir, command = 'git add -A && git commit -m "a new loan is due in two weeks"') {
  const input = { tool_name: "Bash", tool_input: { command }, cwd: dir };
  const out = spawnSync("node", [hook], { input: JSON.stringify(input), encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : { permissionDecision: "allow" };
}

test("allows the commit when the newest log entry has every step", () => {
  assert.equal(gate(project({ log: complete() }).dir).permissionDecision, "allow");
});

test("blocks the commit when there is no log", () => {
  const decision = gate(project().dir);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /tdd-log\.md/);
});

test("blocks the commit when the newest entry misses steps", () => {
  const decision = gate(project({ log: entry("a loan", ["RED: fails.", "GREEN: done."]) }).dir);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /REFACTOR/);
  assert.match(decision.permissionDecisionReason, /LIST/);
});

test("blocks the commit when the LIST line does not say what was learnt and what is next", () => {
  const log = entry("a loan", ["RED: fails.", "GREEN: done.", "REFACTOR: nothing.", "LIST: removed the test."]);
  const decision = gate(project({ log }).dir);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /Learnt/);
  assert.match(decision.permissionDecisionReason, /Next/);
});

test("blocks the reuse of an entry from an earlier commit", () => {
  const { dir, git } = project({ log: complete() });
  assert.equal(gate(dir).permissionDecision, "allow");
  git("add -A");
  git('commit -q -m "a new loan is due in two weeks"');
  writeFileSync(join(dir, "api/extend.test.ts"), "export {}\n");
  const decision = gate(dir);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /new entry/);
});

test("allows a new entry after an earlier commit", () => {
  const { dir, git } = project({ log: complete() });
  gate(dir);
  git("add -A");
  git('commit -q -m "a new loan is due in two weeks"');
  writeFileSync(join(dir, "api/extend.test.ts"), "export {}\n");
  writeFileSync(join(dir, "tdd-log.md"), complete() + complete("a loan can be extended"));
  assert.equal(gate(dir).permissionDecision, "allow");
});

test("allows a retry when an allowed commit did not happen", () => {
  const { dir } = project({ log: complete() });
  assert.equal(gate(dir).permissionDecision, "allow");
  assert.equal(gate(dir).permissionDecision, "allow");
});

test("allows a commit with no unit test in it, such as setup or an acceptance test", () => {
  assert.equal(gate(project({ unitTest: false }).dir).permissionDecision, "allow");
});

test("ignores commands that do not commit", () => {
  assert.equal(gate(project().dir, "git status").permissionDecision, "allow");
});
