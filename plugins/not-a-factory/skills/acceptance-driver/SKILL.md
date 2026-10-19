---
name: acceptance-driver
description: Add or change acceptance-test protocol drivers - the layer that turns DSL calls into real interactions with the system (HTTP calls, browser actions) and checks the outcomes. Use when a DSL word needs a driver method, when an acceptance test needs a route or page that does not exist yet, or when adding a browser driver.
---

# Acceptance-test driver

## What a driver is for

A protocol driver translates the DSL's words into the system's own language, for one channel: HTTP, or a browser. It is the only part of the tests that knows how the system is reached. If the API changes, only the driver changes. If a channel is added, a new driver is added, and the test cases and the DSL stay the same.

## The interface

`api/test-acceptance/driver.ts` declares what a user can do, in business words. It **mirrors the DSL**: `dsl.loans.borrow` calls `driver.borrow`, with every value filled in.

```ts
export interface AppDriver extends AsyncDisposable {
  addBook(book: { title: string; author: string; copies: number }): Promise<void>;
  borrow(loan: { member: string; book: string }): Promise<void>;
  confirmBorrowed(loan: { member: string; book: string }): Promise<void>;
  confirmRefused(refusal: { reason: "no copy available" }): Promise<void>;
}
```

## The HTTP driver

`api/test-acceptance/driver/http.ts` implements the interface with `this.client`, the typed Hono client. It imports only the app's route types, never its code.

```ts
export class HttpAppDriver extends HonoDriver<AppType> implements AppDriver {
  #lastRefusal?: { code: string };

  async borrow(loan: { member: string; book: string }) {
    const res = await this.client.api.loans.$post({ json: loan });
    if (res.ok) return;
    if (res.status >= 500) throw new Error(`Borrowing failed: ${res.status}`);
    this.#lastRefusal = Refusal.parse(await res.json()); // Litmus: { code, message }
  }

  async confirmRefused({ reason }: { reason: "no copy available" }) {
    const expected = refusalCodes[reason];
    if (this.#lastRefusal?.code !== expected) {
      throw new Error(`Expected a refusal (${expected}), got ${JSON.stringify(this.#lastRefusal)}`);
    }
  }
}
```

- **Write the real interaction you want the system to offer.** This is where the API is designed, from the outside in.
- **Hold protocol state:** what the last action returned, so that a `confirm...` method can check it. Business state stays in the app.
- **Check outcomes, and fail clearly.** A `confirm...` method throws an `Error` that says what was expected and what was found. An action that fails unexpectedly also throws, with the status.
- **No business rules,** no defaults and no aliasing. The DSL does those, and the app decides.

## When the system does not have it yet

In RED, the typed client compiles only against routes that exist. For each route the driver needs, add a stub in the app: the route, and a use case whose `handle()` only throws. The stub fixes the API contract, and the test then fails because the behaviour is missing.

If it is not yet clear how the system should be reached, the driver method may itself be a stub that throws. Then the driver is the first missing piece.

## A browser driver

Add one only when a criterion is about what a page shows or how a user moves through it, and ask the developer first. It is `driver/browser.ts`: it extends `BrowserDriver` from `@litmus-ts/test`, uses Playwright, and implements the same `AppDriver` interface. `createDriver` in `driver.ts` picks the driver, so the same test cases can run through either channel.
