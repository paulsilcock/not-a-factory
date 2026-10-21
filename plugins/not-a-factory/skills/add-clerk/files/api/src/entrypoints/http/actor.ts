import type { Context } from "hono";

import type { Actor } from "#api/use-cases/actor.ts";

/** Routes behind `authentication` read the signed-in person with `c.get("actor")`. */
export type ActorEnv = { Variables: { actor: Actor } };

/** The answer to a request from someone who is not signed in. */
export const notSignedIn = (c: Context) =>
  c.json({ code: "NOT_SIGNED_IN", message: "Sign in first" }, 401);
