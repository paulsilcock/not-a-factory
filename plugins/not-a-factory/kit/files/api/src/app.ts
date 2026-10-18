import { Hono } from "hono";

import { health } from "#api/entrypoints/http/health.ts";

// Mount feature routes under /api, for example .route("/api/orders", orders).
// Keep the calls chained so AppType carries every route to the web client.
export function createApp() {
  return new Hono().route("/health", health);
}

export type AppType = ReturnType<typeof createApp>;
