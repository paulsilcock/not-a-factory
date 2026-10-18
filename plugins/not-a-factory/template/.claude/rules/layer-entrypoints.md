---
paths:
  - "api/src/entrypoints/**"
  - "api/src/app.ts"
---

# Entrypoints (HTTP)

- Routes are thin. Use `routeHandler` from `@litmus-ts/http`: `.json(UseCase, Schema)` to return data, `.noContent(UseCase, Schema)` for commands, `{ target: "query" }` or `{ target: "param" }` for GET input.
- No business logic and no database access in a route.
- One route file for each area (`entrypoints/http/orders.ts`), mounted in `app.ts` under `/api`. Chain the routes (`new Hono().get(...).post(...)`) so the Hono RPC types reach `AppType`.
- Map each `DomainError` class to a status code in `main.ts` (`serve(app, { errors })`). The default is 400.
- Do not add test-only routes.
- Usually the acceptance test covers routes. Add a route test only for HTTP-specific behaviour, such as status codes or input validation.
