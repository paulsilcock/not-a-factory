import { acceptance } from "@litmus-ts/test";

import { createDriver } from "#acceptance/driver.ts";
import { AppDsl } from "#acceptance/dsl.ts";

// Sign-up and sign-in through our own pages, without Clerk's test helper.
const { it } = acceptance(async () => new AppDsl(await createDriver()));

it("a new person signs up and is signed in", async ({ dsl }) => {
  await dsl.signsUp("Priya");

  await dsl.confirmSignedInAs("Priya");
});

it("a person with an account signs in", async ({ dsl }) => {
  await dsl.signsIn("Sam");

  await dsl.confirmSignedInAs("Sam");
});
