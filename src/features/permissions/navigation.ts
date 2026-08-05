import type { NavigationItem, OrganizationAccessContext } from "@/features/permissions/types";
import { hasPermission } from "@/features/permissions/permissions";

const navigationRegistry: readonly NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { label: "Vehicle Inventory", href: "/vehicles", icon: "car-front", requiredPermission: "vehicles.read", requiredModule: "dealership" },
  { label: "Customers", href: "/customers", icon: "users", requiredPermission: "vehicles.read", requiredModule: "dealership" },
  { label: "Test Drives", href: "/test-drives", icon: "calendar", requiredPermission: "vehicles.read", requiredModule: "dealership" },
  { label: "Sales & Deals", href: "/deals", icon: "badge-dollar-sign", requiredPermission: "vehicles.read", requiredModule: "dealership" },
  { label: "Reports", href: "/reports", icon: "chart-no-axes-combined", requiredPermission: "reports.read", requiredModule: "dealership" },
  {
    label: "Settings",
    href: "/settings/company",
    icon: "settings",
    requiredPermission: "settings.manage",
    children: [
      { label: "Company", href: "/settings/company", requiredPermission: "settings.manage" },
      { label: "Modules", href: "/settings/modules", requiredPermission: "modules.manage" },
      { label: "Users & access", href: "/settings/users", requiredPermission: "users.manage" },
    ],
  },
] as const;

export function getVisibleNavigation(context: OrganizationAccessContext): NavigationItem[] {
  return navigationRegistry.flatMap((item) => {
    if (item.requiredPermission && !hasPermission(context, item.requiredPermission)) return [];
    if (item.requiredModule && !context.enabledModules.includes(item.requiredModule)) return [];
    const children = item.children?.filter((child) => !child.requiredPermission || hasPermission(context, child.requiredPermission));
    return [{ ...item, children }];
  });
}
