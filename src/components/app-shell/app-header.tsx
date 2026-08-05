"use client";

import { usePathname } from "next/navigation";
import { Bell, Building2, Menu, Search } from "lucide-react";
import { UserMenu } from "@/components/app-shell/user-menu";
import { useOrganization } from "@/components/app-shell/organization-provider";

const titleByPath: Record<string, string> = {
  "/dashboard": "Dashboard", "/vehicles": "Vehicle Inventory", "/customers": "Customers",
  "/test-drives": "Test Drives", "/deals": "Sales & Deals", "/reports": "Reports",
  "/settings/company": "Company Settings", "/settings/modules": "Modules", "/settings/users": "Users & Access",
};

export function AppHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();
  const context = useOrganization();
  const title = titleByPath[pathname] ?? "CarSys";
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="mobile-menu-button" onClick={onOpenMobile} aria-label="Open navigation"><Menu size={20} /></button>
        <div><p className="breadcrumb">{context.organizationName} <span>/</span> {title}</p><h1>{title}</h1></div>
      </div>
      <div className="header-actions">
        <label className="header-search"><Search size={16} /><input aria-label="Search workspace" placeholder="Search stock, customer, deal…" /></label>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span>3</span></button>
        <button className="branch-chip"><Building2 size={15} /><span>{context.activeBranchName}</span></button>
        <UserMenu />
      </div>
    </header>
  );
}
