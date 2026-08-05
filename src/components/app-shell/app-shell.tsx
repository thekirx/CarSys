"use client";

import { useState } from "react";
import type { OrganizationAccessContext } from "@/features/permissions/types";
import { OrganizationProvider } from "@/components/app-shell/organization-provider";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppHeader } from "@/components/app-shell/app-header";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import { cn } from "@/lib/utils";

export function AppShell({ context, children }: { context: OrganizationAccessContext; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <OrganizationProvider value={context}>
      <div className={cn("app-frame", collapsed && "app-frame-collapsed")}>
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="app-main">
          <AppHeader onOpenMobile={() => setMobileOpen(true)} />
          <main className="page-content">{children}</main>
        </div>
        <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </OrganizationProvider>
  );
}
