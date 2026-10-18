# Architecture

```
web/                    React app: TanStack Router, TanStack Query, shadcn/ui
api/src/
  domain/               business rules; no I/O, no framework
  use-cases/            one CommandHandler or QueryHandler per user intent
  entrypoints/http/     Hono routes; translate HTTP to a use case and back
  infra/                Postgres (Drizzle), repositories, adapters to other services
  app.ts                builds the Hono app; exports AppType for the web client
  main.ts               composition root: connects infrastructure, starts the server
api/test-acceptance/    acceptance tests, DSL, drivers
```

## Dependency direction

- `entrypoints` → `use-cases` → `domain`. `infra` implements what the use cases need.
- `domain` imports nothing from the other layers.
- Use cases do not know which entrypoint called them.
- Entrypoints are thin: parse input, call one use case, return the result. No business logic.
- Only `main.ts` (and the acceptance-test system bootstrap) decides which real or fake implementation is used.

## Litmus

The API uses Litmus (`@litmus-ts/*`): `AggregateRoot`, `ValueObject`, `DomainError`, `CommandHandler`, `QueryHandler` (core); `routeHandler` and `serve` (http); `DrizzlePostgresRepository` and `DrizzleDbContext` (db); `Dsl`, `acceptance`, drivers (test).

- Dependency injection is tsyringe. **Every constructor parameter has an explicit `@inject(Token)`.** Tooling here does not emit decorator metadata, so implicit injection fails at runtime.
- Use the class as the token for classes. Use an exported `const` token only for interfaces.
- Do not register `@injectable()` or `@singleton()` classes by hand. Register only what you swap (fakes, adapters).

## Finding things out

- Use the TypeScript language server (the `typescript-lsp` plugin) for definitions, references, types and JSDoc before you grep.
- For Litmus, read the JSDoc through the language server and the `.d.mts` files in `node_modules/@litmus-ts/*`. Do not guess an API.
- For TanStack libraries, use the TanStack Intent skills listed in `AGENTS.md`. For UI components, use the `shadcn` skill.

## Imports

- Inside `api`, use the `#api/*` import alias, not `../`.
- Inside `web`, use the `@/*` alias.
