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

// This registry is route metadata for the upcoming application shell. Fleet and
// Rental entries remain invisible until their future modules are enabled; this
// policy layer does not create or imply that their routes are implemented.
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
    key: "fleet-management",
    label: "Fleet Management",
    href: "/fleet-management",
    requiredModule: "fleet_management",
    requiredPermission: "vehicles.read",
  },
  {
    key: "vehicle-rental",
    label: "Vehicle Rental",
    href: "/vehicle-rental",
    requiredModule: "vehicle_rental",
    requiredPermission: "vehicles.read",
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
