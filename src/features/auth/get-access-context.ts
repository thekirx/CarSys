import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createDemoAccessContext } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import type { DemoRole, ModuleKey, OrganizationAccessContext, PermissionKey } from "@/features/permissions/types";

const validDemoRoles = new Set<DemoRole>(["owner", "branch-manager", "sales-agent", "inventory-staff", "viewer"]);

export const getRequiredAccessContext = cache(async (): Promise<OrganizationAccessContext> => {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const selected = cookieStore.get("carsys_demo_role")?.value as DemoRole | undefined;
    return createDemoAccessContext(selected && validDemoRoles.has(selected) ? selected : "owner");
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/sign-in");

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, scope, role_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) redirect("/unauthorized");

  const organizationId = membership.organization_id;
  const [{ data: organization }, { data: role }, { data: rolePermissionRows }, { data: moduleRows }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", organizationId).single(),
    supabase.from("roles").select("name, code").eq("id", membership.role_id).single(),
    supabase.from("role_permissions").select("permission_id").eq("role_id", membership.role_id),
    supabase
      .from("organization_modules")
      .select("module_id")
      .eq("organization_id", organizationId)
      .eq("enabled", true),
  ]);

  const permissionIds = rolePermissionRows?.map((row) => row.permission_id) ?? [];
  const moduleIds = moduleRows?.map((row) => row.module_id) ?? [];

  const [{ data: permissionRows }, { data: enabledModuleRows }, { data: assignmentRows }] = await Promise.all([
    permissionIds.length
      ? supabase.from("permissions").select("key").in("id", permissionIds)
      : Promise.resolve({ data: [] as Array<{ key: string }> }),
    moduleIds.length
      ? supabase.from("modules").select("key").in("id", moduleIds)
      : Promise.resolve({ data: [] as Array<{ key: string }> }),
    membership.scope === "assigned_branches"
      ? supabase.from("membership_branches").select("branch_id").eq("membership_id", membership.id)
      : Promise.resolve({ data: [] as Array<{ branch_id: string }> }),
  ]);

  const assignedBranchIds = assignmentRows?.map((row) => row.branch_id) ?? [];
  let branchQuery = supabase
    .from("branches")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("name");

  if (membership.scope === "assigned_branches") {
    if (assignedBranchIds.length === 0) redirect("/unauthorized");
    branchQuery = branchQuery.in("id", assignedBranchIds);
  }

  const { data: branches } = await branchQuery;
  const firstBranch = branches?.[0];
  if (!firstBranch) redirect("/unauthorized");

  return {
    organizationId,
    organizationName: organization?.name ?? "Organization",
    userId: authData.user.id,
    userName: authData.user.user_metadata?.display_name ?? authData.user.email?.split("@")[0] ?? "User",
    userEmail: authData.user.email ?? "",
    roleName: role?.name ?? "Member",
    roleCode: (role?.code as DemoRole) ?? "viewer",
    scope: membership.scope as "organization" | "assigned_branches",
    branchIds: branches.map((branch) => branch.id),
    activeBranchId: firstBranch.id,
    activeBranchName: firstBranch.name,
    permissions: (permissionRows?.map((permission) => permission.key) ?? []) as PermissionKey[],
    enabledModules: (enabledModuleRows?.map((module) => module.key) ?? []) as ModuleKey[],
    demoMode: false,
  };
});
