import "reflect-metadata";

import { existsSync } from "node:fs";

import { DomainEventDispatcher } from "@litmus-ts/core/events";
import { DrizzleDbContext } from "@litmus-ts/db/drizzle/postgres";
import { serve } from "@litmus-ts/http";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { container } from "tsyringe";

import { createApp } from "#api/app.ts";
import { schema } from "#api/infra/db/schema.ts";

export interface RunningSystem {
  baseUrl: string;
  stop(): Promise<void>;
}

const migrationsFolder = new URL("../drizzle", import.meta.url).pathname;

/**
 * Start the real API on a free port against the Postgres in DATABASE_URL,
 * with all migrations applied. Tests reach the system only through
 * `baseUrl`, the same way users do.
 */
export async function startSystem(): Promise<RunningSystem> {
  if (existsSync("../.env")) process.loadEnvFile("../.env");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
    await migrate(db, { migrationsFolder });
  }

  container.registerSingleton(DomainEventDispatcher);
  DrizzleDbContext.register(db);

  const server = await serve(createApp(), { port: 0, errors: {} });

  return {
    baseUrl: `http://localhost:${server.port}`,
    async stop() {
      await server.stop();
      await pool.end();
      container.reset();
    },
  };
}
