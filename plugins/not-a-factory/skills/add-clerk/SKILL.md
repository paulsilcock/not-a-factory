---
name: add-clerk
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/add-clerk.mjs)
description: Add sign-in with Clerk to a not-a-factory app. The API reads the signed-in person as a typed Actor (Clerk only in infra/auth/), the web app shows its pages only to a signed-in person, the sidebar gets Clerk's user button, and the acceptance tests sign up, sign in, sign out and switch people. Use when the developer asks for sign-in, sign-up, users or roles, and has chosen Clerk.
---

# Add Clerk

Clerk is part of the system: the web app uses Clerk's components directly. The API knows Clerk only in `infra/auth/clerk-authentication.ts`. Routes and use cases see only the `Actor`.

`new-app <name> --shell --auth clerk` runs this script for a new app. For an app that exists, follow the steps below.

## 1. Ask first

Show the developer this list, and wait for a yes:

```
I'll add sign-in with Clerk:
1. Packages: @clerk/hono (api), @clerk/react (web), @clerk/testing and @clerk/backend (acceptance tests).
2. API: every /api route needs a signed-in person. Routes pass a typed Actor to the use cases.
3. Web: /sign-in and /sign-up pages. A person who is not signed in sees only those two pages.
   With a sidebar: Clerk's user button in the sidebar footer (account, sign out), and no sidebar when signed out.
4. Acceptance tests: sign up, sign in, sign out, the sign-in page for a signed-out person, and fast sign-in and switching of people for every other test.
5. Docker, CI and .env.example get the Clerk keys.
You need a Clerk development instance used only for tests. The tests delete their own test users there.
Shall I go ahead?
```

Also suggest Clerk's own skills (`/plugin marketplace add clerk/skills`, then `/plugin install clerk@clerk-skills`): `clerk-custom-ui` to restyle the forms, `clerk-webhooks`.

## 2. Run the script

Commit or stash first, so that `git diff` shows only this change. Then, from the project root:

```sh
node ${CLAUDE_SKILL_DIR}/add-clerk.mjs
```

It adds the new files (never over existing ones), makes the edits, installs the packages and runs `pnpm lint:fix`. It is safe to run again: it skips what is done.
- **"Make these changes by hand":** an edit did not find its anchor, and the file is unchanged. Make the edit by hand; the script's source shows each one.
- **"Next: the app has no sidebar":** there is no `web/src/components/app-sidebar.tsx`, so the user button is at the top right of every page (`__root.tsx`). Ask the developer if they want an app shell. If yes, build it with a shadcn sidebar block (a floating sidebar that collapses to icons, as `new-app --shell` makes) with a `<SidebarFooter>`, take the user button out of `__root.tsx`, and run the script again: it puts the button in the sidebar footer.

## 3. Keys and Clerk instance settings

- Ask the developer for the test instance's keys (Clerk Dashboard > API keys), and to put them in `.env` themselves: `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY` (the same value), and `CLERK_SECRET_KEY`. Never read or print `.env`. Without the keys, the API does not start.
- In GitHub: the repository secrets `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- Railway or any other deployment: the same three variables, with that environment's own Clerk instance.

Tell the developer to set the instance like this. The tests drive Clerk's forms step by step, and the API reads the person's metadata from the session token.

Clerk Dashboard > User & authentication:
- **Email address:** on, required, used to sign in, verified at sign-up with an **email verification code** (not a link).
- **Password:** on.
- **First and last name:** on and required. Clerk shows the name fields on the sign-up form only when they are required.
- **Everything else off:** no username, phone number, social connections or passkeys. Each one adds a step to the forms.

Clerk Dashboard > Sessions > Customize session token, add this claim (and save):

```json
{ "metadata": "{{user.public_metadata}}" }
```

Without it, every request to `/api` fails with a message that says so.

Then the steps are fixed:
- **Sign-up** (`/sign-up`): first name, last name, email address and password, Continue; the email code, `424242`.
- **Sign-in** (`/sign-in`): email address, Continue; password, Continue. If Clerk asks for a code from a new device ("Client Trust"), the driver enters `424242`.

If the developer wants other settings, change `acceptance-tests/driver/clerk-pages.ts` to match, and run the tests.

## 4. Check

Run `pnpm typecheck`, `pnpm lint`, `pnpm knip`, `pnpm test:unit` and `pnpm test:acceptance` (the five tests in `acceptance-tests/signing-in.test.ts` must pass). Show the developer `git diff --stat`, and say what users will see: "people sign up at /sign-up and sign in at /sign-in; a person who is not signed in sees only those pages; every /api route needs a signed-in person; the user button in the sidebar opens the account and signs out".

## 5. Writing acceptance tests with sign-in

`.claude/rules/auth.md` has the rules. In short:

**Most tests start signed in, with no pages.** Sign-up and sign-in through the forms take seconds and are tested once, in `signing-in.test.ts`. Every other test signs in directly:

```ts
it("a member sees only their own claims", async ({ dsl }) => {
  await dsl.isSignedIn("Ada");
  await dsl.claims.submit({ amount: "12.50" });
  await dsl.isSignedIn("Grace"); // switches people: Ada is signed out first

  await dsl.claims.openList();

  await dsl.claims.confirmEmpty();
});
```

The DSL words that add-clerk gives:

| Word | What it does | How |
|---|---|---|
| `isSignedIn(name)` | The person is signed in, with the default role. Call it again with another name to switch people. | Clerk's test helper, no pages (exception 1) |
| `hasAnAccount(name)` | The person has an account, and is signed out. | Clerk's Backend API (exception 2) |
| `signsUp(name)` | Signs up through `/sign-up`, with the email code. | The forms |
| `signsIn(name)` | Signs in through `/sign-in`. | The forms |
| `signsOut()` | Signs out with the user button. | The user button |
| `opensTheApp()` | Opens the app's home page. | The page |
| `confirmSignedInAs(name)` / `confirmSignedOut()` | Checks who is signed in. | Clerk in the page |
| `confirmAskedToSignIn()` | The page is the sign-in form, with none of the app. | The page |

**Test people.** A name gives the same person in every test of a file, and a different person in other files and runs: `testPerson(name)` in `support/clerk.ts` makes the address and password. Every address has `+clerk_test` in it, so Clerk sends no email and accepts the code `424242`. Use the names in the test: never write an address or a password.

**What the user may see.** For each page or action that only some people may see, write a test that signs in as a person who may not, and confirms that the app does not show it (and that the API refuses it). The web app hides; the API decides (`auth.md`).

**When a sign-in step fails,** the error says where the page was and what Clerk said. Read it before you change anything. Each wait is at most 10 seconds (`allowClerkTesting`).

## 6. Roles (and other data about the person)

Only when the brief needs them. A role is Clerk public metadata, for example `{ "role": "manager" }`. The app never writes it. No metadata means the default role. The rules are in `auth.md`.

**1. The type** (`api/src/use-cases/actor.ts`):

```ts
export type ActorMetadata = { role: "staff" | "manager" };
```

**2. The check, with the default** (`api/src/infra/auth/actor-metadata.ts`):

```ts
export const actorMetadataSchema: z.ZodType<ActorMetadata, unknown> = z.object({
  role: z.enum(["staff", "manager"]).default("staff"),
});
```

If the two do not match, typecheck fails. If a person's metadata does not match the check (for example `"role": "boss"`), the request fails with an error that names the person.

**3. The rule, in the domain.** The use case gets `actor` (section 7 shows the route) and gives `actor.metadata.role` to the domain: "only a manager can approve a claim" is a domain rule with its own tests. The domain error (`OnlyManagersCanApprove`) maps to 403 in `main.ts`.

**4. The acceptance tests.** Add a DSL word in business terms:

```ts
/** A manager is signed in. */
async isSignedInAsManager(name: string) {
  await this.driver.loggedInAs(name, { role: "manager" });
}
```

`isSignedIn(name)` gives no metadata, so the person has the default role. The driver creates the test person with exactly the metadata given, or changes it, and signs them in again. Test both sides: a manager can, and staff cannot.

**5. The web app** hides what the person may not do. It asks the API (a query such as `GET /api/me` with its own use case), so the web app gets the same checked role, with its default, typed through the Hono client. It never reads Clerk's metadata itself.

**6. In development,** set a person's role in the Clerk Dashboard: Users > the person > Metadata > Public, `{ "role": "manager" }`. The session token carries it within about a minute; signing in again shows it at once.

## 7. The Actor in the API

A route behind sign-in passes the actor to its use case with `signedInRoute` (`entrypoints/http/actor.ts`), on a `new Hono<ActorEnv>()` router. There, `c.get("actor")` is an `Actor`; with the plain `routeHandler` it would be `any`.

```ts
export const claims = new Hono<ActorEnv>().post(
  "/",
  ...signedInRoute.noContent(SubmitClaim, SubmitClaimSchema, {
    input: (body, c) => ({ ...body, actor: c.get("actor") }),
  }),
);
```

The use case's command has `actor: Actor`: Clerk's user id, and the checked metadata (section 6). Our own data about the person is stored against the id.
