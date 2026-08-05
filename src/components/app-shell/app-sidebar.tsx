"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign, CalendarDays, CarFront, ChartNoAxesCombined, ChevronsLeft,
  ChevronsRight, LayoutDashboard, Settings, UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVisibleNavigation } from "@/features/permissions/navigation";
import { useOrganization } from "@/components/app-shell/organization-provider";
import type { NavigationItem } from "@/features/permissions/types";

const icons = {
  "layout-dashboard": LayoutDashboard,
  "car-front": CarFront,
  users: UsersRound,
  calendar: CalendarDays,
  "badge-dollar-sign": BadgeDollarSign,
  "chart-no-axes-combined": ChartNoAxesCombined,
  settings: Settings,
} satisfies Record<NavigationItem["icon"], typeof LayoutDashboard>;

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const context = useOrganization();
  const items = getVisibleNavigation(context);
  return (
    <aside className={cn("app-sidebar", collapsed && "app-sidebar-collapsed")}>
      <div className="sidebar-brand">
        <span className="brand-mark"><CarFront size={21} /></span>
        {!collapsed ? <span><strong>CarSys</strong><small>{context.organizationName}</small></span> : null}
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <p className="nav-section-label">{collapsed ? "" : "Workspace"}</p>
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`) || item.children?.some((child) => pathname === child.href);
          return (
            <div key={item.label} className="nav-family">
              <Link className={cn("sidebar-link", active && "sidebar-link-active")} href={item.href} title={collapsed ? item.label : undefined}>
                <Icon size={19} /><span>{item.label}</span>{active ? <i aria-hidden="true" /> : null}
              </Link>
              {!collapsed && active && item.children?.length ? (
                <div className="sidebar-subnav">
                  {item.children.map((child) => <Link key={child.href} className={cn(pathname === child.href && "active")} href={child.href}>{child.label}</Link>)}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {!collapsed ? <div className="system-status"><span className="status-dot" /><span><strong>All systems operational</strong><small>Last checked just now</small></span></div> : null}
        <button className="sidebar-collapse" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </aside>
  );
}
