import { HttpAppDriver } from "./driver/http.ts";
import type { RunningSystem } from "./system.ts";

/**
 * What a user can do with the app, in business words.
 * Add a method when an acceptance test first needs it.
 */
export interface AppDriver extends AsyncDisposable {}

export function createDriver(system: RunningSystem): AppDriver {
  return new HttpAppDriver(system.baseUrl);
}
