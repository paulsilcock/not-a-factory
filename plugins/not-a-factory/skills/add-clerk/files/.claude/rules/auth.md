---
paths:
  - "api/**"
  - "web/**"
  - "acceptance-tests/**"
---

# Authentication and authorisation

Two different things:
- **Authentication** says who the person is. Clerk does it, behind an adapter. Only `main.ts` and `infra/auth/` know about Clerk.
- **Authorisation** says what the person may do. It is business rules, so it belongs in the domain.

## How a request flows

1. The `authentication` middleware (`entrypoints/http/authentication.ts`) resolves `ClerkAuthentication` (`infra/auth/`, a tsyringe `@singleton()`) and runs its middleware. It sets `actor`, or answers 401 when nobody is signed in. Routes that anyone may call go before it in `app.ts`.
2. The route adds the actor to the command or query, with `signedInRoute` (`entrypoints/http/actor.ts`) on a `new Hono<ActorEnv>()` router: `...signedInRoute.json(UseCase, Schema, { input: (body, c) => ({ ...body, actor: c.get("actor") }) })`. Then `c.get("actor")` is an `Actor`, not `any`. Routes never decide what the actor may do.
3. The use case loads the person and their roles from our own data, keyed by `actor.id`, and lets the domain decide.
4. A broken permission rule throws a `DomainError` with a business name (`CannotApproveOwnClaim`, not `Forbidden`). Map it to 403 in `main.ts`.

## Rules

- **Never use Clerk types or calls outside `infra/auth/`.** The use cases know only `Actor`.
- **Roles live in Clerk's public metadata,** for example `{ "role": "manager" }`. It is a trade-off: it needs no table and no admin page, and it is in the session token, so the API reads it with no extra call; but the data is Clerk's, so a change of identity provider moves it. If people get roles through the app itself (an admin page, an invitation), keep roles in our own data instead, and ask the developer.
  - **The app never writes metadata.** In development, set it in the Clerk Dashboard (Users > the person > Metadata > Public). Acceptance tests set it with Clerk's Backend API.
  - **No metadata means the default** (for example `staff`): every field in `infra/auth/actor-metadata.ts` has a default. A person who just signed up needs nothing.
  - **The API checks it on every request** against `actor-metadata.ts`, typed as `ActorMetadata` (`use-cases/actor.ts`). Use cases read `actor.metadata.role`, typed. Clerk's types stay in `infra/auth/`.
  - **The rules stay in the domain:** "a manager can approve", "a manager cannot approve their own claim" are domain rules, tested like any other. The role is only an input.
  - A change in the Dashboard reaches the session token within about a minute.
- **Our data about a person** is created by the use case that first needs it, on that person's request. Use Clerk webhooks only for events that come without a request from the person (for example a user deleted in Clerk), with the `clerk-webhooks` skill.
- **The web app** shows its pages only to a signed-in person (`SignedInOnly` in `__root.tsx`); anyone else goes to `/sign-in`. A new public page goes in `publicPaths` (`components/signed-in-only.tsx`), with the developer's yes. Inside the app, it hides what the person cannot do, from what the API says. It never copies the rules.
- **Ask the developer** who may do each new thing, and whether a person may act on their own records (`domain-discovery`).

## Acceptance tests

- **Start signed in with `dsl.isSignedIn(name)`.** Call it again with another name to switch people. Sign-up, sign-in and sign-out through the pages are tested once, in `signing-in.test.ts`; never in other tests.
- `dsl.hasAnAccount(name)` makes a person who has an account and is signed out.
- **A person with a role:** add a DSL word in business terms that gives the metadata, for example `isSignedInAsManager(name)` calling `this.driver.loggedInAs(name, { role: "manager" })`. `isSignedIn(name)` gives no metadata: the default role. Calling it again for the same name with other metadata changes the person's metadata and signs them in again.
- `acceptance-tests/support/clerk.ts` holds what does not depend on the pages: test people, the run's set-up and clean-up, and the sign-in without a page. `acceptance-tests/driver/clerk-pages.ts` drives Clerk's forms and user button.
- **Two exceptions** to "drivers use only the app's public interfaces", both Clerk's own test interfaces, commented in `support/clerk.ts`:
  1. `dsl.isSignedIn(name)` signs in with Clerk's test helper `clerk.signIn`, with no page.
  2. Test users are created and deleted with Clerk's Backend API (`hasAnAccount`, and the clean-up).
- A name is the same person in every test of a file, and a different person in other files and runs. Test addresses have `+clerk_test` in them: Clerk sends them no email, and accepts the code `424242`.
- For each thing only some people may see or do, a test signs in as a person who may not, and confirms the app does not show it.
- Use a Clerk development instance for tests only, so the clean-up never touches people you use by hand. Its settings: the add-clerk skill, section 3.
- The browser driver uses the browser's own user agent (`userAgent: null`). Litmus's default user agent breaks Clerk's sign-in.
