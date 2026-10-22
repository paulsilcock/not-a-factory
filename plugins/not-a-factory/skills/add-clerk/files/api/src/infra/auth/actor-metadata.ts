import { z } from "zod";

import type { ActorMetadata } from "#api/use-cases/actor.ts";

/**
 * Checks Clerk's public metadata for the person, from the session token
 * (the `metadata` claim: see the add-clerk skill). Give every field a default:
 * no metadata means the default, so a person who just signed up needs none.
 * Typed as `ActorMetadata`, so the two cannot drift apart.
 *
 * Example: `z.object({ role: z.enum(["staff", "manager"]).default("staff") })`.
 */
export const actorMetadataSchema: z.ZodType<ActorMetadata, unknown> = z.object(
  {},
);
