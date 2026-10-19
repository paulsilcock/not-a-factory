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

## Testing the UI

Keep UI tests light. The acceptance tests (browser driver) exercise the UI. Before adding a UI test, check what they already cover.

- **Complex stateful logic in the client,** such as a React reducer, is built test-first, like any other component.
- **Component tests (TDD) only for complex, critical behaviour that other tests are unlikely to cover fully,** for example a virtualised data table with sorting and swappable columns. Often an off-the-shelf library is the better choice than building one.
- **Page-level tests** can check combinations that would be too slow as acceptance tests: render the page with the network stubbed (MSW), and check what the user sees. Write one only where the acceptance tests do not already cover it well. TDD is possible here, but often too much.
- **Test what the user sees and does,** by role and label (Testing Library). Never test implementation details such as state or props. Never mock `fetch` or the API client; stub the network.
- **Snapshot tests** can catch obvious visual changes, but they fail on intentional changes too. Use them rarely.
