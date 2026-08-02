import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  moduleKeys,
  permissionKeys,
  type ModuleKey,
  type OrganizationAccessContext,
  type PermissionKey,
} from "@/features/permissions/types";
import { getSafeInternalPath } from "@/features/auth/safe-redirect";

export const CURRENT_PATH_HEADER = "x-carsys-current-path";

const uuid = z.string().uuid();

const membershipSchema = z.object({
  id: uuid,
  organization_id: uuid,
  user_id: uuid,
  role_id: uuid,
  status: z.literal("active"),
  organization_scope: z.enum(["organization", "assigned_branches"]),
});

const rolePermissionSchema = z.object({
  organization_id: uuid,
  role_id: uuid,
  permission_key: z.string(),
});

const organizationModuleSchema = z.object({
  organization_id: uuid,
  is_enabled: z.boolean(),
  module_key: z.string(),
});

const membershipBranchSchema = z.object({
  organization_id: uuid,
  membership_id: uuid,
  branch_id: uuid,
});

const accessContextInputSchema = z.object({
  userId: uuid,
  memberships: z.array(membershipSchema),
  rolePermissions: z.array(rolePermissionSchema),
  organizationModules: z.array(organizationModuleSchema),
  membershipBranches: z.array(membershipBranchSchema),
});

const permissionKeySet = new Set<string>(permissionKeys);
const moduleKeySet = new Set<string>(moduleKeys);

const isPermissionKey = (key: string): key is PermissionKey =>
  permissionKeySet.has(key);

const isModuleKey = (key: string): key is ModuleKey => moduleKeySet.has(key);

export function mapOrganizationAccessContext(
  input: unknown,
): OrganizationAccessContext | null {
  const parsed = accessContextInputSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const selectedMembership = parsed.data.memberships
    .filter((membership) => membership.user_id === parsed.data.userId)
    .toSorted((left, right) =>
      `${left.organization_id}:${left.id}`.localeCompare(
        `${right.organization_id}:${right.id}`,
      ),
    )[0];

  if (!selectedMembership) {
    return null;
  }

  const permissions = parsed.data.rolePermissions
    .filter(
      (row) =>
        row.organization_id === selectedMembership.organization_id &&
        row.role_id === selectedMembership.role_id &&
        isPermissionKey(row.permission_key),
    )
    .map((row) => row.permission_key as PermissionKey);

  const enabledModules = parsed.data.organizationModules
    .filter(
      (row) =>
        row.organization_id === selectedMembership.organization_id &&
        row.is_enabled &&
        isModuleKey(row.module_key),
    )
    .map((row) => row.module_key as ModuleKey);

  const branchIds =
    selectedMembership.organization_scope === "organization"
      ? []
      : parsed.data.membershipBranches
          .filter(
            (row) =>
              row.organization_id === selectedMembership.organization_id &&
              row.membership_id === selectedMembership.id,
          )
          .map((row) => row.branch_id);

  return {
    organizationId: selectedMembership.organization_id,
    userId: selectedMembership.user_id,
    scope: selectedMembership.organization_scope,
    branchIds: [...new Set(branchIds)],
    permissions: [...new Set(permissions)],
    enabledModules: [...new Set(enabledModules)],
  };
}

type RequiredAccessContextOptions = Readonly<{
  allowMissingMembership?: boolean;
}>;

const relationKey = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return "key" in value ? value.key : undefined;
};

export async function getRequiredAccessContext(
  options: RequiredAccessContextOptions = {},
): Promise<OrganizationAccessContext | null> {
  const [{ createServerSupabaseClient }, requestHeaders] = await Promise.all([
    import("@/lib/supabase/server"),
    headers(),
  ]);
  const supabase = await createServerSupabaseClient();
  const currentPath = requestHeaders.get(CURRENT_PATH_HEADER);
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId =
    !claimsError && typeof claimsData?.claims.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (!userId) {
    const params = new URLSearchParams({
      next: getSafeInternalPath(currentPath),
    });
    redirect(`/sign-in?${params.toString()}`);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select(
      "id, organization_id, user_id, role_id, status, organization_scope",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("organization_id", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    if (
      options.allowMissingMembership &&
      currentPath === "/unauthorized"
    ) {
      return null;
    }
    redirect("/unauthorized");
  }

  const [rolePermissionsResult, modulesResult, branchesResult] =
    await Promise.all([
      supabase
        .from("role_permissions")
        .select(
          "organization_id, role_id, permission:permissions!inner(key)",
        )
        .eq("organization_id", membership.organization_id)
        .eq("role_id", membership.role_id),
      supabase
        .from("organization_modules")
        .select("organization_id, is_enabled, module:modules!inner(key)")
        .eq("organization_id", membership.organization_id)
        .eq("is_enabled", true),
      supabase
        .from("membership_branches")
        .select("organization_id, membership_id, branch_id")
        .eq("organization_id", membership.organization_id)
        .eq("membership_id", membership.id),
    ]);

  if (
    rolePermissionsResult.error ||
    modulesResult.error ||
    branchesResult.error
  ) {
    if (
      options.allowMissingMembership &&
      currentPath === "/unauthorized"
    ) {
      return null;
    }
    redirect("/unauthorized");
  }

  const context = mapOrganizationAccessContext({
    userId,
    memberships: [membership],
    rolePermissions: rolePermissionsResult.data.map((row) => ({
      organization_id: row.organization_id,
      role_id: row.role_id,
      permission_key: relationKey(row.permission),
    })),
    organizationModules: modulesResult.data.map((row) => ({
      organization_id: row.organization_id,
      is_enabled: row.is_enabled,
      module_key: relationKey(row.module),
    })),
    membershipBranches: branchesResult.data,
  });

  if (!context) {
    if (
      options.allowMissingMembership &&
      currentPath === "/unauthorized"
    ) {
      return null;
    }
    redirect("/unauthorized");
  }

  return context;
}
