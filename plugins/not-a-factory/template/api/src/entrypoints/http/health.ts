import { Hono } from "hono";

// Liveness only: the process is up. No dependency checks.
export const health = new Hono().get("/", (c) => c.json({ status: "ok" }));
