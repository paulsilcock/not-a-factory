import { HonoDriver } from "@litmus-ts/http/testing";

import type { AppType } from "#api/app.ts";

import type { AppDriver } from "#acceptance/driver.ts";

/** Drives the app over HTTP with the typed Hono RPC client (`this.client`). */
export class HttpAppDriver extends HonoDriver<AppType> implements AppDriver {
  constructor(baseUrl: string) {
    super({ baseUrl });
  }
}
