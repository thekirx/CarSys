import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { loadApplicationShellData } from "@/components/app-shell/get-shell-data";
import { createShellNavigationItems } from "@/components/app-shell/navigation-items";
import { OrganizationProvider } from "@/components/app-shell/organization-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";
import { getVisibleNavigation } from "@/features/permissions/navigation";

export default async function ProtectedApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const context = await getRequiredAccessContext();
  const visibleNavigation = getVisibleNavigation(context);
  const shellData = await loadApplicationShellData(context);

  if (!shellData) {
    redirect("/access-unavailable");
  }

  const items = createShellNavigationItems(visibleNavigation);

  return (
    <OrganizationProvider {...shellData}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "13rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-50 -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none transition-transform focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to main content
        </a>
        <div className="hidden lg:block">
          <AppSidebar items={items} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader items={items} />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-5 lg:px-6 lg:py-6"
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
