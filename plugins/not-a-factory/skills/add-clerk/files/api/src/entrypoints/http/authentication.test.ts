import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { container } from "tsyringe";
import { beforeEach, describe, expect, it } from "vitest";

import { type ActorEnv, notSignedIn } from "#api/entrypoints/http/actor.ts";
import { authentication } from "#api/entrypoints/http/authentication.ts";
import { ClerkAuthentication } from "#api/infra/auth/clerk-authentication.ts";

// A stand-in for Clerk: it knows one signed-in person.
const fakeClerk = {
  middleware: createMiddleware<ActorEnv>(async (c, next) => {
    if (getCookie(c, "session") !== "ada") return notSignedIn(c);
    c.set("actor", { id: "user_ada" });
    await next();
  }),
};

const app = new Hono<ActorEnv>()
  .use("/api/*", authentication)
  .get("/api/whoami", (c) => c.json(c.get("actor")));

describe("routes behind sign-in", () => {
  beforeEach(() => {
    container.registerInstance(ClerkAuthentication, fakeClerk);
  });

  it("know who the signed-in person is", async () => {
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
