---
paths:
  - "web/**"
---

# Web client

- Routes are files in `web/src/routes/` (TanStack Router). Do not edit `routeTree.gen.ts`; it is generated.
- Call the API only through the typed client in `web/src/lib/api.ts` (Hono RPC, `hc<AppType>`). Do not write URLs or response types by hand.
- Server state uses TanStack Query (`useQuery`, `useMutation`). Keep local UI state in components.
- Components come from shadcn/ui (`pnpm dlx shadcn@latest add <name>` in `web/`). Use the `shadcn` skill. Do not hand-write a component that shadcn has.
- **A new app does not set up shadcn.** If `web/components.json` is missing, do not run `shadcn init` with defaults: the look (library, style, colour, font) is the developer's choice. Ask, then set it up as step 3 of the `new-feature` skill says.
- No business rules in the client. If the client needs a decision, the API makes it.
- **Breadcrumbs** (with the app shell): each route names itself with `staticData: { title }` in `createFileRoute`. A route with no title has no breadcrumb.
- **The app shell, the routes, the navigation and the look are the developer's decisions.** Ask before you add a route, a navigation entry or a layout. Build the shell and layouts with shadcn blocks, not by hand.
- Before you change TanStack code, load the matching Intent skill (see Skill Loading in `CLAUDE.md`).

## Testing the UI

Keep UI tests light. The acceptance tests (browser driver) exercise the UI. Before adding a UI test, check what they already cover.

- **Complex stateful logic in the client,** such as a React reducer, is built test-first, like any other component.
- **Component tests (TDD) only for complex, critical behaviour that other tests are unlikely to cover fully,** for example a virtualised data table with sorting and swappable columns. Often an off-the-shelf library is the better choice than building one.
- **Page-level tests** can check combinations that would be too slow as acceptance tests: render the page with the network stubbed (MSW), and check what the user sees. Write one only where the acceptance tests do not already cover it well. TDD is possible here, but often too much.
- **Test what the user sees and does,** by role and label, with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (`@testing-library/react`, already installed). Never test implementation details such as state or props. Never mock `fetch` or the API client; stub the network.
- **Snapshot tests** can catch obvious visual changes, but they fail on intentional changes too. Use them rarely.
