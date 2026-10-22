// Clerk support for the acceptance tests: what does not depend on how the
// app's pages look. Driving the sign-up and sign-in pages is in
// driver/clerk-pages.ts.
//
// EXCEPTIONS to "drivers use only the app's public interfaces". Clerk is part
// of the system, and these are Clerk's own interfaces for tests:
// 1. `signInDirectly` signs in with a token from Clerk (`clerk.signIn`).
// 2. Test users are created and deleted with Clerk's Backend API: a
//    development instance holds at most 100 users.
import { randomUUID } from "node:crypto";

import { createClerkClient } from "@clerk/backend";
import {
  clerk,
  clerkSetup,
  setupClerkTestingToken,
} from "@clerk/testing/playwright";
import type { BrowserContext, Page } from "playwright";

const users = () =>
  createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users;

/** The global setup starts and finishes each run of the acceptance tests. */
export const clerkTestRun = {
  /** A run id for the test people's addresses, Clerk's testing token, and no users left from runs that crashed. */
  async start() {
    process.env.CLERK_TEST_RUN = randomUUID().slice(0, 6);
    await clerkSetup({ publishableKey: process.env.CLERK_PUBLISHABLE_KEY });
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    await deleteTestUsers((user) => user.createdAt < twoHoursAgo);
  },
  /** Deletes this run's test users. */
  async finish() {
    const run = `-${process.env.CLERK_TEST_RUN}`;
    await deleteTestUsers((user) => user.email.includes(run));
  },
};

// With the run id, a name is the same person in every test of a file, and a
// different person in other files and runs.
const fileId = randomUUID().slice(0, 4);

/**
 * A test person's address and password. Clerk sends no email to a
 * `+clerk_test` address, and accepts the code 424242 for it.
 */
export function testPerson(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const email = `${slug}-${process.env.CLERK_TEST_RUN}${fileId}+clerk_test@example.com`;
  const password = `Test-${Buffer.from(email).toString("base64url").slice(-16)}-9`;
  return { email, password };
}

/**
 * Lets the test browser past Clerk's bot protection, and limits every wait to
 * 10 seconds, well under the test's 30, so that a stuck step says where.
 */
export async function allowClerkTesting(context: BrowserContext) {
  context.setDefaultTimeout(10_000);
  await setupClerkTestingToken({ context });
}

/** Creates the test person in Clerk, unless they exist (exception 2). */
export async function ensureTestUser(name: string) {
  const { email, password } = testPerson(name);
  const found = await users().getUserList({ emailAddress: [email] });
  if (found.data.length === 0) {
    await users().createUser({ emailAddress: [email], password });
  }
}

/**
 * Signs the person in with no sign-in steps (exception 1). Whoever was signed
 * in before is signed out first, so a test can switch people at any point.
 */
export async function signInDirectly(page: Page, name: string) {
  await ensureTestUser(name);
  if (!page.url().startsWith("http")) await page.goto("/");
  if (await signedInEmail(page)) await clerk.signOut({ page });
  await clerk.signIn({ page, emailAddress: testPerson(name).email });
  await page.goto("/");
}

/** The address of the person signed in on the page, or `null`. */
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

async function deleteTestUsers(
  which: (user: { email: string; createdAt: number }) => boolean,
) {
  const found = await users().getUserList({ query: "+clerk_test", limit: 100 });
  for (const user of found.data) {
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    if (
      email.endsWith("+clerk_test@example.com") &&
      which({ email, createdAt: user.createdAt })
    ) {
      await users().deleteUser(user.id);
    }
  }
}

// The part of the browser's window that the functions run in the page use.
// The acceptance tests compile without the DOM types.
type PageWindow = {
  Clerk?: {
    loaded?: boolean;
    user?: { primaryEmailAddress?: { emailAddress: string } | null } | null;
  };
};
