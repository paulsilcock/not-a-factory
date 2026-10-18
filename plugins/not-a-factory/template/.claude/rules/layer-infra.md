---
paths:
  - "api/src/infra/**"
  - "api/drizzle/**"
  - "api/drizzle.config.ts"
---

# Infrastructure

- Tables are in `infra/db/schema.ts` (Drizzle). Export each table and add it to the `schema` object. Each aggregate table has `id`, `version`, `created_at`, `updated_at`.
- After you change the schema, run `pnpm db:generate` to make a migration, then `pnpm db:migrate`. Commit the generated SQL in `api/drizzle/`. Never edit a migration that is already committed.
- A repository extends `DrizzlePostgresRepository<Aggregate, typeof table>` from `@litmus-ts/db/drizzle/postgres`, implements `toPersistence`, and adds finders that the use cases need. Its constructor is `@inject(DrizzleDbContext) ctx: DrizzleDbContext`.
- Test a repository against PGlite with `setupTestDb({ schema })` from `@litmus-ts/db/drizzle/postgres/test`: save, load, and check that the loaded aggregate behaves the same.
- An adapter to another service implements an interface that this project owns. Give the use cases the interface, and give tests a fake.
- Read config (`process.env`) only in `main.ts` and pass values in.
