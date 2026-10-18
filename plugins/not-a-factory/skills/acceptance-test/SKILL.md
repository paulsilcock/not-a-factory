---
name: acceptance-test
description: Write one acceptance test - an executable specification of one acceptance criterion, from the user's point of view - with Dave Farley's four layers (test case, DSL, protocol driver, system under test). Use when new-feature has picked an acceptance criterion, when adding DSL words or driver methods, when a test must stub an external service, or when adding a browser driver.
---

# Acceptance test

> The paths below are for a project created by not-a-factory. In any other project, use its own layout. The layers stay the same.

## Why

An acceptance test is an executable specification. It says what the system must do for a user, in the user's words, before any code exists. It guides the work until the criterion is met, and then it keeps checking the criterion after every later change.

## The four layers

| Layer | Says | Lives in | Must not contain |
|---|---|---|---|
| Test case | WHAT the user does and sees | `api/test-acceptance/<feature>.test.ts` | URLs, JSON, status codes, selectors, `expect` |
| DSL | The business words, shared by all test cases | `dsl.ts`, `dsl/<area>.ts` | Anything about how the system works |
| Protocol driver | HOW to talk to the system through one channel (HTTP, browser) | `driver.ts` (interface), `driver/http.ts` | Business decisions |
| System under test | The app, deployed like production: its Docker image, with Postgres | `Dockerfile`, `docker-compose.yml`, `global-setup.ts` | Test-only behaviour |

Each layer calls only the layer below it.

## 1. Write the test case

Write it as if the DSL already has every word you need. Invent the words now, and do not think about the implementation.

```ts
import { acceptance } from "@litmus-ts/test";
import { describe } from "vitest";

import { createDriver } from "./driver.ts";
import { AppDsl } from "./dsl.ts";

describe("borrowing books", () => {
  const { it } = acceptance(() => new AppDsl(createDriver()));

  it("a member can borrow a book that is on the shelf", async ({ dsl }) => {
  await dsl.books.isOnShelf({ title: "Dune" });
  await dsl.members.hasJoined({ name: "Ada" });
  await dsl.loans.borrow({ member: "Ada", book: "Dune" });
  await dsl.loans.confirmBorrowed({ member: "Ada", book: "Dune" });
  });
});
```

Check it two ways:
- **Could the least technical person who knows the business read it,** and agree that it is right?
- **Would it still make sense if the system were replaced** by something completely different with the same purpose, for example a person at a library desk? If not, it says how, not what.

Setup words (`is...`, `has...`) set up the world. Verbs do the action. `confirm...` words check the outcome.

## 2. Add the DSL words

The DSL makes tests easy to write. It is precise where a test needs precision, and fills in everything else.

```ts
export class BooksDsl {
  constructor(private readonly driver: AppDriver, private readonly context: DslContext) {}

  async isOnShelf({ title, author = "Any Author", copies = 1 }: { title: string; author?: string; copies?: number }) {
    await this.driver.putBookOnShelf({
      title: this.context.alias(title),
      author: this.context.alias(author),
      copies,
    });
  }
}
```

- **Optional parameters with defaults for nearly everything.** A test names only what matters to it.
- **Alias every name** with `this.context.alias(...)`. Each test then sees only its own data.
- Put common setup (a member who has joined, a book on the shelf) in the DSL, so tests share it.
- Add an area (`dsl/loans.ts`) when the first test needs it, and register it in `dsl.ts`.

## 3. Add the driver methods

1. **Interface:** add the methods to `AppDriver` in `driver.ts`. Mirror the DSL (`dsl.loans.borrow` calls `driver.borrow`), with every parameter filled in.
2. **HTTP driver:** implement them in `driver/http.ts` with `this.client`, the typed Hono RPC client. A `confirm...` method reads what the system returns and throws an `Error` with a clear message when the outcome is wrong.
3. **Routes:** the typed client compiles only against routes that exist. Add each new route as a stub that throws, mounted in `app.ts`. Everything then compiles, and the test fails at runtime.

The driver is the only place that knows how the system is reached. If the API changes, only the driver changes.

## 4. Run it

`pnpm test:acceptance` (needs Docker). It must fail because the behaviour is missing: the stub route throws, or a `confirm...` check fails. If it fails for any other reason, fix the test first.

## Isolation

- Each test starts from a running system that holds none of its data. Thanks to the aliases, tests can share one database and run in any order.
- Never use data that another test created. Never add reset or cleanup endpoints.
- The tests treat the app as a black box: they know only its address and, through the typed client, the shape of its API. They never import or run app code.
- `global-setup.ts` starts the app as production would: it builds the `Dockerfile`, starts it with Postgres as a separate Docker Compose project (`acceptance`), runs the migrations, and waits for `/health`. It removes the stack afterwards. Your development database is not touched.
- With `ACCEPTANCE_URL` set, the tests start nothing and use that address, for example a deployed environment.

## External services

When the app calls another system (email, payments), the test must not reach the real one.

1. Write a small stub of that service: an HTTP server that records what it receives. Run it as its own service in `docker-compose.yml` (profile `app`), and give its URL to the app through the same environment variable that production uses.
2. The driver asks the stub what it received, for example in `confirmConfirmationEmailSent`.
3. The stub is test code. The app does not know that it is talking to a stub.

## A browser driver

Add one when the criterion is about what a page shows or how a user moves through it. Ask the developer first.

- `driver/browser.ts` extends `BrowserDriver` from `@litmus-ts/test` and implements the same `AppDriver` interface, with Playwright. Install the browser with `pnpm --filter api exec playwright install chromium`.
- `createDriver` in `driver.ts` picks the driver, for example from an environment variable, so the same test cases run through either channel.

## Pitfalls

| Pitfall | Sign | Instead |
|---|---|---|
| How, not what | "fill in", "click", URLs or field names in the test | Words for the user's intent: `borrow`, `payByCard` |
| Test reaches inside | The test reads the database or the container | Only through the driver and public interfaces |
| Shared data | A test needs data from another test, or fails when run alone | Set up its own data through the DSL, with aliases |
| Fat test cases | Long setup in every test | Defaults and setup words in the DSL |
| Driver makes decisions | Business rules in `driver/http.ts` | The driver only translates and checks outcomes |
| Test-only app code | Reset endpoints, flags for tests | Stubs and aliases |

Source: Dave Farley, [Acceptance Test Driven Development how-to guide](https://continuous-delivery.co.uk/downloads/ATDD%20Guide%2026-03-21.pdf).
