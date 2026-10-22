// Test users in the Clerk development instance.
//
// EXCEPTIONS to "drivers use only the app's public interfaces". Both call
// Clerk's Backend API with the secret key: Clerk is part of the system, and
// this is Clerk's own interface for tests.
// 1. `loggedInAs` signs in with a token from Clerk, not through our page.
// 2. Test users are created here (for `loggedInAs`, and before a test signs in
//    on our page), and deleted again: a development instance holds at most
//    100 users.
// Sign-up and sign-in themselves are tested through our pages.
import { randomUUID } from "node:crypto";

import { createClerkClient } from "@clerk/backend";

const clerk = () =>
  createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * One id for each test run, set by the global setup before the test workers
 * start, so that every worker sees it. It is in every test user's address.
 */
export function startRun() {
  process.env.CLERK_TEST_RUN = randomUUID().slice(0, 6);
}

// One id for each test file. With the run id, a name is the same person in
// every test of a file, and a different person in other files and runs.
const fileId = randomUUID().slice(0, 4);

/** The address of a test person: Clerk sends no email to `+clerk_test` ones. */
export function testEmail(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${process.env.CLERK_TEST_RUN}${fileId}+clerk_test@example.com`;
}

/** A strong password that the tests can work out again, for the sign-in page. */
export function testPassword(email: string) {
  return `Test-${Buffer.from(email).toString("base64url").slice(-16)}-9`;
}

/** Creates the test person in Clerk, unless they exist already. */
export async function ensureTestUser(email: string) {
  const found = await clerk().users.getUserList({ emailAddress: [email] });
  if (found.data.length > 0) return;
  await clerk().users.createUser({
    emailAddress: [email],
    password: testPassword(email),
  });
}

/**
 * Deletes test users: this run's users at the end of the run, and at the
 * start, any test user older than two hours (from a run that crashed).
 */
export async function deleteTestUsers(which: "this run" | "old") {
  const users = await clerk().users.getUserList({
    query: "+clerk_test",
    limit: 100,
  });
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const run = process.env.CLERK_TEST_RUN;
  for (const user of users.data) {
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    if (!email.endsWith("+clerk_test@example.com")) continue;
    const delete_ =
      which === "this run"
        ? Boolean(run) && email.includes(`-${run}`)
        : user.createdAt < twoHoursAgo;
    if (delete_) await clerk().users.deleteUser(user.id);
  }
}
