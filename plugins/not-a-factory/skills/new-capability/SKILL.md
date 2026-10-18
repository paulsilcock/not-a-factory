---
name: new-capability
description: Build a new user-facing capability outside in. Use when the developer asks for a new feature, page, endpoint or behaviour a user can see, or wants to continue one that has a failing acceptance test. Agrees the capability, writes ONE failing acceptance test in business language through the Litmus DSL and a driver, then repeats - name the missing piece, build it test-first with tdd-cycle (or let the developer build it), run the acceptance test again.
---

# New capability (outer loop)

> The commands and paths below are for a project created by not-a-factory. In any other project, use that project's own commands, layout and test setup (see its `CLAUDE.md` and `package.json`). The steps stay the same.

Follow `.claude/rules/workflow.md`: the mode (guided, pair or autonomous), one test at a time, and the working test list.

## 1. Find where we are

- Is there already an acceptance test for this capability? Run `pnpm test:acceptance` (needs `pnpm db:up`).
- What changed? `git status` and `git diff`. The developer may have written some of it.
- If an acceptance test for it already fails, go to step 5.

## 2. Agree the capability

Ask the developer, in one or two short questions:
- Who does it, and what do they want to get done?
- What do they see when it works?

Write the answer as one sentence: "A <user> can <do something> and sees <result>." Agree it before you write code.

Pick the smallest slice that a user would notice. Write the edge cases in the test list for later, as unit tests or a later acceptance test.

## 3. New words or rules?

If the capability has business words or rules that the code does not have yet, use the `model-domain` skill now, before the test. The test must use the agreed words.

## 4. Write ONE acceptance test

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

- Business words only. No URLs, JSON, status codes or `expect`.
- Write the test as if the DSL already has the methods. Then add only those methods.
- `has...` / `is...` methods set up the world. Verbs do the action. `confirm...` methods check the outcome.

Then add only what the test calls:

1. **DSL:** the area (`dsl/<area>.ts`) and the methods the test uses. Pass names through `this.context.alias(...)`. Register the area in `dsl.ts`.
2. **Driver interface:** the methods in `AppDriver` (`driver.ts`), in business words.
3. **HTTP driver:** implement them in `driver/http.ts` with `this.client`, the typed Hono RPC client. A `confirm...` method throws an `Error` with a clear message when the outcome is wrong.
4. **Routes the driver calls:** the typed client only compiles against routes that exist. Add each new route as a stub that throws, mounted in `app.ts`. The code then compiles, and the test fails at runtime.

Use the HTTP driver by default. A browser driver (`BrowserDriver` from `@litmus-ts/test`, with Playwright) is for capabilities about what a page shows or how a user moves through it. Ask the developer before you add one; Playwright needs `pnpm --filter api exec playwright install chromium`.

## 5. Loop until it passes

1. Run `pnpm test:acceptance`. It must fail because the capability is missing, not because the setup is broken.
2. Say in one sentence why it fails, and name the missing piece **and the component** that should hold it (see the component table in `tdd-cycle`).
3. Build that component:
   - In guided or autonomous mode, use the `tdd-cycle` skill.
   - In pair mode, ask whether the developer wants to build it. If they write the consumer (for example a use case) and name its parts (a repository, a domain model), build each part with `tdd-cycle`, driven by what the consumer needs.
4. Update the test list (see the workflow rule). New words or rules: `model-domain`. A second capability hiding inside this one: note it for a later `new-capability`.
5. Run `pnpm test:acceptance` again.

Follow the failure, not a fixed order. It is often route → use case → domain → repository, but not always.

## 6. When it passes

- Refactor the DSL and the driver as well as the code.
- Ask the developer whether the capability needs another acceptance test. Usually it does not; edge cases go in unit tests.
- If there is a UI, check it in the browser (`pnpm dev`).
- Suggest the `test-quality` skill for the tests of this capability.
