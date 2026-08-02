import { describe, expect, it } from "vitest";

import { mapOrganizationAccessContext } from "@/features/auth/get-access-context";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const FIRST_ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";
const SECOND_ORGANIZATION_ID = "33333333-3333-4333-8333-333333333333";
const FIRST_MEMBERSHIP_ID = "44444444-4444-4444-8444-444444444444";
const SECOND_MEMBERSHIP_ID = "55555555-5555-4555-8555-555555555555";
const FIRST_ROLE_ID = "66666666-6666-4666-8666-666666666666";
const SECOND_ROLE_ID = "77777777-7777-4777-8777-777777777777";
const BRANCH_ID = "88888888-8888-4888-8888-888888888888";
const OTHER_BRANCH_ID = "99999999-9999-4999-8999-999999999999";

const baseInput = {
  userId: USER_ID,
  memberships: [
    {
      id: FIRST_MEMBERSHIP_ID,
      organization_id: FIRST_ORGANIZATION_ID,
      user_id: USER_ID,
      role_id: FIRST_ROLE_ID,
      status: "active",
      organization_scope: "assigned_branches",
    },
  ],
  rolePermissions: [
    {
      organization_id: FIRST_ORGANIZATION_ID,
      role_id: FIRST_ROLE_ID,
      permission_key: "vehicles.read",
    },
  ],
  organizationModules: [
    {
      organization_id: FIRST_ORGANIZATION_ID,
      is_enabled: true,
      module_key: "dealership",
    },
  ],
  membershipBranches: [
    {
      organization_id: FIRST_ORGANIZATION_ID,
      membership_id: FIRST_MEMBERSHIP_ID,
      branch_id: BRANCH_ID,
    },
  ],
};

describe("mapOrganizationAccessContext", () => {
  it("filters unknown keys and deduplicates permissions, modules, and branches", () => {
    const result = mapOrganizationAccessContext({
      ...baseInput,
      rolePermissions: [
        ...baseInput.rolePermissions,
        ...baseInput.rolePermissions,
        {
          organization_id: FIRST_ORGANIZATION_ID,
          role_id: FIRST_ROLE_ID,
          permission_key: "permissions.superuser",
        },
      ],
      organizationModules: [
        ...baseInput.organizationModules,
        ...baseInput.organizationModules,
        {
          organization_id: FIRST_ORGANIZATION_ID,
          is_enabled: true,
          module_key: "future_module",
        },
        {
          organization_id: FIRST_ORGANIZATION_ID,
          is_enabled: false,
          module_key: "vehicle_rental",
        },
      ],
      membershipBranches: [
        ...baseInput.membershipBranches,
        ...baseInput.membershipBranches,
      ],
    });

    expect(result).toEqual({
      organizationId: FIRST_ORGANIZATION_ID,
      userId: USER_ID,
      scope: "assigned_branches",
      branchIds: [BRANCH_ID],
      permissions: ["vehicles.read"],
      enabledModules: ["dealership"],
    });
  });

  it("returns no branch IDs for organization scope", () => {
    const result = mapOrganizationAccessContext({
      ...baseInput,
      memberships: [
        {
          ...baseInput.memberships[0],
          organization_scope: "organization",
        },
      ],
    });

    expect(result?.scope).toBe("organization");
    expect(result?.branchIds).toEqual([]);
  });

  it("selects one organization deterministically and never merges related rows", () => {
    const result = mapOrganizationAccessContext({
      ...baseInput,
      memberships: [
        {
          id: SECOND_MEMBERSHIP_ID,
          organization_id: SECOND_ORGANIZATION_ID,
          user_id: USER_ID,
          role_id: SECOND_ROLE_ID,
          status: "active",
          organization_scope: "assigned_branches",
        },
        ...baseInput.memberships,
      ],
      rolePermissions: [
        {
          organization_id: SECOND_ORGANIZATION_ID,
          role_id: SECOND_ROLE_ID,
          permission_key: "settings.manage",
        },
        ...baseInput.rolePermissions,
      ],
      organizationModules: [
        {
          organization_id: SECOND_ORGANIZATION_ID,
          is_enabled: true,
          module_key: "vehicle_rental",
        },
        ...baseInput.organizationModules,
      ],
      membershipBranches: [
        {
          organization_id: SECOND_ORGANIZATION_ID,
          membership_id: SECOND_MEMBERSHIP_ID,
          branch_id: OTHER_BRANCH_ID,
        },
        ...baseInput.membershipBranches,
      ],
    });

    expect(result).toEqual({
      organizationId: FIRST_ORGANIZATION_ID,
      userId: USER_ID,
      scope: "assigned_branches",
      branchIds: [BRANCH_ID],
      permissions: ["vehicles.read"],
      enabledModules: ["dealership"],
    });
  });

  it.each([
    ["missing membership field", { ...baseInput, memberships: [{ id: FIRST_MEMBERSHIP_ID }] }],
    ["malformed user ID", { ...baseInput, userId: "not-a-uuid" }],
    ["unknown scope", { ...baseInput, memberships: [{ ...baseInput.memberships[0], organization_scope: "global" }] }],
    ["incomplete permission row", { ...baseInput, rolePermissions: [{ permission_key: "vehicles.read" }] }],
    ["incomplete module row", { ...baseInput, organizationModules: [{ module_key: "dealership" }] }],
    ["incomplete branch row", { ...baseInput, membershipBranches: [{ branch_id: BRANCH_ID }] }],
  ])("fails closed for a %s", (_, input) => {
    expect(mapOrganizationAccessContext(input)).toBeNull();
  });
});
