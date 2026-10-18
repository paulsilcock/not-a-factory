---
name: next-capability
description: Start the next user-facing capability outside in. Use when the developer asks for a new feature, page, endpoint or behaviour a user can see, or when an acceptance test has just passed and it is time to pick the next thing. Writes ONE failing acceptance test in business language through the Litmus DSL and a driver, then hands over to tdd-cycle.
---

# Next capability (outer loop)

> The commands and paths below are for a project created by not-a-factory. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

## 1. Agree the capability

Ask the developer, in one or two short questions:
- Who does it, and what do they want to get done?
- What do they see when it works?

Write the answer as one sentence: "A <user> can <do something> and sees <result>." Agree it before you write code. If the answer has new business words or rules, use the `model-domain` skill first.

Pick the smallest slice that a user would notice. Leave the edge cases for later tests.

## 2. Write ONE acceptance test

File: `api/test-acceptance/<area>.test.ts`. Use the existing system, DSL and driver.

```ts
import { acceptance } from "@litmus-ts/test";
import { afterAll, beforeAll, describe } from "vitest";

import { createDriver } from "./driver.ts";
import { AppDsl } from "./dsl.ts";
import { type RunningSystem, startSystem } from "./system.ts";

describe("ordering", () => {
  let system: RunningSystem;
  beforeAll(async () => { system = await startSystem(); });
  afterAll(async () => { await system?.stop(); });

  const { it } = acceptance(() => new AppDsl(createDriver(system)));

  it("a customer sees their order after checkout", async ({ dsl }) => {
    await dsl.menu.hasItem({ name: "Flat white", price: 3.2 });
    await dsl.orders.place({ items: ["Flat white"] });
    await dsl.orders.confirmPlaced({ items: ["Flat white"] });
  });
});
```

Rules:
- Business words only. No URLs, JSON, status codes or `expect`.
- Write the test as if the DSL already has the methods. Then add only those methods.
- `has...` / `is...` methods set up the world. Verbs do the action. `confirm...` methods check the outcome.

## 3. Add only what the test calls

1. **DSL:** add the area (`dsl/<area>.ts`) and the methods the test uses. Pass names through `this.context.alias(...)`. Register the area in `dsl.ts`.
2. **Driver interface:** add the methods to `AppDriver` in `driver.ts`, in business words.
3. **HTTP driver:** implement them in `driver/http.ts` with `this.client` (the typed Hono RPC client). For a call the API does not have yet, write the call you want. The typecheck error then shows the first missing piece. `confirm...` methods throw an `Error` with a clear message when the outcome is wrong.

Use the HTTP driver by default. Use a browser driver (`BrowserDriver` from `@litmus-ts/test`, Playwright) only when the capability is about what the page shows or how the user moves through it. Ask the developer first; Playwright needs `pnpm --filter api exec playwright install chromium`.

## 4. Run it and read the failure

```sh
pnpm test:acceptance
```

The local Postgres must run (`pnpm db:up`). The test must fail because the capability is missing, not because the test setup is broken. Say in one sentence why it fails and what the first missing piece is.

## 5. Drop into the inner loop

Use the `tdd-cycle` skill for the first missing piece. Usually the order is route → use case → domain → repository, but follow the failure, not the list.

After each inner loop, run `pnpm test:acceptance` again. When it passes:
- Refactor the DSL and driver as well as the code.
- Ask the developer if the capability needs another acceptance test (usually not; edge cases go in unit tests).
- Check the app in the browser if there is a UI (`pnpm dev`).
