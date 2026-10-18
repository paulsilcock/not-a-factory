// Stop hook 2: run unit tests related to changed files. Never blocks; reports to the developer only.
// A failing test can be the expected RED, so the developer decides what happens next.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

JSON.parse(readFileSync(0, "utf8") || "{}");
const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const run = spawnSync("node", ["scripts/test-changed.mjs", "--summary"], { cwd, encoding: "utf8" });
const summary = run.stdout.trim();
if (summary) console.log(JSON.stringify({ systemMessage: summary }));
process.exit(0);
