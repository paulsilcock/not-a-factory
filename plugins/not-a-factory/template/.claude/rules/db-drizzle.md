---
paths:
  - "api/src/infra/db/**"
  - "api/src/infra/repositories/**"
  - "api/drizzle/**"
  - "api/drizzle.config.ts"
---

# Database: Postgres with Drizzle (the default stack)

This is the stack that the template starts with. The developer can replace it; the rules in `repositories.md` stay the same.

- Tables are in `infra/db/schema.ts`. Export each table and add it to the `schema` object. Each aggregate table has `id`, `version`, `created_at`, `updated_at`.
- After you change the schema, run `pnpm db:generate` to make a migration, then `pnpm db:migrate`. Commit the generated SQL in `api/drizzle/`. Never edit a migration that is already committed.
- A repository extends `DrizzlePostgresRepository<Aggregate, typeof table>` from `@litmus-ts/db/drizzle/postgres`, implements `toPersistence`, and adds the finders that the use cases need. Its constructor is `@inject(DrizzleDbContext) ctx: DrizzleDbContext`.
- A query handler that reads the database directly uses `DrizzleDbContext` too.
- Unit tests use PGlite (Postgres in memory) as a fake: `setupTestDb({ schema })` from `@litmus-ts/db/drizzle/postgres/test`.
