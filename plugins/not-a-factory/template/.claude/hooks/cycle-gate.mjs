// PreToolUse hook: blocks a `git commit` that includes a unit test until the
// cycle has a complete entry in tdd-log.md (see .claude/rules/tdd-workflow.md,
// section 4). The newest entry must have RED, GREEN, REFACTOR and LIST lines,
// the LIST line must say what was learnt and what is next, and the entry must
// be new since the last commit.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";
if (!/\bgit\s+(?:-\S+\s+)*commit\b/.test(command)) process.exit(0);

const cwd = input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? ".";
const run = (args) =>
  execSync(`git ${args}`, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const git = (args) => run(args).trim();
const dir = git("rev-parse --show-toplevel");

// Only commits that include a unit test (not an acceptance test) are gated.
// Porcelain lines start with a two-letter status, which can be a space, so
// only the end of the output is trimmed.
const unitTest = run("status --porcelain -uall")
  .trimEnd()
  .split("\n")
  .map((line) => line.slice(3).trim())
  .some(
    (file) =>
      /\.test\.tsx?$/.test(file) && !file.startsWith("acceptance-tests/"),
  );
if (!unitTest) process.exit(0);

function deny(reason) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `The cycle is not done, so do not commit yet. ${reason} See section 4 of .claude/rules/tdd-workflow.md.`,
      },
    }),
  );
  process.exit(0);
}

const log = join(dir, "tdd-log.md");
const text = existsSync(log) ? readFileSync(log, "utf8") : "";
const newest = text.includes("## ") ? text.slice(text.lastIndexOf("## ")) : "";
if (!newest) {
  deny(
    "Add an entry for this cycle to tdd-log.md: a `## <behaviour>` heading, then RED, GREEN, REFACTOR and LIST lines.",
  );
}

const heading = newest.split("\n")[0];
const missing = [];
const steps = ["RED", "GREEN", "REFACTOR", "LIST"].filter(
  (step) => !new RegExp(`^${step}:`, "m").test(newest),
);
if (steps.length) {
  missing.push(`the ${steps.join(", ")} line${steps.length > 1 ? "s" : ""}`);
}
const listLine = newest.match(/^LIST:.*$/m)?.[0] ?? "";
if (listLine) {
  const parts = ["Learnt:", "Next:"].filter((part) => !listLine.includes(part));
  if (parts.length) {
    missing.push(
      `${parts.join(" and ")} in the LIST line (what this cycle taught you, or "nothing new"; the next test and why)`,
    );
  }
}
if (missing.length) {
  deny(`In the newest entry of tdd-log.md, add ${missing.join("; ")}.`);
}

// An entry counts for one commit. Remember which entry was accepted, and at
// which commit, so that a retry of a commit that did not happen still passes.
const seen = join(git("rev-parse --absolute-git-dir"), "tdd-gate-seen");
const head = git("rev-parse HEAD");
if (existsSync(seen)) {
  const [seenHead, ...rest] = readFileSync(seen, "utf8").split("\n");
  if (rest.join("\n") === heading && seenHead !== head) {
    deny(
      `Add a new entry to tdd-log.md for this cycle: "${heading}" is from an earlier commit.`,
    );
  }
}
writeFileSync(seen, `${head}\n${heading}`);
