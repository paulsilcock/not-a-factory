import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import type { BrowserContext, Page } from "playwright";

import {
  ensureTestUser,
  testEmail,
  testPassword,
} from "#acceptance/clerk-test-users.ts";

// Each wait gets a limit well under the test's 30 seconds, so that a stuck
// step fails with what the page shows, not with "Test timed out".
const stepLimit = 10_000;

/**
 * Lets Clerk know that this browser is a test, so bot protection lets it in,
 * and limits every wait in this browser.
 */
export async function allowClerkTesting(context: BrowserContext) {
  context.setDefaultTimeout(stepLimit);
  await setupClerkTestingToken({ context });
}

/**
 * Starts the browser signed in as the person, with no sign-in steps.
 *
 * EXCEPTION 1 (see `clerk-test-users.ts`): `clerk.signIn` is Clerk's test
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

/**
 * Signs in on our sign-in page, as a person who has an account would.
 *
 * EXCEPTION 2 (see `clerk-test-users.ts`): the account is set up with Clerk's
 * Backend API first. The sign-in itself goes through our page.
 */
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
  const code = codeField(page);
  for (let step = 0; step < 3; step++) {
    const next = await Promise.any([
      password.waitFor().then(() => "password" as const),
      code.waitFor().then(() => "code" as const),
      signedInAs(page, email).then(() => "done" as const),
    ]).catch(() => stuck(page, `step ${step + 1} of signing in ${email}`));
    if (next === "done") return;
    if (next === "password") {
      await password.fill(testPassword(email));
      await continueButton(page).click();
      await password.waitFor({ state: "hidden" });
    } else {
      await enterCode(page, email);
    }
  }
  await signedInAs(page, email).catch(() =>
    stuck(page, `waiting for ${email} to be signed in`),
  );
}

// Clerk's code field. `autocomplete="one-time-code"` is the web standard for
// one-time codes, so it is steadier than the label's wording.
const codeField = (page: Page) =>
  page.locator('input[autocomplete="one-time-code"]');

// Clerk shows the code field before it has finished sending the code, and can
// clear what was typed in that moment. Its "Resend" countdown starts when the
// code has been sent, so wait for it before typing. If the field is cleared
// all the same, type the code again.
async function enterCode(page: Page, email: string) {
  const code = codeField(page);
  await page
    .getByText(/resend/i)
    .first()
    .waitFor()
    .catch(() => stuck(page, `waiting for Clerk to send the code to ${email}`));
  for (let attempt = 0; attempt < 3; attempt++) {
    await code.fill("424242");
    const moved = await Promise.any([
      code.waitFor({ state: "hidden", timeout: 3_000 }),
      signedInAs(page, email, 3_000),
    ]).then(
      () => true,
      () => false,
    );
    if (moved) return;
    if ((await code.inputValue().catch(() => "")) !== "") break;
  }
  await stuck(page, `entering the code for ${email}`);
}

const continueButton = (page: Page) =>
  page.getByRole("button", { name: "Continue", exact: true });

// Clerk can move to another page after the last step: wait until it has
// loaded again and shows the person as signed in.
async function signedInAs(page: Page, email: string, timeout = stepLimit) {
  await page.waitForFunction(
    (address) =>
      (globalThis as unknown as PageWindow).Clerk?.user?.primaryEmailAddress
        ?.emailAddress === address,
    email,
    { timeout },
  );
}

/** Fails with what the page shows: its address, and Clerk's error text. */
async function stuck(page: Page, what: string): Promise<never> {
  const errors = await page
    .locator(".cl-formFieldErrorText, .cl-alertText, [role='alert']")
    .allInnerTexts()
    .catch(() => []);
  const said = errors.filter(Boolean).join(" | ") || "no error shown";
  throw new Error(
    `Clerk is stuck ${what}, at ${page.url()}. Clerk says: ${said}`,
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
