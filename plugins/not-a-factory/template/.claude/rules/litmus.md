---
paths:
  - "api/**"
  - "acceptance-tests/**"
---

# Litmus

The API uses Litmus (`@litmus-ts/*`): `AggregateRoot`, `ValueObject`, `DomainError`, `CommandHandler`, `QueryHandler` (core); `routeHandler` and `serve` (http); `DrizzlePostgresRepository` and `DrizzleDbContext` (db); `Dsl`, `acceptance`, `BrowserDriver` (test); `HonoDriver` (http/testing).

- Dependency injection is tsyringe. **Every constructor parameter has an explicit `@inject(Token)`.** Tooling here does not emit decorator metadata, so implicit injection fails at runtime.
- Use the class as the token for classes. Use an exported `const` token only for interfaces.
- Do not register `@injectable()` or `@singleton()` classes by hand. Register only what you swap (fakes, adapters).
