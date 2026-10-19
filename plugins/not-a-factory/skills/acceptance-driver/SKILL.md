---
name: acceptance-driver
description: Choose and write acceptance-test protocol drivers - the layer that translates DSL calls into the language of the system (browser actions, HTTP calls, CLI commands) and checks the outcomes. Use when a DSL word needs a driver method, when an acceptance test needs a page, route or command that does not exist yet, or when the system gets a new public interface.
---

# Acceptance-test protocol driver

## What a protocol driver is for

A protocol driver is a translator (Farley): it turns the language of the domain, spoken by the DSL, into the language of the system. The DSL fills in the details; the driver encodes the real interactions with the system. All the tests' knowledge of how the system works lives in the driver, so the DSL and the test cases stay independent of the implementation.

There is at least one driver for each public interface of the system. When an interface changes, only its driver changes. When a new interface is added, a new driver is added, and the test cases and the DSL stay the same.

## Choosing the driver

Acceptance tests reach the system through its public interfaces, so the choice depends on the system, not on what is easiest to test.

| The system's public interface | Driver |
|---|---|
| A browser UI (most full-stack apps) | **Browser driver** |
| A public HTTP API, used by other systems | HTTP driver |
| A UI that is still being built | HTTP driver for now; add the browser driver when the UI exists |
| A CLI app, or a CLI added for exploratory testing (handy for chat apps) | CLI driver |

If an HTTP API exists only to serve the app's own UI, it is not a public interface. Test through the UI.

**Several interfaces, one test suite.** A system with a web client and a mobile app has two drivers that implement the same driver interface. The test cases and the DSL do not change; `createDriver` picks the driver, for example from a `DRIVER` environment variable, and CI can run the suite once per driver in a matrix. Every test must pass through every driver.

## The driver interface

`api/test-acceptance/driver.ts` declares what a user can do, in business words. It mirrors the DSL: `dsl.loans.borrow` calls `driver.borrow`.

```ts
export interface AppDriver extends AsyncDisposable {
  borrow(loan: { member: string; book: string }): Promise<void>;
  confirmBorrowed(loan: { member: string; book: string }): Promise<void>;
  confirmRefused(refusal: { reason: "no copy available" }): Promise<void>;
}

export async function createDriver(): Promise<AppDriver> {
  const driver = new BrowserAppDriver({ baseUrl: inject("acceptanceUrl") });
  await driver.init(); // starts the browser; Litmus does not call it for you
  return driver;
}
```

In the test file: `acceptance(async () => new AppDsl(await createDriver()))`.

## Writing a driver

Extend the Litmus base driver for the channel: `BrowserDriver` from `@litmus-ts/test` (gives `this.page`), `HonoDriver` from `@litmus-ts/http/testing` (gives `this.client`, the typed client), or the CLI driver from `@litmus-ts/cli/testing`. They handle the lifecycle, such as starting and closing the browser.

- **Encode the real interaction:** the page, the request, the command. This is where the interface is designed, from the outside in.
- **Hold protocol state:** what the last action showed or returned, so that a `confirm...` method can check it. Business state stays in the system.
- **Check outcomes, and fail clearly:** a `confirm...` method throws an `Error` that says what was expected and what was found.
- **No business rules, defaults or aliasing.** The DSL does those, and the system decides.

## The browser driver

```ts
export class BrowserAppDriver extends BrowserDriver implements AppDriver {
  async borrow({ member, book }: { member: string; book: string }) {
    await this.page.goto("/loans/new");
    await this.page.getByLabel("Member").fill(member);
    await this.page.getByLabel("Book").fill(book);
    await this.page.getByRole("button", { name: "Borrow" }).click();
  }

  async confirmRefused({ reason }: { reason: "no copy available" }) {
    const message = this.page.getByRole("alert").filter({ hasText: messages[reason] });
    await message.waitFor().catch(() => {
      throw new Error(`Expected the message "${messages[reason]}" on the page`);
    });
  }
}
```

A flaky browser driver makes people give up on ATDD. Keep it stable:

- **Find elements the way a user does,** in this order: `getByRole` with the accessible name, then `getByLabel` for form fields, then `getByText` for content. Use `getByTestId` only as a last resort.
- **Never** use CSS classes, XPath or element positions. Tailwind and shadcn class names change all the time.
- **Stable selectors come from accessible markup:** real buttons, labels and headings, which also help users. If the driver cannot find something by role or label, fix the UI, not the selector.
- **Wait for what the user would see:** Playwright's locators wait by themselves (`click`, `fill`, `waitFor`). Never use a fixed wait or sleep (Farley).
- **Each test gets its own browser context.** `BrowserDriver` does this.
- **Group methods by page or area** once the driver grows.
- **Debug failures with Playwright traces and screenshots,** not by adding waits.
- Playwright is a peer dependency of `@litmus-ts/test`: add `playwright` to `api`'s dev dependencies, and install the browser with `pnpm --filter api exec playwright install chromium`.

## The HTTP driver

```ts
export class HttpAppDriver extends HonoDriver<AppType> implements AppDriver {
  #lastRefusal?: { code: string };

  async borrow(loan: { member: string; book: string }) {
    const res = await this.client.api.loans.$post({ json: loan });
    if (res.ok) return;
    if (res.status >= 500) throw new Error(`Borrowing failed: ${res.status}`);
    this.#lastRefusal = Refusal.parse(await res.json()); // Litmus: { code, message }
  }
}
```

It imports only the app's route types, never its code.

## When the system does not have it yet

In RED, the test must compile but fail. If the page, route or command does not exist yet, add a stub in the app: for an API route, the route and a use case whose `handle()` only throws; for a page, an empty route. The test then fails because the behaviour is missing.

If it is not yet clear how the system should be reached, the driver method may itself be a stub that throws. Then the driver is the first missing piece.

Source: Dave Farley, [ATDD how-to guide](https://continuous-delivery.co.uk/downloads/ATDD%20Guide%2026-03-21.pdf) and [Acceptance Testing for Continuous Delivery](https://edinburgh.bcs.org/events/2015/acceptance_testing_for_continuous_delivery.pdf).
