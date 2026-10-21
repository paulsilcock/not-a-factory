import { clerkMiddleware, getAuth } from "@clerk/hono";
import { every } from "hono/combine";
import { createMiddleware } from "hono/factory";
import { singleton } from "tsyringe";

import { type ActorEnv, notSignedIn } from "#api/entrypoints/http/actor.ts";

/**
 * Authentication with Clerk. Clerk's middleware reads the session that the web
 * app sends (with CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from the
 * environment), and the signed-in Clerk user becomes the actor. This is the
 * only API file that knows about Clerk.
 */
@singleton()
export class ClerkAuthentication {
  readonly middleware = every(
    clerkMiddleware(),
    createMiddleware<ActorEnv>(async (c, next) => {
      const { userId } = getAuth(c);
      if (!userId) return notSignedIn(c);
      c.set("actor", { id: userId });
      await next();
    }),
  );
}
