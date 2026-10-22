import { QueryHandler } from "@litmus-ts/core";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { container } from "tsyringe";
import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";

import {
  type ActorEnv,
  notSignedIn,
  signedInRoute,
} from "#api/entrypoints/http/actor.ts";
import { authentication } from "#api/entrypoints/http/authentication.ts";
import { ClerkAuthentication } from "#api/infra/auth/clerk-authentication.ts";
import type { Actor } from "#api/use-cases/actor.ts";

// A stand-in for Clerk: it knows one signed-in person.
const fakeClerk = {
  middleware: createMiddleware<ActorEnv>(async (c, next) => {
    if (getCookie(c, "session") !== "ada") return notSignedIn(c);
    c.set("actor", { id: "user_ada" });
    await next();
  }),
};

// A use case that answers with the actor it was given.
class WhoAmI extends QueryHandler<{ actor: Actor }, Actor> {
  async handle({ actor }: { actor: Actor }) {
    return actor;
  }
}

const app = new Hono<ActorEnv>().use("/api/*", authentication).get(
  "/api/whoami",
  ...signedInRoute.json(WhoAmI, z.object({}), {
    target: "query",
    input: (_query, c) => {
      expectTypeOf(c.get("actor")).toEqualTypeOf<Actor>();
      return { actor: c.get("actor") };
    },
  }),
);

describe("routes behind sign-in", () => {
  beforeEach(() => {
    container.registerInstance(ClerkAuthentication, fakeClerk);
  });

  it("pass the signed-in person to the use case", async () => {
    const response = await app.request("/api/whoami", {
      headers: { cookie: "session=ada" },
    });
    expect(await response.json()).toEqual({ id: "user_ada" });
  });

  it("refuse a request from someone who is not signed in", async () => {
    const response = await app.request("/api/whoami");
    expect(response.status).toBe(401);
  });
});
