---
paths:
  - "api/src/infra/repositories/**"
  - "api/src/use-cases/**"
---

# Repositories

A repository is an abstraction: think of it as an in-memory collection of one type of aggregate. It loads whole aggregates and saves them. How and where they are stored is hidden behind it.

- **One repository for each aggregate type,** and only for aggregates. Not for each table, and not for child entities.
- **Load and save the whole aggregate.** The aggregate keeps its rules; the repository never changes its state.
- **Finders only for what commands need,** named in business words: `findByName(member)`, not `findWhere(...)`.
- **Test it as a collection:** save an aggregate, load it, and check that it behaves the same. Then test each finder that a use case needs.

## Queries do not need repositories

A common pitfall is to use repositories for every read. Commands load an aggregate to change it. Queries only read, and often need data from several aggregates, in the shape a screen needs.

- **A query handler can read the database directly** (application layer), and return a plain result shaped for its consumer. It never changes data.
- Do not add finders, joins or display fields to a repository only to serve a query.
- Do not load several aggregates and join them in memory to build a result.
