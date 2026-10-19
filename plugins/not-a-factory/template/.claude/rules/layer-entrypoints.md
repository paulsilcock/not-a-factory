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
- **agent tools,** for an AI agent that uses the system.

## Every entrypoint

- **Thin.** Parse and check the input, get the use case from the container, call `handle()`, and convert the result or the `DomainError` back. No business logic and no database access.
- **One use case for each call.** If an entrypoint must call several, the flow is a use case of its own.
- **No test-only entrypoints.**
- **Tests:** usually the acceptance tests cover entrypoints. Write an entrypoint test only for behaviour of that channel, such as an HTTP status, input checks, or a message that is acknowledged or retried.

## A kind that Litmus does not support

Litmus gives helpers for HTTP only. For another kind, write a small adapter with the same shape: parse, call one use case, convert the result. Keep the library of that channel (a CLI parser, a queue client) inside the adapter. Start it from `main.ts`.

If the new entrypoint is a public interface, the acceptance tests need a driver for it: see the `acceptance-driver` skill.

## HTTP

- Use `routeHandler` from `@litmus-ts/http`: `.json(UseCase, Schema)` to return data, `.noContent(UseCase, Schema)` for commands, `{ target: "query" }` or `{ target: "param" }` for GET input.
- One route file for each area (`entrypoints/http/orders.ts`), mounted in `app.ts` under `/api`. Chain the routes (`new Hono().get(...).post(...)`) so the Hono RPC types reach `AppType`.
- Map each `DomainError` class to a status code in `main.ts` (`serve(app, { errors })`). The default is 400.
