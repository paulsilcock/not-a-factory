#!/usr/bin/env node
// Create a new app: TanStack Router web + Hono/Litmus API in a pnpm workspace,
// plus the not-a-factory rules, skills, hooks and CI.
//
// Usage: node new-app.mjs <name> [--dir <parent>] [--no-git]
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LITMUS_VERSION = process.env.LITMUS_VERSION ?? "0.1.0-rc.3";
const MIN_NODE = [24, 14, 1];

const kit = resolve(dirname(fileURLToPath(import.meta.url)), "../kit");

// ---------- arguments and checks ----------

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const parent = resolve(args.includes("--dir") ? args[args.indexOf("--dir") + 1] : process.cwd());
const useGit = !args.includes("--no-git");

if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  fail("Give an app name in lower case, for example: new-app shop");
}
const root = join(parent, name);
if (existsSync(root) && readdirSync(root).length > 0) fail(`${root} exists and is not empty.`);

const nodeVersion = process.versions.node.split(".").map(Number);
if (compare(nodeVersion, MIN_NODE) < 0) {
  fail(`Node ${MIN_NODE.join(".")} or later is needed (Litmus). This is Node ${process.versions.node}.`);
}
for (const tool of ["pnpm", "git"]) {
  if (spawnSync(tool, ["--version"], { stdio: "ignore" }).status !== 0) fail(`${tool} is not installed.`);
}
const pnpmVersion = spawnSync("pnpm", ["--version"], { encoding: "utf8" }).stdout.trim();
const hasDocker = spawnSync("docker", ["--version"], { stdio: "ignore" }).status === 0;

mkdirSync(root, { recursive: true });

// ---------- 1. bootstrappers ----------

step("Creating web/ with the TanStack CLI");
// --router-only ignores --add-ons, so TanStack Query and shadcn are added below.
run(
  "npx",
  ["-y", "@tanstack/cli@latest", "create", "web", "--router-only", "--toolchain", "biome",
    "--package-manager", "pnpm", "--no-examples", "--no-intent", "--no-git", "--no-install",
    "--non-interactive"],
  root,
);

step("Creating api/ with create-hono");
run("npx", ["-y", "create-hono@latest", "api", "--template", "nodejs", "--pm", "pnpm"], root);

// The workspace root owns these.
for (const pkg of ["web", "api"]) {
  for (const f of ["pnpm-workspace.yaml", "pnpm-lock.yaml", "node_modules", ".git", ".gitignore", "biome.json", ".cta.json", "README.md"]) {
    rmSync(join(root, pkg, f), { recursive: true, force: true });
  }
}
rmSync(join(root, "api/src/index.ts"), { force: true });
rmSync(join(root, "web/src/router.tsx"), { force: true });
const indexHtml = join(root, "web/index.html");
writeFileSync(indexHtml, readFileSync(indexHtml, "utf8").replace(/<title>.*<\/title>/, `<title>${name}</title>`));

// ---------- 2. kit files ----------

step("Adding the kit");
copyTree(join(kit, "files"), root);
renameSync(join(root, "_gitignore"), join(root, ".gitignore"));
copyTree(join(kit, "rules"), join(root, ".claude/rules"));
copyTree(join(kit, "skills"), join(root, ".claude/skills"));
writeFileSync(join(root, ".env"), readFileSync(join(root, ".env.example")));

// ---------- 3. package.json files ----------

editJson(join(root, "package.json"), () => ({
  name,
  private: true,
  type: "module",
  packageManager: `pnpm@${pnpmVersion}`,
  engines: { node: `>=${MIN_NODE.join(".")}` },
  scripts: {
    dev: "pnpm --parallel -r dev",
    build: "pnpm --filter web build",
    start: "pnpm --filter api start",
    typecheck: "pnpm -r typecheck",
    lint: "biome check .",
    "lint:fix": "biome check --write .",
    test: "pnpm test:unit && pnpm test:acceptance",
    "test:unit": "pnpm --filter api test:unit && pnpm --filter web test",
    "test:acceptance": "pnpm --filter api test:acceptance",
    "test:changed": "node scripts/test-changed.mjs",
    "db:up": "docker compose up -d --wait db",
    "db:down": "docker compose down",
    "db:generate": "pnpm --filter api db:generate",
    "db:migrate": "pnpm --filter api db:migrate",
  },
  devDependencies: {},
  intent: { skills: ["@tanstack/*"] },
}));

editJson(join(root, "api/package.json"), (pkg) => ({
  name: "api",
  private: true,
  type: "module",
  imports: { "#api/*": "./src/*", "#acceptance/*": "./test-acceptance/*" },
  exports: { "./app": "./src/app.ts" },
  scripts: {
    dev: "tsx watch src/main.ts",
    start: "tsx src/main.ts",
    typecheck: "tsc",
    test: "vitest run",
    "test:unit": "vitest run --project unit",
    "test:acceptance": "vitest run --project acceptance",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
  },
  dependencies: { hono: pkg.dependencies?.hono ?? "^4" },
  devDependencies: {},
}));

editJson(join(root, "web/package.json"), (pkg) => {
  for (const s of ["format", "lint", "check"]) delete pkg.scripts[s];
  delete pkg.devDependencies["@biomejs/biome"];
  delete pkg.pnpm;
  pkg.scripts.typecheck = "tsr generate && tsc --noEmit";
  pkg.scripts.test = "vitest run";
  return pkg;
});

// ---------- 4. dependencies ----------

step("Installing dependencies");
const litmus = ["core", "http", "db", "log", "test"].map((p) => `@litmus-ts/${p}@${LITMUS_VERSION}`);
pnpm(["add", "-w", "-D", "@biomejs/biome"]);
pnpm(["--filter", "api", "add", ...litmus.filter((p) => !p.includes("/test@")),
  "@hono/node-server@^1.19.13", "@hono/node-ws", "drizzle-orm", "pg", "pino", "reflect-metadata",
  "tsyringe", "zod", "tsx"]);
pnpm(["--filter", "api", "add", "-D", litmus.find((p) => p.includes("/test@")),
  "@electric-sql/pglite@^0.4.2", "@types/node", "@types/pg", "drizzle-kit", "typescript", "vitest"]);
pnpm(["--filter", "web", "add", "@tanstack/react-query", "hono"]);
pnpm(["--filter", "web", "add", "-D", "api@workspace:*", "vitest", "jsdom",
  "@testing-library/react", "@testing-library/user-event", "@testing-library/jest-dom"]);

// ---------- 5. third-party agent setup ----------

step("Setting up shadcn/ui");
run("pnpm", ["dlx", "shadcn@latest", "init", "--base", "radix", "--preset", "nova", "--yes", "--no-monorepo"], join(root, "web"));

step("Installing agent skills (TanStack Intent, shadcn)");
run("pnpm", ["dlx", "@tanstack/intent", "install"], root, { optional: true });
run("pnpm", ["dlx", "skills", "add", "shadcn/ui", "--skill", "shadcn", "--agent", "claude-code", "--yes"], root, { optional: true });

// ---------- 6. finish ----------

step("Formatting");
run("pnpm", ["-s", "lint:fix"], root, { optional: true });
run("pnpm", ["--filter", "web", "exec", "tsr", "generate"], root, { optional: true });

if (useGit) {
  step("Creating the git repository");
  run("git", ["init", "-q", "-b", "main"], root);
  run("git", ["add", "-A"], root);
  run("git", ["commit", "-q", "-m", "Create app with not-a-factory"], root, { optional: true });
}

console.log(`
Done: ${root}

Next:
  cd ${name}
  ${hasDocker ? "" : "(install Docker first) "}pnpm db:up
  pnpm db:migrate
  pnpm dev           # web http://localhost:3000, API http://localhost:3001
  pnpm test

Then start Claude Code in ${name}/ and ask for the first capability.
`);

// ---------- helpers ----------

function step(message) {
  console.log(`\n==> ${message}`);
}

function run(cmd, cmdArgs, cwd, { optional = false } = {}) {
  const result = spawnSync(cmd, cmdArgs, { cwd, stdio: ["ignore", "inherit", "inherit"] });
  if (result.status === 0) return;
  if (optional) {
    console.warn(`Warning: "${cmd} ${cmdArgs.join(" ")}" failed. Continuing.`);
    return;
  }
  fail(`"${cmd} ${cmdArgs.join(" ")}" failed in ${cwd}.`);
}

function pnpm(cmdArgs) {
  run("pnpm", cmdArgs, root);
}

function editJson(file, edit) {
  const current = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  writeFileSync(file, `${JSON.stringify(edit(current), null, 2)}\n`);
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const src = join(from, entry);
    const dest = join(to, entry);
    if (statSync(src).isDirectory()) {
      mkdirSync(dest, { recursive: true });
      copyTree(src, dest);
    } else {
      const text = readFileSync(src);
      writeFileSync(dest, text.toString("utf8").replaceAll("{{APP_NAME}}", name));
    }
  }
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) - b[i];
  return 0;
}

function fail(message) {
  console.error(`new-app: ${message}`);
  process.exit(1);
}
