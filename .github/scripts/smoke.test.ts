import { expect, inject, it } from "vitest";

import { createDriver } from "#acceptance/driver.ts";

// The template has no acceptance tests yet. This one reaches the app as a black box,
// and starts the template's own browser driver.
it("the app is up, and the browser driver starts", async () => {
  const base = inject("acceptanceUrl");
  expect((await fetch(`${base}/health`)).ok).toBe(true);
  expect(await (await fetch(base)).text()).toContain(`id="app"`);
  const driver = await createDriver();
  await driver[Symbol.asyncDispose]();
});
