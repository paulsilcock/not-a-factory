import { clerkMiddleware, getAuth } from "@clerk/hono";
import type { MiddlewareHandler } from "hono";
import { every } from "hono/combine";
import { createMiddleware } from "hono/factory";

import {
  type ActorEnv,
  notSignedIn,
} from "#api/entrypoints/http/authentication.ts";

/**
 * Authentication with Clerk: Clerk's middleware reads the session that the
 * web app sends, and the signed-in Clerk user becomes the actor. This is the
 * only API file that knows about Clerk.
 */
export function clerkAuthentication(keys: {
  secretKey: string;
  publishableKey: string;
}): MiddlewareHandler<ActorEnv> {
  return every(
    clerkMiddleware(keys),
    createMiddleware<ActorEnv>(async (c, next) => {
      const { userId } = getAuth(c);
      if (!userId) return notSignedIn(c);
      c.set("actor", { id: userId });
      await next();
    }),
  );
}
