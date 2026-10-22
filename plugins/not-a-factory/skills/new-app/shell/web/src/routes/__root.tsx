import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import "../styles.css";

// The sidebar saves whether it is open in the "sidebar_state" cookie (shadcn's
// sidebar does this). Read it back, so that a reload keeps it open or collapsed.
const sidebarOpen = () =>
  !document.cookie.split("; ").includes("sidebar_state=false");

export const Route = createRootRoute({
  component: RootComponent,
});

// The app shell: the sidebar, and the page beside it with the breadcrumbs.
function RootComponent() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen()}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <AppBreadcrumbs />
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </TooltipProvider>
  );
}
