import { createMiddleware } from "hono/factory";
import { container } from "tsyringe";

import type { ActorEnv } from "#api/entrypoints/http/actor.ts";
import { ClerkAuthentication } from "#api/infra/auth/clerk-authentication.ts";

/**
 * Sets `actor` for the routes after it, or answers 401 when nobody is signed
 * in. `app.ts` mounts it. Unit tests register a fake for `ClerkAuthentication`.
 */
export const authentication = createMiddleware<ActorEnv>((c, next) =>
  container.resolve(ClerkAuthentication).middleware(c, next),
);
