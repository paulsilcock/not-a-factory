import { z } from "zod";

import type { ActorMetadata } from "#api/use-cases/actor.ts";

/**
 * Checks Clerk's public metadata for the person, from the session token
 * (the `metadata` claim: see the add-clerk skill). Every field has a default,
 * so a person with no metadata yet, such as one who just signed up, gets the
 * defaults. Typed as `ActorMetadata`, so the two cannot drift apart.
 *
 * Example: `z.object({ team: z.string().default("none") })`.
 */
export const actorMetadataSchema: z.ZodType<ActorMetadata, unknown> = z.object(
  {},
);
