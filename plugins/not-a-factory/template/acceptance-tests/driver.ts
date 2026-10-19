import { inject } from "vitest";

import { BrowserAppDriver } from "./driver/browser.ts";

/**
 * What a user can do with the app, in business words.
 * Add a method when an acceptance test first needs it.
 */
export interface AppDriver extends AsyncDisposable {}

export async function createDriver(): Promise<AppDriver> {
  const driver = new BrowserAppDriver({ baseUrl: inject("acceptanceUrl") });
  await driver.init(); // Litmus base drivers need init(); acceptance() does not call it
  return driver;
}
