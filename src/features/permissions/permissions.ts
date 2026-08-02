import type {
  OrganizationAccessContext,
  PermissionKey,
} from "@/features/permissions/types";

const isNonEmptyIdentifier = (value: string) =>
  value.length > 0 && value.trim() === value;

const hasValidContextIdentifiers = (context: OrganizationAccessContext) =>
  isNonEmptyIdentifier(context.organizationId) &&
  isNonEmptyIdentifier(context.userId);

export const hasPermission = (
  context: OrganizationAccessContext,
  key: PermissionKey,
) =>
  hasValidContextIdentifiers(context) && context.permissions.includes(key);

export const canAccessBranch = (
  context: OrganizationAccessContext,
  branchId: string,
) => {
  if (
    !hasValidContextIdentifiers(context) ||
    !isNonEmptyIdentifier(branchId)
  ) {
    return false;
  }

  if (context.scope === "organization") {
    return true;
  }

  return context.branchIds.some(
    (assignedBranchId) =>
      isNonEmptyIdentifier(assignedBranchId) && assignedBranchId === branchId,
  );
};
