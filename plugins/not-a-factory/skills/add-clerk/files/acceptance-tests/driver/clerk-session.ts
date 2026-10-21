import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import type { BrowserContext, Page } from "playwright";

import {
  ensureTestUser,
  testEmail,
  testPassword,
} from "#acceptance/clerk-test-users.ts";

/** Lets Clerk know that this browser is a test, so bot protection lets it in. */
export async function allowClerkTesting(context: BrowserContext) {
  await setupClerkTestingToken({ context });
}

/**
 * Starts the browser signed in as the person, with no sign-in steps.
 *
 * EXCEPTION (see `clerk-test-users.ts`): `clerk.signIn` is Clerk's test
 * helper. It asks Clerk's Backend API for a sign-in token, so it does not go
 * through our sign-in page. The tests in `signing-in.test.ts` check that page.
 */
export async function signInDirectly(page: Page, name: string) {
  const email = testEmail(name);
  await ensureTestUser(email);
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
}

/** Signs up on our sign-up page, as a new person would. */
export async function signUpOnPage(page: Page, name: string) {
  const email = testEmail(name);
  await page.goto("/sign-up");
  await page.getByLabel(/email address/i).fill(email);
  const password = page.getByLabel(/^password$/i);
  await password.fill(testPassword(email));
  await continueButton(page).click();
  await password.waitFor({ state: "hidden" }); // the form has gone
  await finishClerkSteps(page, email);
}

/** Signs in on our sign-in page, as a person who has an account would. */
export async function signInOnPage(page: Page, name: string) {
  const email = testEmail(name);
  await ensureTestUser(email);
  await page.goto("/sign-in");
  await page.getByLabel(/email address/i).fill(email);
  await continueButton(page).click();
  await finishClerkSteps(page, email);
}

/** The email address of the signed-in person, or `null`. */
export async function signedInEmail(page: Page) {
  await page.waitForFunction(
    () => (globalThis as unknown as PageWindow).Clerk?.loaded,
  );
  return page.evaluate(
    () =>
      (globalThis as unknown as PageWindow).Clerk?.user?.primaryEmailAddress
        ?.emailAddress ?? null,
  );
}

export { testEmail };

// Clerk then asks for a password, a code for a new address or device, or
// nothing more. The steps depend on the instance's settings. Clerk accepts the
// code 424242 for `+clerk_test` addresses.
async function finishClerkSteps(page: Page, email: string) {
  const password = page.getByLabel(/^password$/i);
  const code = page.getByLabel(/verification code/i);
  for (let step = 0; step < 3; step++) {
    const next = await Promise.race([
      quiet(password.waitFor().then(() => "password" as const)),
      quiet(code.waitFor().then(() => "code" as const)),
      quiet(signedInAs(page, email).then(() => "done" as const)),
    ]);
    if (next === "done") return;
    if (next === "password") {
      await password.fill(testPassword(email));
      await continueButton(page).click();
      await password.waitFor({ state: "hidden" });
    } else {
      await code.fill("424242");
      await code.waitFor({ state: "hidden" });
    }
  }
  await signedInAs(page, email);
}

const continueButton = (page: Page) =>
  page.getByRole("button", { name: "Continue", exact: true });

// A wait that loses the race above can fail later, when the page has moved
// on. That failure means nothing, so it is ignored.
const quiet = <T>(wait: Promise<T>) =>
  wait.catch(() => new Promise<T>(() => {}));

// Clerk can move to another page after the last step: wait until it has
// loaded again and shows the person as signed in.
async function signedInAs(page: Page, email: string) {
  await page.waitForFunction(
    (address) =>
      (globalThis as unknown as PageWindow).Clerk?.user?.primaryEmailAddress
        ?.emailAddress === address,
    email,
  );
}

// The part of the browser's window that the functions run in the page use.
// The acceptance tests compile without the DOM types.
type PageWindow = {
  Clerk?: {
    loaded?: boolean;
    user?: { primaryEmailAddress?: { emailAddress: string } | null } | null;
  };
};
