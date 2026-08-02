import { hasPermission } from "@/features/permissions/permissions";
import type {
  ModuleKey,
  OrganizationAccessContext,
  PermissionKey,
} from "@/features/permissions/types";

export type NavigationItem = Readonly<{
  key: string;
  label: string;
  href: `/${string}`;
  requiredModule: ModuleKey;
  requiredPermission: PermissionKey;
}>;

// This registry is route metadata for the Phase 1 dealership shell. Future
// Fleet and Rental modules remain module-settings upgrades, not navigation.
const navigationRegistry = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    requiredModule: "dealership",
    requiredPermission: "reports.read",
  },
  {
    key: "vehicle-inventory",
    label: "Vehicle Inventory",
    href: "/vehicles",
    requiredModule: "dealership",
    requiredPermission: "vehicles.read",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/reports",
    requiredModule: "dealership",
    requiredPermission: "reports.read",
  },
  {
    key: "company-settings",
    label: "Company Settings",
    href: "/settings/company",
    requiredModule: "dealership",
    requiredPermission: "settings.manage",
  },
  {
    key: "module-settings",
    label: "Module Settings",
    href: "/settings/modules",
    requiredModule: "dealership",
    requiredPermission: "modules.manage",
  },
  {
    key: "user-management",
    label: "User Management",
    href: "/settings/users",
    requiredModule: "dealership",
    requiredPermission: "users.manage",
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/audit-logs",
    requiredModule: "dealership",
    requiredPermission: "audit_logs.read",
  },
] as const satisfies readonly NavigationItem[];

export const getVisibleNavigation = (
  context: OrganizationAccessContext,
): readonly NavigationItem[] =>
  navigationRegistry
    .filter(
      (item) =>
        context.enabledModules.includes(item.requiredModule) &&
        hasPermission(context, item.requiredPermission),
    )
    .map((item) => ({ ...item }));
