#!/usr/bin/env node
// Adds Clerk sign-in to a not-a-factory app, in the current directory.
// It copies new files (never over existing ones), makes the edits it can make
// safely, installs the packages, and lists any edit it could not make.
// Usage: node add-clerk.mjs [--no-install]
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const files = join(import.meta.dirname, "files");
const skipped = [];
const failed = [];

// 1. New files.
function copy(dir) {
  for (const name of readdirSync(dir)) {
    const from = join(dir, name);
    const to = relative(files, from);
    if (statSync(from).isDirectory()) {
      copy(from);
    } else if (existsSync(to)) {
      skipped.push(to);
    } else {
      cpSync(from, to, { recursive: true });
      console.log(`added ${to}`);
    }
  }
}
copy(files);

// 2. Edits to files from the template. Every part of an edit must find its
// anchor: if one part does not, the file is left as it was, and the edit is
// reported so that it can be made by hand. An edit already made is skipped.
class Missing extends Error {}
function edit(file, done, change) {
  if (!existsSync(file)) return failed.push(`${file}: the file is missing`);
  const text = readFileSync(file, "utf8");
  if (text.includes(done)) return;
  try {
    writeFileSync(file, change(text));
    console.log(`changed ${file}`);
  } catch (error) {
    if (!(error instanceof Missing)) throw error;
    failed.push(`${file}: no "${error.message}" found, so nothing was changed`);
  }
}
const need = (text, anchor) => {
  if (!text.includes(anchor)) throw new Missing(anchor.split("\n")[0]);
};
const swap = (anchor, replacement) => (text) => {
  need(text, anchor);
  return text.replace(anchor, replacement);
};
const after = (anchor, added) => swap(anchor, `${anchor}${added}`);
const before = (anchor, added) => swap(anchor, `${added}${anchor}`);
const appendLine = (line) => (text) => `${text.trimEnd()}\n${line}\n`;
// Adds members at the start of a class or interface body, empty or not.
const intoBody = (opening, members) => (text) => {
  const found = text.match(opening);
  if (!found) throw new Missing(String(opening));
  const empty = text.slice(found.index + found[0].length).startsWith("}");
  return text.replace(found[0], `${found[0]}\n${members}\n${empty ? "" : "\n"}`);
};

// ClerkAuthentication is a @singleton(), so tsyringe resolves it with no
// registration. main.ts only checks Clerk's keys, so a missing key stops the start.
edit("api/src/main.ts", "CLERK_SECRET_KEY", (text) =>
  after("DrizzleDbContext.register(drizzle(pool, { schema }));", `

if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error("CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY must be set");
}`)(text),
);

edit("api/src/app.ts", "authentication", (text) =>
  after('import { Hono } from "hono";\n', '\nimport { authentication } from "#api/entrypoints/http/authentication.ts";')(
    // Routes before this are public; every route under /api after it needs a signed-in person.
    after('.route("/health", health)', '\n    .use("/api/*", authentication)')(text),
  ),
);

edit("web/src/main.tsx", "ClerkProvider", (text) => {
  const block = text.match(/( *)<QueryClientProvider[\s\S]*?<\/QueryClientProvider>/);
  if (!block) throw new Missing("<QueryClientProvider");
  const indent = block[1];
  const inner = block[0].replace(/^/gm, "  ");
  return before('import { QueryClient', 'import { ClerkProvider } from "@clerk/react";\n')(
    swap(
      block[0],
      `${indent}<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>\n${inner}\n${indent}</ClerkProvider>`,
    )(text),
  );
});

// One .env at the project root, also for the web app's public key.
edit("web/vite.config.ts", "envDir", after("defineConfig({", '\n  envDir: "..",'));

edit(
  "Dockerfile",
  "VITE_CLERK_PUBLISHABLE_KEY",
  before("RUN pnpm build", "# The web app reads its public Clerk key at build time.\nARG VITE_CLERK_PUBLISHABLE_KEY\n"),
);
edit("docker-compose.yml", "CLERK_SECRET_KEY", (text) =>
  after("      DATABASE_URL: postgres://app:app@db:5432/app", [
    "",
    "      CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY:-}",
    "      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY:-}",
  ].join("\n"))(
    swap(
      "  app:\n    build: .",
      "  app:\n    build:\n      context: .\n      args:\n        VITE_CLERK_PUBLISHABLE_KEY: ${VITE_CLERK_PUBLISHABLE_KEY:-}",
    )(text),
  ),
);

edit(
  ".env.example",
  "CLERK_SECRET_KEY",
  appendLine(
    "\n# Clerk development instance: Dashboard > API keys. The same publishable key twice.\nVITE_CLERK_PUBLISHABLE_KEY=\nCLERK_PUBLISHABLE_KEY=\nCLERK_SECRET_KEY=",
  ),
);

edit(
  ".github/workflows/ci.yml",
  "CLERK_SECRET_KEY",
  after("      - run: pnpm test:acceptance", [
    "",
    "        env:",
    "          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}",
    "          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}",
    "          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}",
  ].join("\n")),
);

edit("acceptance-tests/global-setup.ts", "clerkTestRun", (text) =>
  appendLine(`
// Clerk: the test helpers read the keys from the environment, and the test
// workers start after this, so they get the run id and Clerk's testing token.
export default async function setup(project: TestProject) {
  if (existsSync(\`\${root}/.env\`)) process.loadEnvFile(\`\${root}/.env\`);
  await clerkTestRun.start();
  const stopApp = startApp(project);
  return async () => {
    await clerkTestRun.finish();
    stopApp?.();
  };
}`)(
    after(
      'import { execSync } from "node:child_process";',
      // Newer templates already import existsSync.
      `${/import \{[^}]*\bexistsSync\b[^}]*\} from "node:fs"/.test(text) ? "" : '\nimport { existsSync } from "node:fs";'}\n\nimport { clerkTestRun } from "#acceptance/support/clerk.ts";`,
    )(
      swap("export default function setup(project: TestProject) {", "function startApp(project: TestProject) {")(text),
    ),
  ),
);

edit("acceptance-tests/driver.ts", "loggedInAs", (text) =>
  intoBody(/export interface AppDriver extends AsyncDisposable \{/, [
    "  /** Starts signed in as the person, with no sign-in steps (Clerk's test helper). */",
    "  loggedInAs(name: string): Promise<void>;",
    "  confirmSignedInAs(name: string): Promise<void>;",
  ].join("\n"))(
    swap(
      'new BrowserAppDriver({ baseUrl: inject("acceptanceUrl") })',
      [
        "new BrowserAppDriver({",
        "    // Litmus's default user agent breaks Clerk's sign-in, so use the browser's own.",
        '    baseUrl: inject("acceptanceUrl"),',
        "    userAgent: null,",
        "  })",
      ].join("\n"),
    )(text),
  ),
);

edit("acceptance-tests/driver/browser.ts", "loggedInAs", (text) =>
  intoBody(/export class BrowserAppDriver extends BrowserDriver implements AppDriver \{/, `  override async init() {
    await super.init();
    await allowClerkTesting(this.context);
  }

  async loggedInAs(name: string) {
    await signInDirectly(this.page, name);
  }

  async confirmSignedInAs(name: string) {
    expect(await signedInEmail(this.page)).toBe(testPerson(name).email);
  }`)(
    after('import { BrowserDriver } from "@litmus-ts/test";', '\nimport { expect } from "vitest";')(
      after('import type { AppDriver } from "#acceptance/driver.ts";', [
        "",
        "import {",
        "  allowClerkTesting,",
        "  signedInEmail,",
        "  signInDirectly,",
        "  testPerson,",
        '} from "#acceptance/support/clerk.ts";',
      ].join("\n"))(text),
    ),
  ),
);

edit("acceptance-tests/dsl.ts", "isSignedIn", (text) =>
  intoBody(/export class \w+ extends Dsl<AppDriver> \{/, `  /** The person starts signed in. A name is the same person in every test of a file. */
  async isSignedIn(name: string) {
    await this.driver.loggedInAs(name);
  }

  async confirmSignedInAs(name: string) {
    await this.driver.confirmSignedInAs(name);
  }`)(text),
);

edit(
  "CLAUDE.md",
  "auth.md",
  before(
    "## Commands",
    "Sign-in is Clerk, behind our own `Actor`; what a person may do is domain rules. Read `.claude/rules/auth.md` before you touch either.\n\n",
  ),
);

// 3. Packages.
if (!process.argv.includes("--no-install")) {
  const run = (command) => {
    console.log(`$ ${command}`);
    execSync(command, { stdio: "inherit" });
  };
  run("pnpm --filter api add @clerk/hono@^0.1.92");
  run("pnpm --filter web add @clerk/react@^6.18.0");
  run("pnpm --filter acceptance-tests add -D @clerk/testing@^2.2.48 @clerk/backend@^3.26.0");
  try {
    run("pnpm lint:fix");
  } catch {
    failed.push("pnpm lint:fix left problems it could not fix: run pnpm lint to see them");
  }
}

for (const file of skipped) console.log(`skipped ${file}: it already exists`);
if (failed.length) {
  console.log("\nMake these changes by hand (see the add-clerk skill):");
  for (const line of failed) console.log(`- ${line}`);
  process.exitCode = 1;
}
