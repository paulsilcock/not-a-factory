import { acceptance } from "@litmus-ts/test";
import { describe } from "vitest";

import { createDriver } from "#acceptance/driver.ts";
import { AppDsl } from "#acceptance/dsl.ts";

const { it } = acceptance(async () => new AppDsl(await createDriver()));

describe("signing in", () => {
  it("a new person signs up and is signed in", async ({ dsl }) => {
    await dsl.signsUp("Ada");

    await dsl.confirmSignedInAs("Ada");
  });

  it("a person with an account signs in", async ({ dsl }) => {
    await dsl.hasAnAccount("Grace");

    await dsl.signsIn("Grace");

    await dsl.confirmSignedInAs("Grace");
  });

  it("a signed-in person signs out", async ({ dsl }) => {
    await dsl.isSignedIn("Alan");

    await dsl.signsOut();

    await dsl.confirmSignedOut();
    await dsl.confirmAskedToSignIn();
  });

  it("a person who is not signed in sees only the sign-in page", async ({
    dsl,
  }) => {
    await dsl.opensTheApp();

    await dsl.confirmAskedToSignIn();
  });

  it("a test can switch the signed-in person", async ({ dsl }) => {
    await dsl.isSignedIn("Edsger");

    await dsl.isSignedIn("Barbara");

    await dsl.confirmSignedInAs("Barbara");
  });
});
