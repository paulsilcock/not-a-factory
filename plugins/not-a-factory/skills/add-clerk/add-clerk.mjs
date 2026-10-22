#!/usr/bin/env node
// Adds Clerk sign-in to a not-a-factory app, in the current directory.
// It copies new files (never over existing ones), makes the edits it can make
// safely, installs the packages, and lists any edit it could not make.
// Usage: node add-clerk.mjs [--no-install]
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const files = join(import.meta.dirname, "files");
const skipped = [];
const failed = [];
const next = [];

// 1. New files.
function copy(dir, base = dir) {
  for (const name of readdirSync(dir)) {
    const from = join(dir, name);
    const to = relative(base, from);
    if (statSync(from).isDirectory()) {
      copy(from, base);
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

// Only a signed-in person sees the app's pages; anyone else goes to /sign-in.
// The shell's header (sidebar button, breadcrumbs) is for a signed-in person too.
edit("web/src/routes/__root.tsx", "SignedInOnly", (text) => {
  const guarded = before("import ", 'import { SignedInOnly } from "@/components/signed-in-only";\n')(
    swap("<Outlet />", "<SignedInOnly>\n<Outlet />\n</SignedInOnly>")(text),
  );
  const header = guarded.match(/<header\b[\s\S]*?<SidebarTrigger[\s\S]*?<\/header>/);
  if (!header) return guarded;
  return before("import ", 'import { Show } from "@clerk/react";\n')(
    guarded.replace(header[0], `<Show when="signed-in">\n${header[0]}\n</Show>`),
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
  after('import { inject } from "vitest";', '\n\nimport type { TestMetadata } from "#acceptance/support/clerk.ts";')(intoBody(/export interface AppDriver extends AsyncDisposable \{/, [
    "  /**",
    "   * Signs the person in with no sign-in steps (Clerk's test helper), in place of",
    "   * whoever was signed in, with this Clerk public metadata (none by default).",
    "   */",
    "  loggedInAs(name: string, metadata?: TestMetadata): Promise<void>;",
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
  )),
);

edit("acceptance-tests/driver/browser.ts", "loggedInAs", (text) =>
  intoBody(/export class BrowserAppDriver extends BrowserDriver implements AppDriver \{/, `  override async init() {
    await super.init();
    await allowClerkTesting(this.context);
  }

  async loggedInAs(name: string, metadata?: TestMetadata) {
    await signInDirectly(this.page, name, metadata);
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
        "  type TestMetadata,",
        "  testPerson,",
        '} from "#acceptance/support/clerk.ts";',
      ].join("\n"))(text),
    ),
  ),
);

edit("acceptance-tests/dsl.ts", "isSignedIn", (text) =>
  intoBody(/export class \w+ extends Dsl<AppDriver> \{/, `  /**
   * The person is signed in, with no sign-in steps. Call it again with another
   * name to switch people. A name is the same person in every test of a file.
   * For a person with Clerk metadata, add a word in business terms that calls
   * \`this.driver.loggedInAs(name, { role: "manager" })\`. With no metadata,
   * the person has the default role.
   */
  async isSignedIn(name: string) {
    await this.driver.loggedInAs(name);
  }

  async confirmSignedInAs(name: string) {
    await this.driver.confirmSignedInAs(name);
  }`)(text),
);

// Sign-up, sign-in and sign-out through Clerk's own pages (driver/clerk-pages.ts).
edit("acceptance-tests/driver.ts", "signUp(", (text) =>
  intoBody(/export interface AppDriver extends AsyncDisposable \{/, [
    "  signUp(name: string): Promise<void>;",
    "  signIn(name: string): Promise<void>;",
    "  signOut(): Promise<void>;",
    "  /** Creates the person's account in Clerk, with no page (a Clerk test interface). */",
    "  createAccount(name: string): Promise<void>;",
    "  confirmSignedOut(): Promise<void>;",
    "  openApp(): Promise<void>;",
    "  confirmAskedToSignIn(): Promise<void>;",
  ].join("\n"))(text),
);

edit("acceptance-tests/driver/browser.ts", "signUpThroughPage", (text) =>
  after("  async confirmSignedInAs(name: string) {\n    expect(await signedInEmail(this.page)).toBe(testPerson(name).email);\n  }", `

  async signUp(name: string) {
    await signUpThroughPage(this.page, name);
  }

  async signIn(name: string) {
    await signInThroughPage(this.page, name);
  }

  async signOut() {
    await signOutThroughPage(this.page);
  }

  async createAccount(name: string) {
    await ensureTestUser(name);
  }

  async confirmSignedOut() {
    expect(await signedInEmail(this.page)).toBeNull();
  }

  async openApp() {
    await this.page.goto("/");
  }

  async confirmAskedToSignIn() {
    await confirmOnSignInPage(this.page);
  }`)(
    after('import type { AppDriver } from "#acceptance/driver.ts";', [
      "",
      "import {",
      "  confirmOnSignInPage,",
      "  signInThroughPage,",
      "  signOutThroughPage,",
      "  signUpThroughPage,",
      '} from "#acceptance/driver/clerk-pages.ts";',
      'import { ensureTestUser } from "#acceptance/support/clerk.ts";',
    ].join("\n"))(text),
  ),
);

edit("acceptance-tests/dsl.ts", "signsUp", (text) =>
  after("    await this.driver.confirmSignedInAs(name);\n  }", `

  async signsUp(name: string) {
    await this.driver.signUp(name);
  }

  /** The person has an account and is signed out. */
  async hasAnAccount(name: string) {
    await this.driver.createAccount(name);
  }

  async signsIn(name: string) {
    await this.driver.signIn(name);
  }

  async signsOut() {
    await this.driver.signOut();
  }

  async confirmSignedOut() {
    await this.driver.confirmSignedOut();
  }

  async opensTheApp() {
    await this.driver.openApp();
  }

  /** The person sees only the sign-in page: none of the app. */
  async confirmAskedToSignIn() {
    await this.driver.confirmAskedToSignIn();
  }`)(text),
);

// The test file uses the app's DSL class, whatever its name.
const dslName = existsSync("acceptance-tests/dsl.ts")
  && readFileSync("acceptance-tests/dsl.ts", "utf8").match(/export class (\w+) extends Dsl<AppDriver>/)?.[1];
if (dslName && dslName !== "AppDsl") {
  edit("acceptance-tests/signing-in.test.ts", `new ${dslName}(`, (text) => text.replaceAll("AppDsl", dslName));
}

edit(
  "CLAUDE.md",
  "auth.md",
  before(
    "## Commands",
    "Sign-in is Clerk, behind our own `Actor`; what a person may do is domain rules. Read `.claude/rules/auth.md` before you touch either.\n\n",
  ),
);

// The user button goes in the sidebar footer, where shadcn's sidebar blocks
// put the user menu. It replaces the block's sample NavUser.
const sidebar = "web/src/components/app-sidebar.tsx";
if (existsSync(sidebar)) {
  copy(join(import.meta.dirname, "sidebar"));
  edit(sidebar, "SidebarUserButton", (text) => {
    need(text, "<SidebarFooter>");
    const navUser = text.match(/<NavUser\b[^>]*\/>/);
    const placed = navUser
      ? text
          .replace(navUser[0], "<SidebarUserButton />")
          .replace(/import \{ NavUser \} from "[^"]+";?\n/, "")
      : text.replace("<SidebarFooter>", "<SidebarFooter>\n        <SidebarUserButton />");
    return before(
      "import ",
      'import { SidebarUserButton } from "@/components/sidebar-user-button";\n',
    )(placed);
  });
  // Signed out, there is no sidebar: the sign-in and sign-up pages stand alone.
  edit(sidebar, 'when="signed-in"', (text) => {
    const block = text.match(/return \(\s*(<Sidebar\b[\s\S]*?<\/Sidebar>)/);
    if (!block) throw new Missing("return (<Sidebar");
    return before("import ", 'import { Show } from "@clerk/react";\n')(
      text.replace(block[1], `<Show when="signed-in">\n${block[1]}\n</Show>`),
    );
  });
  const sample = "web/src/components/nav-user.tsx";
  if (existsSync(sample) && !usedInWeb("nav-user")) {
    rmSync(sample);
    console.log(`removed ${sample}: the sample user menu, now unused`);
  }
} else {
  // No sidebar: the user button goes at the top right of every page.
  edit("web/src/routes/__root.tsx", "UserButton", (text) => {
    const page = text.match(/<SignedInOnly>\s*<Outlet \/>/);
    if (!page) throw new Missing("<SignedInOnly><Outlet />");
    return before("import ", 'import { Show, UserButton } from "@clerk/react";\n')(
      text.replace(
        page[0],
        `<SignedInOnly>\n<Show when="signed-in">\n<div className="fixed top-3 right-3">\n<UserButton />\n</div>\n</Show>\n<Outlet />`,
      ),
    );
  });
  next.push(
    "The app has no sidebar (web/src/components/app-sidebar.tsx), so the user button is at the top right of every page. For an app shell, build it with a shadcn sidebar block (with a <SidebarFooter>), take the user button out of __root.tsx, and run this script again: it puts the button in the sidebar footer.",
  );
}
function usedInWeb(name, dir = "web/src") {
  return readdirSync(dir).some((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return usedInWeb(name, path);
    return readFileSync(path, "utf8").includes(`/${name}"`);
  });
}

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
for (const line of next) console.log(`\nNext: ${line}`);
if (failed.length) {
  console.log("\nMake these changes by hand (see the add-clerk skill):");
  for (const line of failed) console.log(`- ${line}`);
  process.exitCode = 1;
}
