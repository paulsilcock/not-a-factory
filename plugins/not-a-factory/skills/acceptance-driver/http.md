# HTTP driver

Use the typed Hono client (`this.client`). The driver imports only the app's route types, never its code.

```ts
import { HonoDriver } from "@litmus-ts/http/testing";
import { z } from "zod";

import type { AppType } from "#api/app.ts";

// Litmus answers a refused action (a DomainError) with { code, message }.
const Refusal = z.object({ code: z.string(), message: z.string() });

export class HttpAppDriver extends HonoDriver<AppType> implements AppDriver {
  #lastRefusal?: { code: string };

  async borrow(loan: { member: string; book: string }) {
    const res = await this.client.api.loans.$post({ json: loan });
    if (res.ok) return;
    if (res.status >= 500) throw new Error(`Borrowing failed: ${res.status}`);
    this.#lastRefusal = Refusal.parse(await res.json());
  }

  async confirmRefused({ reason }: { reason: "no copy available" }) {
    const expected = refusalCodes[reason];
    if (this.#lastRefusal?.code !== expected) {
      throw new Error(`Expected a refusal (${expected}), got ${JSON.stringify(this.#lastRefusal)}`);
    }
  }
}
```

- An action that the system refuses is an outcome, not an error: keep the refusal for the `confirm...` method. Throw only for unexpected failures (5xx).
- The typed client compiles only against routes that exist. In RED, add the route as a stub (see "When the system does not have it yet" in `SKILL.md`).
- The client knows the validation-error body, but not Litmus's `{ code, message }` body for refusals, so parse that with zod.
