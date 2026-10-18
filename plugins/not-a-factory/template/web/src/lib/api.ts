import type { AppType } from "api/app";
import { hc } from "hono/client";

/** Typed API client. The types come from the API's routes (Hono RPC). */
export const api = hc<AppType>("/");
