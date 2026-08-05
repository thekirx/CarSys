import type { OrganizationAccessContext, PermissionKey } from "@/features/permissions/types";

export const hasPermission = (context: OrganizationAccessContext, key: PermissionKey) =>
  context.permissions.includes(key);

export const canAccessBranch = (context: OrganizationAccessContext, branchId: string) =>
  context.scope === "organization" || context.branchIds.includes(branchId);

export const requirePermission = (context: OrganizationAccessContext, key: PermissionKey) => {
  if (!hasPermission(context, key)) throw new Error(`Missing required permission: ${key}`);
};
