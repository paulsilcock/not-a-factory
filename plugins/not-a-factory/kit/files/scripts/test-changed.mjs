// Run the unit tests related to files changed since HEAD (staged, unstaged and untracked).
// `pnpm test:changed` prints vitest output. `--summary` prints one line per package.
import { execSync, spawnSync } from "node:child_process";

const summaryOnly = process.argv.includes("--summary");
const git = (cmd) => execSync(cmd, { encoding: "utf8" }).split("\n").filter(Boolean);
const files = [
  ...new Set([
    ...git("git diff --name-only HEAD"),
    ...git("git ls-files --others --exclude-standard"),
  ]),
].filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith("routeTree.gen.ts"));

const lines = [];
let failed = false;
for (const pkg of ["api", "web"]) {
  const related = files.filter((f) => f.startsWith(`${pkg}/`)).map((f) => f.slice(pkg.length + 1));
  if (related.length === 0) continue;
  const args = ["--filter", pkg, "exec", "vitest", "related", "--run", "--passWithNoTests"];
  if (pkg === "api") args.push("--project", "unit");
  const run = spawnSync("pnpm", [...args, ...related], {
    encoding: "utf8",
    stdio: summaryOnly ? "pipe" : "inherit",
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (run.status !== 0) failed = true;
  if (summaryOnly) {
    const out = `${run.stdout}${run.stderr}`;
    const tests = out.match(/^\s*Tests\s+(.*)$/m)?.[1]?.trim() ?? (run.status === 0 ? "no related tests" : "failed to run");
    lines.push(`${pkg}: ${tests}`);
  }
}

if (summaryOnly && lines.length > 0) console.log(`Related unit tests — ${lines.join("; ")}`);
process.exit(failed && !summaryOnly ? 1 : 0);
