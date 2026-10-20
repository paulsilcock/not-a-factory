// PreToolUse hook: blocks a `git commit` until the cycle's REFACTOR and LIST
// lines are written (see .claude/rules/tdd-workflow.md). It looks only at the
// conversation since the last commit, and only when a GREEN line is in it.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";
if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

const entries = readFileSync(input.transcript_path, "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return {};
    }
  });
const blocks = entries.flatMap((entry) =>
  Array.isArray(entry.message?.content) ? entry.message.content : [],
);

const finished = new Set(
  blocks.filter((b) => b.type === "tool_result").map((b) => b.tool_use_id),
);
let lastCommit = -1;
blocks.forEach((b, i) => {
  if (
    b.type === "tool_use" &&
    finished.has(b.id) &&
    /\bgit\s+commit\b/.test(b.input?.command ?? "")
  ) {
    lastCommit = i;
  }
});

const text = blocks
  .slice(lastCommit + 1)
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n");
const green = text.lastIndexOf("**GREEN:**");
if (green === -1) process.exit(0);

const afterGreen = text.slice(green);
const missing = ["REFACTOR", "LIST"].filter(
  (step) => !afterGreen.includes(`**${step}:**`),
);
if (missing.length === 0) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `Do not commit yet: write the ${missing.join(" and ")} line${missing.length > 1 ? "s" : ""} for this cycle first (see .claude/rules/tdd-workflow.md). REFACTOR: improve the design and remove unused code, then say what you did, or "nothing to change". LIST: review the test list and show it.`,
    },
  }),
);
