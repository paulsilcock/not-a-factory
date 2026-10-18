// Stop hook 1: typecheck + lint. Blocks (exit 2) so Claude fixes mechanical errors before it stops.
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
if (input.stop_hook_active) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const changed = execSync("git status --porcelain -- api web", { cwd, encoding: "utf8" });
if (!changed.trim()) process.exit(0);

spawnSync("pnpm", ["-s", "lint:fix"], { cwd, stdio: "ignore" });

const failures = [];
for (const script of ["typecheck", "lint"]) {
  const run = spawnSync("pnpm", [script], { cwd, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
  if (run.status !== 0) failures.push(`$ pnpm ${script}\n${run.stdout}${run.stderr}`.trim());
}

if (failures.length > 0) {
  console.error(`Typecheck or lint failed. Fix these before you stop:\n\n${failures.join("\n\n").slice(0, 8000)}`);
  process.exit(2);
}
