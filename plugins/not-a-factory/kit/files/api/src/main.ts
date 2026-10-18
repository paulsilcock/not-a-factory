import "reflect-metadata";

import { existsSync } from "node:fs";

import { serveStatic } from "@hono/node-server/serve-static";
import { DomainEventDispatcher } from "@litmus-ts/core/events";
import { DrizzleDbContext } from "@litmus-ts/db/drizzle/postgres";
import { serve } from "@litmus-ts/http";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import pg from "pg";
import { container } from "tsyringe";

import { createApp } from "#api/app.ts";
import { schema } from "#api/infra/db/schema.ts";

if (existsSync("../.env")) process.loadEnvFile("../.env");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const port = Number(process.env.PORT ?? 3001);
const webDist = process.env.WEB_DIST ?? "../web/dist";

const pool = new pg.Pool({ connectionString: databaseUrl });
container.registerSingleton(DomainEventDispatcher);
DrizzleDbContext.register(drizzle(pool, { schema }));

const app = new Hono().route("/", createApp());
if (existsSync(webDist)) {
  app.use("/*", serveStatic({ root: webDist }));
  app.get("/*", serveStatic({ root: webDist, path: "index.html" }));
}

const server = await serve(app, {
  port,
  // DomainError class name → HTTP status. Default is 400.
  errors: {},
  onBeforeStop: () => pool.end(),
});
console.log(`api listening on http://localhost:${server.port}`);
