import { HonoDriver } from "@litmus-ts/http/testing";
import type { AppDriver } from "#acceptance/driver.ts";
import type { AppType } from "#api/app.ts";

/** Drives the app over HTTP with the typed Hono RPC client (`this.client`). */
export class HttpAppDriver extends HonoDriver<AppType> implements AppDriver {
  constructor(baseUrl: string) {
    super({ baseUrl });
  }
}
