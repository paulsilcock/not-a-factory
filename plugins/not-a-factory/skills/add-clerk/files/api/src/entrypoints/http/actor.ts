import { createRouteHandler } from "@litmus-ts/http";
import type { Context } from "hono";

import type { Actor } from "#api/use-cases/actor.ts";

/** Routes behind `authentication` read the signed-in person with `c.get("actor")`. */
export type ActorEnv = { Variables: { actor: Actor } };

/**
 * `routeHandler` for routes behind sign-in. In `input`, `c.get("actor")` is
 * an `Actor`, not `any`, so the use case gets a typed actor:
 * `...signedInRoute.json(PlaceOrder, PlaceOrderSchema, { input: (body, c) => ({ ...body, actor: c.get("actor") }) })`
 * on a `new Hono<ActorEnv>()` router.
 * @public
 */
export const signedInRoute = createRouteHandler<ActorEnv>();

/** The answer to a request from someone who is not signed in. */
export const notSignedIn = (c: Context) =>
  c.json({ code: "NOT_SIGNED_IN", message: "Sign in first" }, 401);
