import { clerkMiddleware, getAuth } from "@clerk/hono";
import type { Context } from "hono";
import { every } from "hono/combine";
import { createMiddleware } from "hono/factory";
import { singleton } from "tsyringe";

import { type ActorEnv, notSignedIn } from "#api/entrypoints/http/actor.ts";
import { actorMetadataSchema } from "#api/infra/auth/actor-metadata.ts";

/**
 * Authentication with Clerk. Clerk's middleware reads the session that the web
 * app sends (with CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from the
 * environment), and the signed-in Clerk user becomes the actor, with their
 * public metadata from the session token, checked. This is the only API file
 * that knows about Clerk.
 */
@singleton()
export class ClerkAuthentication {
  readonly middleware = every(
    clerkMiddleware(),
    createMiddleware<ActorEnv>(async (c, next) => {
      const { userId, sessionClaims } = getAuth(c);
      if (!userId) return notSignedIn(c);
      if (!sessionClaims || !("metadata" in sessionClaims)) {
        return misconfigured(
          c,
          'The Clerk session token has no "metadata" claim. In the Clerk Dashboard, Sessions > Customize session token, add: {"metadata": "{{user.public_metadata}}"}',
        );
      }
      const metadata = actorMetadataSchema.safeParse(sessionClaims.metadata);
      if (!metadata.success) {
        return misconfigured(
          c,
          `The Clerk metadata of ${userId} does not match actor-metadata.ts: ${metadata.error.message}`,
        );
      }
      c.set("actor", { id: userId, metadata: metadata.data });
      await next();
    }),
  );
}

// A set-up mistake, not the person's: log it, and say it in the answer.
function misconfigured(c: Context, message: string) {
  console.error(message);
  return c.json({ code: "AUTH_MISCONFIGURED", message }, 500);
}
