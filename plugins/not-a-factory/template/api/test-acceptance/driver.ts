import { inject } from "vitest";

import { HttpAppDriver } from "./driver/http.ts";

/**
 * What a user can do with the app, in business words.
 * Add a method when an acceptance test first needs it.
 */
export interface AppDriver extends AsyncDisposable {}

export function createDriver(): AppDriver {
  return new HttpAppDriver(inject("acceptanceUrl"));
}
