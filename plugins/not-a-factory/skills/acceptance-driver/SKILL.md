---
name: acceptance-driver
description: Choose and write acceptance-test protocol drivers - the layer that translates DSL calls into the language of the system (browser actions, HTTP calls, CLI commands, phone calls, messages) and checks the outcomes. Use when a DSL word needs a driver method, when an acceptance test needs a page, route or command that does not exist yet, or when the system gets a new public interface.
---

# Acceptance-test protocol driver

## What a protocol driver is for

A protocol driver is a translator (Farley): it turns the language of the domain, spoken by the DSL, into the language of the system. The DSL fills in the details; the driver encodes the real interactions with the system. All the tests' knowledge of how the system works lives in the driver, so the DSL and the test cases stay independent of the implementation.

## Choosing the driver

Acceptance tests reach the system through its public interfaces, so there is one driver for each public interface. The choice depends on the system, not on what is easiest to test.

| The system's public interface | Driver | Read |
|---|---|---|
| A browser UI (most full-stack apps) | Browser driver | `browser.md` |
| A public HTTP API, used by other systems | HTTP driver | `http.md` |
| A UI that is still being built | HTTP driver for now; add the browser driver when the UI exists | `http.md` |
| A CLI app, or a CLI added for exploratory testing (handy for chat apps) | CLI driver | |

These are examples, not a closed list. A system may need a phone driver to make calls, a WhatsApp driver to send messages, or an iOS driver for a mobile app. If an HTTP API exists only to serve the app's own UI, it is not a public interface: test through the UI.

**Several entrypoints, one test suite.** When a system has more than one entrypoint (adapter, in hexagonal terms), each gets its own driver, and all of them implement the same driver interface. The test cases and the DSL do not change. For example, a web client and a mobile app can share one suite; or, when a store front is replaced, the same tests check the new one before it goes live. `createDriver` picks the driver, for example from a `DRIVER` environment variable, and CI can run the suite once per driver in a matrix. Every test must pass through every driver.

## The driver interface

`acceptance-tests/driver.ts` declares what a user can do, in business words. It mirrors the DSL: `dsl.loans.borrow` calls `driver.borrow`.

```ts
export interface AppDriver extends AsyncDisposable {
  borrow(loan: { member: string; book: string }): Promise<void>;
  confirmBorrowed(loan: { member: string; book: string }): Promise<void>;
  confirmRefused(refusal: { reason: "no copy available" }): Promise<void>;
}

export async function createDriver(): Promise<AppDriver> {
  const driver = new BrowserAppDriver({ baseUrl: inject("acceptanceUrl") });
  await driver.init(); // Litmus base drivers need init(); acceptance() does not call it
  return driver;
}
```

In the test file: `acceptance(async () => new AppDsl(await createDriver()))`.

## Writing any driver

- **Use a Litmus base driver when it fits.** `BrowserDriver` (`@litmus-ts/test`) and `HonoDriver` (`@litmus-ts/http/testing`) handle the lifecycle, such as starting and closing a browser. Any other channel (a CLI, phone calls, messages, a mobile app) gets a driver written for it: any class that implements `AppDriver` and cleans up in `[Symbol.asyncDispose]()`.
- **Encode the real interaction.** This is where the interface is designed, from the outside in.
- **Hold protocol state** that a `confirm...` method needs. Business state stays in the system.
- **Fail clearly:** a `confirm...` method throws an `Error` that says what was expected and what was found.
- **No business rules, defaults or aliasing.** The DSL does those, and the system decides.

## When the system does not have it yet

In RED, the test must compile but fail. If the page, route or command does not exist yet, add a stub in the app: for an API route, the route and a use case whose `handle()` only throws; for a page, an empty route. The test then fails because the behaviour is missing.

If it is not yet clear how the system should be reached, the driver method may itself be a stub that throws. Then the driver is the first missing piece.

## Channel guides

- **Writing a browser driver? Read `browser.md` first.** It covers stable selectors and waiting, which decide whether the tests are reliable.
- **Writing an HTTP driver? Read `http.md` first.**

Source: Dave Farley, [ATDD how-to guide](https://continuous-delivery.co.uk/downloads/ATDD%20Guide%2026-03-21.pdf) and [Acceptance Testing for Continuous Delivery](https://edinburgh.bcs.org/events/2015/acceptance_testing_for_continuous_delivery.pdf).
