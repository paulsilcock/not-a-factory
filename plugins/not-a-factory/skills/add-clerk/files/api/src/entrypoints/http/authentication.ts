import type { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { container } from "tsyringe";

import type { Actor } from "#api/use-cases/actor.ts";

/** Routes behind `authentication` read the signed-in person with `c.get("actor")`. */
export type ActorEnv = { Variables: { actor: Actor } };

/**
 * The token for the middleware that finds out who sent a request: it sets
 * `actor`, or answers with `notSignedIn` when nobody is signed in. `main.ts`
 * registers the real one (`infra/auth/`); unit tests register a fake.
 */
export const AUTHENTICATION = "Authentication";

/** Runs the registered authentication middleware. `app.ts` mounts it. */
export const authentication = createMiddleware<ActorEnv>((c, next) =>
  container.resolve<MiddlewareHandler<ActorEnv>>(AUTHENTICATION)(c, next),
);

/** The answer to a request from someone who is not signed in. */
export const notSignedIn = (c: Context) =>
  c.json({ code: "NOT_SIGNED_IN", message: "Sign in first" }, 401);
