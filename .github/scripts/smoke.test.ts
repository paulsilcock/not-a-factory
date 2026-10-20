import { expect, inject, it } from "vitest";

import { createDriver } from "#acceptance/driver.ts";

// The template has no acceptance tests, and Vitest skips its global setup when there are
// no test files. This test makes CI start the whole stack (image, Postgres, migrations),
// reach the app as a black box, and start the template's browser driver.
it("the app is up, and the browser driver starts", async () => {
  const base = inject("acceptanceUrl");
  expect((await fetch(`${base}/health`)).ok).toBe(true);
  expect(await (await fetch(base)).text()).toContain(`id="app"`);
  await using _driver = await createDriver();
});
