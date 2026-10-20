// Tests for the template's PreToolUse hook that blocks a commit until the
// cycle's REFACTOR and LIST lines are written. Run: node --test .github/scripts/*.test.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const hook = join(
  import.meta.dirname,
  "../../plugins/not-a-factory/template/.claude/hooks/refactor-before-commit.mjs",
);

let ids = 0;
const say = (text) => ({ type: "assistant", message: { content: [{ type: "text", text }] } });
const bash = (command, done = true) => {
  const id = `tool_${++ids}`;
  const use = { type: "assistant", message: { content: [{ type: "tool_use", id, name: "Bash", input: { command } }] } };
  const result = { type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, content: "" }] } };
  return done ? [use, result] : [use];
};

function runHook(entries, command) {
  const dir = mkdtempSync(join(tmpdir(), "hook-"));
  const transcript = join(dir, "t.jsonl");
  writeFileSync(transcript, entries.flat().map((e) => JSON.stringify(e)).join("\n"));
  const input = { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command }, transcript_path: transcript };
  const out = spawnSync("node", [hook], { input: JSON.stringify(input), encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : { permissionDecision: "none" };
}

const commit = 'git add -A && git commit -m "a claim starts out waiting"';

test("blocks a commit after GREEN with no REFACTOR or LIST line", () => {
  const decision = runHook([say("**RED:** a claim starts out waiting."), say("**GREEN:** it does.")], commit);
  assert.equal(decision.permissionDecision, "deny");
  assert.match(decision.permissionDecisionReason, /REFACTOR/);
  assert.match(decision.permissionDecisionReason, /LIST/);
});

test("allows a commit when REFACTOR and LIST follow the last GREEN", () => {
  const decision = runHook(
    [say("**GREEN:** it does."), say("**REFACTOR:** nothing to change.\n**LIST:** next: approve.")],
    commit,
  );
  assert.equal(decision.permissionDecision, "none");
});

test("only the cycle since the last commit counts", () => {
  const decision = runHook(
    [
      say("**GREEN:** one.\n**REFACTOR:** none.\n**LIST:** next."),
      bash('git commit -m "one"'),
      say("**RED:** two."),
      say("**GREEN:** two."),
    ],
    commit,
  );
  assert.equal(decision.permissionDecision, "deny");
});

test("allows a commit with no cycle in it, such as setup or a refactor on its own", () => {
  const decision = runHook([say("Setting up shadcn."), bash("pnpm dlx shadcn init")], commit);
  assert.equal(decision.permissionDecision, "none");
});

test("ignores commands that do not commit", () => {
  const decision = runHook([say("**GREEN:** it does.")], "git status");
  assert.equal(decision.permissionDecision, "none");
});
