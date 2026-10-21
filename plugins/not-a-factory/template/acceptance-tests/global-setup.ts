import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { TestProject } from "vitest/node";

// Acceptance tests treat the app as a black box: they only know its address.
// With ACCEPTANCE_URL set (for example a deployed environment), they use it.
// Otherwise they start the app and its database with Docker Compose, as a
// separate project so that the development database is not touched.
// The stack stays up between runs, so later runs are fast; `up --build`
// rebuilds the app only when the code changed. The tests do not need a clean
// database: the DSL aliases keep each test's data separate.
// Stop it with `pnpm test:acceptance:down`.
const composeProject = "acceptance";
const dbPort = "55432";
const appPort = "53001";
const root = "..";

const compose = (args: string) =>
  execSync(`docker compose -p ${composeProject} --profile app ${args}`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DB_PORT: dbPort, APP_PORT: appPort },
  });

// One run at a time uses the stack: a second run would restart the app under
// the first. The lock holds the running process's id.
const lockFile = join(import.meta.dirname, ".run.lock");
function takeLock() {
  if (existsSync(lockFile)) {
    const pid = Number(readFileSync(lockFile, "utf8"));
    if (isRunning(pid)) {
      const message = `Another acceptance-test run (process ${pid}) is using the test stack. Wait for it to finish, or stop it.`;
      console.error(message); // Vitest can fail to print an error from the global setup
      throw new Error(message);
    }
  }
  writeFileSync(lockFile, String(process.pid));
  return () => rmSync(lockFile, { force: true });
}
function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export default function setup(project: TestProject) {
  const external = process.env.ACCEPTANCE_URL;
  if (external) {
    project.provide("acceptanceUrl", external);
    return;
  }

  const releaseLock = takeLock();
  try {
    compose("up -d --build --wait db");
    execSync("pnpm db:migrate", {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: `postgres://app:app@localhost:${dbPort}/app`,
      },
    });
    compose("up -d --build --wait app");
    project.provide("acceptanceUrl", `http://localhost:${appPort}`);
    return releaseLock;
  } catch (error) {
    releaseLock();
    compose("down -v");
    throw error;
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    acceptanceUrl: string;
  }
}
