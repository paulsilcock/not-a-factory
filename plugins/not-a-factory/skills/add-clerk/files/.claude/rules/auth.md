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

1. The `authentication` middleware (`entrypoints/http/authentication.ts`) runs the middleware registered for `AUTHENTICATION`: Clerk's (`infra/auth/clerk-authentication.ts`), registered in `main.ts` with tsyringe. It sets `actor`, or answers 401 when nobody is signed in. Routes that anyone may call go before it in `app.ts`.
2. The route adds the actor to the command or query: `input: (body, c) => ({ ...body, actor: c.get("actor") })`. Routes never decide what the actor may do.
3. The use case loads the person and their roles from our own data, keyed by `actor.id`, and lets the domain decide.
4. A broken permission rule throws a `DomainError` with a business name (`CannotApproveOwnClaim`, not `Forbidden`). Map it to 403 in `main.ts`.

## Rules

- **Never use Clerk types or calls outside `infra/auth/` and `main.ts`.** The use cases know only `Actor`.
- **Roles and permissions are our data,** not Clerk metadata. Then the rules are tested like any other rule, and the identity provider can change.
- **Our data about a person** is created by the use case that first needs it, on that person's request. Use Clerk webhooks only for events that come without a request from the person (for example a user deleted in Clerk), with the `clerk-webhooks` skill.
- **The web app** hides what the person cannot do, from what the API says. It never copies the rules.
- **Ask the developer** who may do each new thing, and whether a person may act on their own records (`domain-discovery`).

## Acceptance tests

- `dsl.isSignedIn(name)` starts the test signed in, with no sign-in steps. It uses Clerk's test helper `clerk.signIn`, and creates the test user with Clerk's Backend API. **This is the one exception** to "drivers use only the app's public interfaces"; the code says so where it happens.
- `signing-in.test.ts` tests sign-up and sign-in through our own pages, without that helper. Keep it.
- A name is the same person in every test of a file, and a different person in other files and runs: the address holds a run id and a file id.
- Test users have `+clerk_test` addresses: Clerk sends them no email, and accepts the code `424242`. The global setup deletes old test users, and its teardown deletes this run's users: a development instance holds at most 100 users.
- Use a Clerk development instance for tests only, so the clean-up never touches people you use by hand. Its keys go in `.env`, and in CI as the secrets `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- The browser driver uses the browser's own user agent (`userAgent: null`). Litmus's default user agent breaks Clerk's sign-in.
