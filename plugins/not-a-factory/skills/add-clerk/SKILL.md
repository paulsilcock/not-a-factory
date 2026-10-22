---
name: add-clerk
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/add-clerk.mjs)
description: Add sign-in with Clerk to a not-a-factory app. The API reads the signed-in person as an Actor (Clerk only in infra/auth/), the web app uses Clerk's components, and acceptance tests can start signed in. Use when the developer asks for sign-in, sign-up, users or roles, and has chosen Clerk.
---

# Add Clerk

Clerk is part of the system: the web app uses Clerk's components and hooks directly. The API knows Clerk only in `infra/auth/clerk-authentication.ts`, a tsyringe `@singleton()` that tsyringe resolves by itself. Routes and use cases see only the `Actor`.

## 1. Ask first

Show the developer this list, and wait for a yes:

```
I'll add sign-in with Clerk:
1. Install @clerk/hono (api), @clerk/react (web), @clerk/testing and @clerk/backend (acceptance tests).
2. API: ClerkAuthentication in infra/auth/ (a tsyringe singleton, no registration); every /api route needs a signed-in person.
3. Web: ClerkProvider, and /sign-in and /sign-up pages (move or restyle them as you like).
4. Acceptance tests: dsl.isSignedIn(name) starts a test signed in. After that, we write the sign-up and sign-in tests together, against your pages.
5. Docker, CI and .env.example get the Clerk keys.
You need a Clerk development instance used only for tests. The tests delete their own test users there.
Shall I go ahead?
```

Also suggest Clerk's own skills for Clerk itself (`/plugin marketplace add clerk/skills`, then `/plugin install clerk@clerk-skills`): `clerk-react-patterns`, `clerk-custom-ui`, `clerk-webhooks`.

## 2. Run the script

Commit or stash first, so that `git diff` shows only this change. Then, from the project root:

```sh
node ${CLAUDE_SKILL_DIR}/add-clerk.mjs
```

It adds the new files (never over existing ones), makes the edits, installs the packages and runs `pnpm lint:fix`. If it lists edits it could not make, make them by hand: the script's source shows each one.

## 3. Keys

- Ask the developer for the test instance's keys (Clerk Dashboard > API keys), and to put them in `.env` themselves: `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY` (the same value), and `CLERK_SECRET_KEY`. Never read or print `.env`.
- In GitHub: the repository secrets `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- Railway or any other deployment: the same three variables, with that environment's own Clerk instance.

## 4. Check

Run `pnpm typecheck`, `pnpm lint`, `pnpm knip`, `pnpm test:unit` and `pnpm test:acceptance`. Show the developer `git diff --stat`, and say what users will see: "every page under /api needs a signed-in person; people sign up at /sign-up and sign in at /sign-in".

## 5. Sign-up and sign-in acceptance tests

The script ships no code that drives the sign-up and sign-in pages: they are the app's own, and the developer can restyle them, replace Clerk's components, or change the Clerk instance's settings. Write these tests with the developer, with `new-feature` and `acceptance-test`, one at a time, against the real pages:

1. **Agree the criteria first,** for example "a new person signs up and is signed in", and "a person with an account signs in". Ask where the pages are and how they look.
2. **Test people.** `testPerson(name)` (`support/clerk.ts`) gives an address and a password. The address ends in `+clerk_test@example.com`: Clerk treats such an address as a test address, sends it no email, and accepts the verification code **`424242`** for it. So a test can sign up and pass Clerk's email check without a real inbox.
3. **The account for a sign-in test:** sign the person up through the sign-up page earlier in the same test, or create it with `ensureTestUser(name)`. That is exception 2: say so in a comment.
4. **Clerk's steps depend on the instance's settings.** After the email address, Clerk may ask for a password, then for a code: for a new address when signing up, or for a new device when signing in. Find out which steps your instance asks for by looking at the page, not by guessing.
5. **The code field:** find it by `input[autocomplete="one-time-code"]`, the web standard for one-time codes. Clerk shows it before it has finished sending the code, and can clear a code typed too early. Wait for its "Resend" countdown, which starts once the code is sent, then type `424242`.
6. **Limits and messages:** `allowClerkTesting` limits every wait to 10 seconds. When a step does not come, fail with the page's address and what the page shows (Clerk's error text), never with "Test timed out".
7. **Check the result** with `confirmSignedInAs(name)`.

## After that

Read `.claude/rules/auth.md`: roles are our data, permission rules are domain rules, and `dsl.isSignedIn` is the one place the tests use Clerk's test helper.
