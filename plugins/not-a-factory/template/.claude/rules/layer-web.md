---
paths:
  - "web/**"
---

# Web client

- Routes are files in `web/src/routes/` (TanStack Router). Do not edit `routeTree.gen.ts`; it is generated.
- Call the API only through the typed client in `web/src/lib/api.ts` (Hono RPC, `hc<AppType>`). Do not write URLs or response types by hand.
- Server state uses TanStack Query (`useQuery`, `useMutation`). Keep local UI state in components.
- Components come from shadcn/ui (`pnpm dlx shadcn@latest add <name>` in `web/`). Use the `shadcn` skill. Do not hand-write a component that shadcn has.
- No business rules in the client. If the client needs a decision, the API makes it.
- Before you change TanStack code, load the matching Intent skill (see `AGENTS.md`).
- Test components by what the user sees and does (Testing Library: find by role and label, not by class or test ID).
