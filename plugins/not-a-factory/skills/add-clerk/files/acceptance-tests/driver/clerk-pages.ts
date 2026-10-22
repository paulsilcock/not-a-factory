// Drives Clerk's own sign-up and sign-in forms (<SignUp />, <SignIn />) and
// its user button (<UserButton />), as a person would.
//
// The steps follow the Clerk instance's settings (see the add-clerk skill,
// "Clerk instance settings"): an email address and a password, and an email
// code at sign-up. Clerk can also ask for a code at sign-in, from a new
// device ("Client Trust"); signInThroughPage enters it when it is asked.
// When the pages change (other settings, your own forms), change this file.
import type { Page } from "playwright";

import { testPerson } from "#acceptance/support/clerk.ts";

// Clerk sends no email to a +clerk_test address, and accepts this code for it.
const testCode = "424242";

export async function signUpThroughPage(page: Page, name: string) {
  const { email, password } = testPerson(name);
  await page.goto("/sign-up");
  await step(page, "fill in the sign-up form", async () => {
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await continueButton(page).click();
  });
  await enterCode(page);
  await leaves(page, "/sign-up");
}

export async function signInThroughPage(page: Page, name: string) {
  const { email, password } = testPerson(name);
  await page.goto("/sign-in");
  await step(page, "give the email address", async () => {
    await page.getByLabel("Email address").fill(email);
    await continueButton(page).click();
  });
  await step(page, "give the password", async () => {
    await page.getByRole("heading", { name: "Enter your password" }).waitFor();
    await page.getByLabel("Password", { exact: true }).fill(password);
    await continueButton(page).click();
  });
  const codeAsked = await Promise.race([
    codeField(page)
      .waitFor()
      .then(() => true),
    page
      .waitForURL((url) => !url.pathname.startsWith("/sign-in"))
      .then(() => false),
  ]).catch(() => false);
  if (codeAsked) await enterCode(page);
  await leaves(page, "/sign-in");
}

export async function signOutThroughPage(page: Page) {
  await step(page, "sign out with the user button", async () => {
    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page
      .getByRole("button", { name: "Open user menu" })
      .waitFor({ state: "detached" });
  });
}

/** The page is Clerk's sign-in form, with nothing of the app around it. */
export async function confirmOnSignInPage(page: Page) {
  await step(page, "see the sign-in form", async () => {
    await page.waitForURL((url) => url.pathname === "/sign-in");
    await page.getByRole("heading", { name: /^Sign in/ }).waitFor();
  });
  if (await page.getByRole("button", { name: "Open user menu" }).count()) {
    throw new Error(`The sign-in page at ${page.url()} shows the user button`);
  }
}

// The web standard for a one-time code field.
const codeField = (page: Page) =>
  page.locator('input[autocomplete="one-time-code"]');
const continueButton = (page: Page) =>
  page.getByRole("button", { name: "Continue", exact: true });

// Clerk shows the code field before it has sent the code, and can clear a
// code typed too early. The "Resend" countdown starts once the code is sent.
async function enterCode(page: Page) {
  await step(page, "enter the email code", async () => {
    await page.getByRole("button", { name: /Resend/ }).waitFor();
    await codeField(page).pressSequentially(testCode);
  });
}

// Clerk goes to the app once the person is signed in.
async function leaves(page: Page, path: string) {
  await step(page, `leave ${path} signed in`, () =>
    page.waitForURL((url) => !url.pathname.startsWith(path)),
  );
}

// A step that does not come fails with where the page is and what Clerk
// says, not with "Test timed out".
async function step(page: Page, what: string, action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    const said = await page
      .locator(".cl-formFieldErrorText, .cl-alertText")
      .allInnerTexts()
      .catch(() => []);
    throw new Error(
      `Could not ${what} at ${page.url()}. Clerk says: ${said.join(" / ") || "nothing"}. ${(error as Error).message.split("\n")[0]}`,
    );
  }
}
