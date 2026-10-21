// Tests for the template's PreToolUse hook that blocks a commit of a unit test
// until the cycle is complete. Run: node --test .github/scripts/*.test.mjs
import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const hook = join(
  import.meta.dirname,
  "../../plugins/not-a-factory/template/.claude/hooks/cycle-gate.mjs",
);

let ids = 0;
const say = (text) => ({ type: "assistant", message: { content: [{ type: "text", text }] } });
const bash = (command, { failed = false } = {}) => {
  const id = `tool_${++ids}`;
  const result = { type: "tool_result", tool_use_id: id, content: failed ? "Blocked" : "" };
  if (failed) result.is_error = true;
  return [
    { type: "assistant", message: { content: [{ type: "tool_use", id, name: "Bash", input: { command } }] } },
    { type: "user", message: { content: [result] } },
  ];
};

// A project with one commit an hour ago, and a new unit test in the working tree.
function project({ unitTest = true, pendingUpdated = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-"));
  const git = (args) => execSync(`git ${args}`, { cwd: dir, stdio: "pipe" });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { knip: "knip" } }));
  writeFileSync(join(dir, "pending-tests.md"), "# Pending tests\n");
  git("init -q");
  git("add -A");
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  execSync(`git -c user.name=t -c user.email=t@t commit -q -m start --date=${hourAgo}`, {
    cwd: dir,
    env: { ...process.env, GIT_COMMITTER_DATE: hourAgo },
  });
  const old = new Date(Date.now() - 7200_000);
  utimesSync(join(dir, "pending-tests.md"), old, old);
  if (pendingUpdated) writeFileSync(join(dir, "pending-tests.md"), "# Pending tests\n- next\n");
  mkdirSync(join(dir, "api"));
  if (unitTest) writeFileSync(join(dir, "api/loan.test.ts"), "it('a new loan is due in two weeks')");
  else writeFileSync(join(dir, "api/shell.tsx"), "export {}");
  return dir;
}

function gate(dir, entries, command = 'git add -A && git commit -m "a new loan is due in two weeks"') {
  const transcript = join(dir, "t.jsonl");
  writeFileSync(transcript, entries.flat().map((e) => JSON.stringify(e)).join("\n"));
  const input = { tool_name: "Bash", tool_input: { command }, transcript_path: transcript, cwd: dir };
  const out = spawnSync("node", [hook], { input: JSON.stringify(input), encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : { permissionDecision: "allow" };
}

const fullCycle = [
  say("**RED:** a new loan is due in two weeks. Fails: no due date."),
  say("**GREEN:** a loan sets its due date."),
  bash("pnpm knip"),
  say("**REFACTOR:** nothing to change."),
  say("**LIST:** removed the due-date test. Next: extending a loan."),
];

test("allows the commit of a complete cycle", () => {
  assert.equal(gate(project(), fullCycle).permissionDecision, "allow");
});

test("blocks the commit of a unit test when the REFACTOR and LIST lines are missing", () => {
  const decision = gate(project(), fullCycle.slice(0, 3));
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /REFACTOR/);
  assert.match(decision.permissionDecisionReason, /LIST/);
});

test("blocks the commit when the GREEN line is missing", () => {
  const decision = gate(project(), [fullCycle[0], ...fullCycle.slice(2)]);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /GREEN/);
});

test("blocks the commit when knip did not run after GREEN", () => {
  const decision = gate(project(), [fullCycle[0], bash("pnpm knip"), fullCycle[1], ...fullCycle.slice(3)]);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /knip/);
});

test("blocks the commit when the pending tests did not change since the last commit", () => {
  const decision = gate(project({ pendingUpdated: false }), fullCycle);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /pending-tests\.md/);
});

test("only the conversation since the last commit counts", () => {
  const decision = gate(project(), [...fullCycle, ...bash('git commit -m "one"'), say("**RED:** two.")]);
  assert.equal(decision.permissionDecision, "deny");
});

test("allows a commit with no unit test in it, such as setup or an acceptance test", () => {
  assert.equal(gate(project({ unitTest: false }), [say("Setting up the shell.")]).permissionDecision, "allow");
});

test("ignores commands that do not commit", () => {
  assert.equal(gate(project(), [], "git status").permissionDecision, "allow");
});

test("a blocked or failed commit does not start a new cycle", () => {
  const decision = gate(project(), [...fullCycle, ...bash('git commit -m "x"', { failed: true })]);
  assert.equal(decision.permissionDecision, "allow");
});
