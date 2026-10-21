// PreToolUse hook: blocks a `git commit` that includes a unit test until the
// cycle is complete (see .claude/rules/tdd-workflow.md, section 4). Since the
// last commit, the conversation must have the RED, GREEN, REFACTOR and LIST
// lines, `pnpm knip` must have run after GREEN, and pending-tests.md must have
// changed.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";
const isCommit = (text) => /\bgit\s+(?:-\S+\s+)*commit\b/.test(text);
if (!isCommit(command)) process.exit(0);

const cwd = input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? ".";
const git = (args) =>
  execSync(`git ${args}`, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const dir = git("rev-parse --show-toplevel").trim();

// Only commits that include a unit test (not an acceptance test) are gated.
const changed = git("status --porcelain -uall")
  .split("\n")
  .map((line) => line.slice(3).trim());
const unitTest = changed.some(
  (file) => /\.test\.tsx?$/.test(file) && !file.startsWith("acceptance-tests/"),
);
if (!unitTest) process.exit(0);

function readCycle() {
  const blocks = readFileSync(input.transcript_path, "utf8")
    .split("\n")
    .flatMap((line) => {
      try {
        const content = JSON.parse(line).message?.content;
        return Array.isArray(content) ? content : [];
      } catch {
        return [];
      }
    });
  // A commit counts only when it succeeded: not one that failed or this hook blocked.
  const succeeded = new Set(
    blocks
      .filter(
        (b) =>
          b.type === "tool_result" &&
          !b.is_error &&
          !JSON.stringify(b.content ?? "").includes("The cycle is not done"),
      )
      .map((b) => b.tool_use_id),
  );
  let lastCommit = -1;
  blocks.forEach((b, i) => {
    if (
      b.type === "tool_use" &&
      succeeded.has(b.id) &&
      isCommit(b.input?.command ?? "")
    )
      lastCommit = i;
  });
  const cycle = blocks.slice(lastCommit + 1);
  return cycle;
}

let cycle = readCycle();
const lineAt = (step) =>
  cycle.findLastIndex(
    (b) => b.type === "text" && b.text.includes(`**${step}:**`),
  );
// Claude Code may write the latest message to the transcript a moment after
// this hook starts, so read it once more before reporting missing lines.
if (["RED", "GREEN", "REFACTOR", "LIST"].some((step) => lineAt(step) === -1)) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
  cycle = readCycle();
}
const missing = [];
const steps = ["RED", "GREEN", "REFACTOR", "LIST"].filter(
  (step) => lineAt(step) === -1,
);
if (steps.length)
  missing.push(
    `write the ${steps.join(", ")} line${steps.length > 1 ? "s" : ""} in a message to the developer (not only in your reasoning: the developer cannot see that)`,
  );

const packageJson = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
if (packageJson.scripts?.knip) {
  const green = lineAt("GREEN");
  const knipRan = cycle.some(
    (b, i) =>
      i > green &&
      b.type === "tool_use" &&
      /\bknip\b/.test(b.input?.command ?? ""),
  );
  if (!knipRan)
    missing.push("run `pnpm knip` after GREEN, as part of REFACTOR");
}

const pending = join(dir, "pending-tests.md");
const lastCommitTime = Number(git("log -1 --format=%ct").trim()) * 1000;
if (!existsSync(pending) || statSync(pending).mtimeMs <= lastCommitTime) {
  missing.push(
    "update pending-tests.md: remove the test you wrote, then add, remove or reorder",
  );
}

if (missing.length === 0) process.exit(0);
console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `The cycle is not done, so do not commit yet. First: ${missing.join("; ")}. See section 4 of .claude/rules/tdd-workflow.md.`,
    },
  }),
);
