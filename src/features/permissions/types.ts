export const permissionKeys = [
  "settings.manage",
  "users.manage",
  "modules.manage",
  "financials.view_sensitive",
  "vehicles.read",
  "vehicles.manage",
  "reports.read",
  "audit_logs.read",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
export type ModuleKey = "dealership" | "fleet_management" | "vehicle_rental";
export type OrganizationScope = "organization" | "assigned_branches";
export type DemoRole = "owner" | "branch-manager" | "sales-agent" | "inventory-staff" | "viewer";

export type OrganizationAccessContext = {
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleName: string;
  roleCode: DemoRole;
  scope: OrganizationScope;
  branchIds: string[];
  activeBranchId: string;
  activeBranchName: string;
  permissions: PermissionKey[];
  enabledModules: ModuleKey[];
  demoMode: boolean;
};

export type NavigationItem = {
  label: string;
  href: string;
  icon: "layout-dashboard" | "car-front" | "users" | "calendar" | "badge-dollar-sign" | "chart-no-axes-combined" | "settings";
  requiredPermission?: PermissionKey;
  requiredModule?: ModuleKey;
  children?: Array<{ label: string; href: string; requiredPermission?: PermissionKey }>;
};
