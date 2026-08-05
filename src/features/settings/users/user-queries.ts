import type { OrganizationAccessContext } from "@/features/permissions/types";
import { demoUsers } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserManagementRecord = {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  role: string;
  roleCode: string;
  scope: string;
  branches: string;
  status: string;
};

export type InviteOption = { id: string; name: string };

export type UserManagementData = {
  users: UserManagementRecord[];
  roles: InviteOption[];
  branches: InviteOption[];
};

export async function getUserManagementData(context: OrganizationAccessContext): Promise<UserManagementData> {
  if (context.demoMode) {
    return {
      users: demoUsers.map((user) => ({ ...user, membershipId: user.id })),
      roles: [
        { id: "branch-manager", name: "Branch Manager" },
        { id: "sales-agent", name: "Sales Agent" },
        { id: "inventory-staff", name: "Inventory Staff" },
        { id: "viewer", name: "Viewer" },
      ],
      branches: [{ id: context.activeBranchId, name: context.activeBranchName }],
    };
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: memberships, error: membershipError }, { data: roles }, { data: branches }] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("id, user_id, role_id, status, scope")
      .eq("organization_id", context.organizationId)
      .order("created_at"),
    supabase
      .from("roles")
      .select("id, code, name")
      .eq("organization_id", context.organizationId)
      .order("name"),
    supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", context.organizationId)
      .eq("status", "active")
      .order("name"),
  ]);

  if (membershipError) throw new Error("Organization users could not be loaded.");

  const userIds = memberships?.map((membership) => membership.user_id) ?? [];
  const membershipIds = memberships?.map((membership) => membership.id) ?? [];
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, display_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string; email: string | null }> }),
    membershipIds.length
      ? supabase.from("membership_branches").select("membership_id, branch_id").in("membership_id", membershipIds)
      : Promise.resolve({ data: [] as Array<{ membership_id: string; branch_id: string }> }),
  ]);

  const roleById = new Map((roles ?? []).map((role) => [role.id, role]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const branchById = new Map((branches ?? []).map((branch) => [branch.id, branch.name]));
  const branchIdsByMembership = new Map<string, string[]>();
  for (const assignment of assignments ?? []) {
    const current = branchIdsByMembership.get(assignment.membership_id) ?? [];
    current.push(assignment.branch_id);
    branchIdsByMembership.set(assignment.membership_id, current);
  }

  const users = (memberships ?? []).map((membership) => {
    const profile = profileById.get(membership.user_id);
    const role = roleById.get(membership.role_id);
    const assignedNames = (branchIdsByMembership.get(membership.id) ?? [])
      .map((branchId) => branchById.get(branchId))
      .filter((name): name is string => Boolean(name));
    return {
      id: membership.user_id,
      membershipId: membership.id,
      name: profile?.display_name ?? "Pending user",
      email: profile?.email ?? "Invitation pending",
      role: role?.name ?? "Unknown role",
      roleCode: role?.code ?? "viewer",
      scope: membership.scope === "organization" ? "All branches" : "Assigned branches",
      branches: membership.scope === "organization" ? "All branches" : assignedNames.join(", ") || "No branch assigned",
      status: membership.status.charAt(0).toUpperCase() + membership.status.slice(1),
    };
  });

  return {
    users,
    roles: (roles ?? [])
      .filter((role) => role.code !== "owner")
      .map((role) => ({ id: role.id, name: role.name })),
    branches: (branches ?? []).map((branch) => ({ id: branch.id, name: branch.name })),
  };
}
