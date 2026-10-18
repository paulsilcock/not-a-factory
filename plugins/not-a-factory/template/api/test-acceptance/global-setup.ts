import { execSync } from "node:child_process";

import type { TestProject } from "vitest/node";

// Acceptance tests treat the app as a black box: they only know its address.
// With ACCEPTANCE_URL set (for example a deployed environment), they use it.
// Otherwise they start the app and its database with Docker Compose, as a
// separate project so that the development database is not touched.
const composeProject = "acceptance";
const dbPort = "55432";
const appPort = "53001";

const compose = (args: string) =>
  execSync(`docker compose -p ${composeProject} --profile app ${args}`, {
    cwd: "..",
    stdio: "inherit",
    env: { ...process.env, DB_PORT: dbPort, APP_PORT: appPort },
  });

export default function setup(project: TestProject) {
  const external = process.env.ACCEPTANCE_URL;
  if (external) {
    project.provide("acceptanceUrl", external);
    return;
  }

  try {
    compose("up -d --build --wait db");
    execSync("pnpm db:migrate", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: `postgres://app:app@localhost:${dbPort}/app`,
      },
    });
    compose("up -d --build --wait app");
    project.provide("acceptanceUrl", `http://localhost:${appPort}`);
  } catch (error) {
    compose("down -v");
    throw error;
  }

  return () => compose("down -v");
}

declare module "vitest" {
  export interface ProvidedContext {
    acceptanceUrl: string;
  }
}
