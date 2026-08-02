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

export const moduleKeys = [
  "dealership",
  "fleet_management",
  "vehicle_rental",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

export type OrganizationAccessContext = Readonly<{
  organizationId: string;
  userId: string;
  scope: "organization" | "assigned_branches";
  branchIds: readonly string[];
  permissions: readonly PermissionKey[];
  enabledModules: readonly ModuleKey[];
}>;
