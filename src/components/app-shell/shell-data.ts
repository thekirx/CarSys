import { z } from "zod";

import type { OrganizationAccessContext } from "@/features/permissions/types";

const uuid = z.string().uuid();
const displayText = z.string().trim().min(1);

const accessContextSchema = z.object({
  organizationId: uuid,
  userId: uuid,
  scope: z.enum(["organization", "assigned_branches"]),
  branchIds: z.array(uuid),
});

const authUserSchema = z.object({
  id: uuid,
  email: z.string().email(),
});

const profileSchema = z.object({
  id: uuid,
  display_name: displayText,
});

const organizationSchema = z.object({
  id: uuid,
  company_name: displayText,
  is_active: z.literal(true),
});

const membershipSchema = z.object({
  id: uuid,
  organization_id: uuid,
  user_id: uuid,
  role_id: uuid,
  status: z.literal("active"),
  organization_scope: z.enum(["organization", "assigned_branches"]),
});

const roleSchema = z.object({
  id: uuid,
  organization_id: uuid,
  name: displayText,
});

const branchSchema = z.object({
  id: uuid,
  organization_id: uuid,
  name: displayText,
  is_primary: z.boolean(),
  is_active: z.literal(true),
});

const shellRuntimeInputSchema = z.object({
  context: accessContextSchema,
  authUser: authUserSchema,
  profile: profileSchema,
  organization: organizationSchema,
  membership: membershipSchema,
  role: roleSchema,
  branches: z.array(branchSchema),
});

export type ShellBranch = Readonly<{
  id: string;
  name: string;
  isPrimary: boolean;
}>;

export type ApplicationShellData = Readonly<{
  organization: Readonly<{ id: string; name: string }>;
  user: Readonly<{
    displayName: string;
    email: string;
    roleName: string;
  }>;
  scope: OrganizationAccessContext["scope"];
  branches: readonly ShellBranch[];
}>;

export function mapApplicationShellData(
  input: unknown,
): ApplicationShellData | null {
  const parsed = shellRuntimeInputSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const {
    context,
    authUser,
    profile,
    organization,
    membership,
    role,
    branches,
  } = parsed.data;

  if (
    authUser.id !== context.userId ||
    profile.id !== context.userId ||
    organization.id !== context.organizationId ||
    membership.organization_id !== context.organizationId ||
    membership.user_id !== context.userId ||
    membership.organization_scope !== context.scope ||
    role.id !== membership.role_id ||
    role.organization_id !== context.organizationId
  ) {
    return null;
  }

  const assignedBranchIds = new Set(context.branchIds);
  const seenBranchIds = new Set<string>();

  for (const branch of branches) {
    if (
      branch.organization_id !== context.organizationId ||
      seenBranchIds.has(branch.id) ||
      (context.scope === "assigned_branches" &&
        !assignedBranchIds.has(branch.id))
    ) {
      return null;
    }

    seenBranchIds.add(branch.id);
  }

  const safeBranches = branches
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      isPrimary: branch.is_primary,
    }))
    .toSorted((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      return (
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
      );
    });

  return {
    organization: {
      id: organization.id,
      name: organization.company_name,
    },
    user: {
      displayName: profile.display_name,
      email: authUser.email,
      roleName: role.name,
    },
    scope: context.scope,
    branches: safeBranches,
  };
}
