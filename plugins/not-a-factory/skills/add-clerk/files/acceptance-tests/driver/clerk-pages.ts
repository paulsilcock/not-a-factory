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
  const sent = codeSent(page);
  await step(page, "fill in the sign-up form", async () => {
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await continueButton(page).click();
  });
  await enterCode(page, sent);
  await leaves(page, "/sign-up");
}

export async function signInThroughPage(page: Page, name: string) {
  const { email, password } = testPerson(name);
  await page.goto("/sign-in");
  await step(page, "give the email address", async () => {
    await page.getByLabel("Email address").fill(email);
    await continueButton(page).click();
  });
  const sent = codeSent(page);
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
  if (codeAsked) await enterCode(page, sent);
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

// Clerk's server has sent a code: the answer to the browser's "prepare"
// request. Start waiting before the click that leads to the code page.
function codeSent(page: Page) {
  const sent = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/v1\/client\/sign_(ups|ins)\/[^/]+\/prepare_(verification|first_factor|second_factor)$/.test(
        new URL(response.url()).pathname,
      ) &&
      response.ok(),
  );
  // When Clerk asks for no code, nobody awaits it.
  sent.catch(() => {});
  return sent;
}

// Clerk shows the code field, and even its "Resend" countdown, before its
// server has sent the code; a code typed then is refused. So wait for the send.
async function enterCode(page: Page, sent: Promise<unknown>) {
  await step(page, "wait for Clerk to send the email code", () => sent);
  await step(page, "enter the email code", () =>
    codeField(page).pressSequentially(testCode),
  );
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
