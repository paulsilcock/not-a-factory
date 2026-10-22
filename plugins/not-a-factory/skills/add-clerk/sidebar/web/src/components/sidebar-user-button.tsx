import { UserButton } from "@clerk/react";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

// Clerk's user button, in the sidebar footer, where shadcn's sidebar blocks
// put the user menu. It shows the signed-in person, and opens a menu with
// "Manage account" and "Sign out". Nobody signed in: it shows nothing.
export function SidebarUserButton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserButton
          showName
          appearance={{
            // "!": Clerk's own styles would win over Tailwind's otherwise.
            elements: {
              rootBox: "w-full! min-w-0!",
              userButtonTrigger:
                "w-full! min-w-0! justify-start! rounded-md! p-2! hover:bg-sidebar-accent! group-data-[collapsible=icon]:p-0!",
              userButtonBox:
                "min-w-0! flex-row-reverse! gap-2! text-sidebar-foreground!",
              userButtonOuterIdentifier:
                "truncate! p-0! text-sm! font-medium! group-data-[collapsible=icon]:hidden!",
            },
          }}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
