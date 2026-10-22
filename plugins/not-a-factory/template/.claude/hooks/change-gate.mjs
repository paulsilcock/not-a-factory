// PreToolUse hook: asks the developer before Claude adds a dependency or
// changes infrastructure (see section 5 of .claude/rules/tdd-workflow.md).
// It covers package installs, package.json, Docker files, CI workflows and
// .env files. The developer sees the change and decides.
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const tool = input.tool_name;
const command = input.tool_input?.command ?? "";
const file = input.tool_input?.file_path ?? "";

function ask(what) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `${what} needs the developer's approval, even if it was discussed before. See section 5 of .claude/rules/tdd-workflow.md. If the developer says yes, record it in decisions.md.`,
      },
    }),
  );
  process.exit(0);
}

// A package manager command that names a package: `pnpm add x`, `npm i x`.
// A plain `pnpm install` only installs what the lockfile already has.
const install =
  /\b(?:pnpm|npm|yarn|bun)\s+(?:(?:-\S+|--filter\s+\S+)\s+)*(?:add|install|i)\s+(?:-\S+\s+)*[^-\s&|;]/;
if (tool === "Bash" && install.test(command)) ask("A new dependency");

const name = basename(file);
const infra =
  name === "package.json" ||
  /^Dockerfile/.test(name) ||
  /^docker-compose.*\.ya?ml$/.test(name) ||
  /^\.env/.test(name) ||
  /\/\.github\/workflows\//.test(file);
if (["Edit", "Write", "MultiEdit"].includes(tool) && infra) {
  ask(`A change to ${name}`);
}
