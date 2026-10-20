# Architecture

The design follows hexagonal architecture (ports and adapters), with plainer names. The application core (domain and use cases) has no infrastructure code, and does not know how the outside world talks to it.

| Hexagonal term | Our term |
|---|---|
| Application core | `domain/` and `use-cases/` |
| Driving adapters (the world calls the app) | `entrypoints/` |
| Driven adapters (the app calls the world) | `infra/` |
| Ports | Interfaces that the core owns, such as a repository or a payment gateway interface |

```
web/                    React app: TanStack Router, TanStack Query, shadcn/ui
api/src/
  domain/               business rules; no I/O, no framework
  use-cases/            one CommandHandler or QueryHandler per way the system is used
  entrypoints/          ways in: http/ now; later, for example, cli/, queues/, jobs/
  infra/                ways out: database, repositories, adapters to other services
  app.ts                builds the Hono app; exports AppType for the web client
  main.ts               composition root: connects infrastructure, starts the server
acceptance-tests/       acceptance tests for the whole system: test cases, DSL, drivers
```

## Dependency direction

- `entrypoints` → `use-cases` → `domain`. `infra` implements interfaces that the use cases own.
- `domain` imports nothing from the other layers.
- Use cases do not know which entrypoint called them.
- Entrypoints are thin: parse input, call one use case, return the result. No business logic.
- Only `main.ts` decides which real implementation is used. Tests swap infrastructure through configuration or fakes, never by editing app wiring.
- `acceptance-tests/` reaches the system only through its public interfaces. It never imports app code (type imports for the typed client are fine).

## Litmus

The API uses Litmus (`@litmus-ts/*`). How to use it, and the dependency-injection rules: `litmus.md`, which loads for files in `api/` and `acceptance-tests/`.

## Imports

- Inside `api`, use the `#api/*` import alias, not `../`.
- Inside `web`, use the `@/*` alias.
- Inside `acceptance-tests`, use the `#acceptance/*` alias.
