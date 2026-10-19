---
paths:
  - "api/src/entrypoints/**"
  - "api/src/app.ts"
---

# Entrypoints

An entrypoint is a way into the system: a driving adapter, in hexagonal terms. It converts what comes from the outside world into a use-case call, and converts the result or error back. Users, other systems, schedulers and AI agents all reach the use cases through entrypoints.

Examples, by kind (one folder each in `entrypoints/`):
- **HTTP routes,** for the web app or a public API (`http/`, the only kind in the template);
- **CLI commands,** for operators, scripts or exploratory testing;
- **queue or event consumers,** for messages from other systems;
- **webhooks,** for calls from services such as a payment gateway;
- **scheduled jobs;**
- **domain event subscriptions,** for reactions inside the system (see below);
- **agent tools,** for an AI agent that uses the system.

## Every entrypoint

- **Thin.** Parse and check the input, get the use case from the container, call `handle()`, and convert the result or the `DomainError` back. No business logic and no database access.
- **One use case for each call.** If an entrypoint must call several, the flow is a use case of its own.
- **No test-only entrypoints.**
- **Tests:** usually the acceptance tests cover entrypoints. Write an entrypoint test only for behaviour of that channel, such as an HTTP status, input checks, or a message that is acknowledged or retried.

## A kind that Litmus does not support

Litmus gives helpers only for HTTP and for domain event subscriptions. For another kind, write a small adapter with the same shape: parse, call one use case, convert the result. Keep the library of that channel (a CLI parser, a queue client) inside the adapter. Start it from `main.ts`.

If the new entrypoint is a public interface, the acceptance tests need a driver for it: see the `acceptance-driver` skill.

## Domain event subscriptions

A domain event (`OrderPlaced`) is a fact that an aggregate records. Litmus publishes it after the save commits. A reaction to it is a use case, reached through a subscription, like any other entrypoint.

- Wire each reaction in `main.ts`: `registerDomainEventHandlers([[OrderPlaced, CloseCart, (event) => ({ cartId: event.cartId })]])` from `@litmus-ts/core/events`.
- The function that converts the event to the command is pure: no lookups, no I/O. If the reaction needs more data, the use case loads it.
- The reacting use case does not know about the event. HTTP or a CLI can call it too.
- Litmus runs the handlers in-process. A failing handler is logged and not retried, and the others still run. A reaction that must never be lost needs more, for example an outbox.

## HTTP

- Use `routeHandler` from `@litmus-ts/http`: `.json(UseCase, Schema)` to return data, `.noContent(UseCase, Schema)` for commands, `{ target: "query" }` or `{ target: "param" }` for GET input.
- One route file for each area (`entrypoints/http/orders.ts`), mounted in `app.ts` under `/api`. Chain the routes (`new Hono().get(...).post(...)`) so the Hono RPC types reach `AppType`.
- Map each `DomainError` class to a status code in `main.ts` (`serve(app, { errors })`). The default is 400.
