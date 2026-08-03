import { describe, expect, it } from "vitest";

import { mapApplicationShellData } from "@/components/app-shell/shell-data";
import type { OrganizationAccessContext } from "@/features/permissions/types";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";
const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";
const ROLE_ID = "44444444-4444-4444-8444-444444444444";
const BRANCH_ID = "55555555-5555-4555-8555-555555555555";
const OTHER_BRANCH_ID = "66666666-6666-4666-8666-666666666666";
const CROSS_ORGANIZATION_ID = "77777777-7777-4777-8777-777777777777";

const assignedContext: OrganizationAccessContext = {
  organizationId: ORGANIZATION_ID,
  userId: USER_ID,
  scope: "assigned_branches",
  branchIds: [BRANCH_ID],
  permissions: ["vehicles.read"],
  enabledModules: ["dealership"],
};

const baseInput = {
  context: assignedContext,
  authUser: { id: USER_ID, email: "owner@apex-autohaus.example" },
  profile: { id: USER_ID, display_name: "Miguel Santos" },
  organization: {
    id: ORGANIZATION_ID,
    company_name: "Apex Autohaus",
    is_active: true,
  },
  membership: {
    id: MEMBERSHIP_ID,
    organization_id: ORGANIZATION_ID,
    user_id: USER_ID,
    role_id: ROLE_ID,
    status: "active",
    organization_scope: "assigned_branches",
  },
  role: { id: ROLE_ID, organization_id: ORGANIZATION_ID, name: "Owner" },
  branches: [
    {
      id: BRANCH_ID,
      organization_id: ORGANIZATION_ID,
      name: "Quezon City Main",
      is_primary: true,
      is_active: true,
    },
  ],
};

describe("mapApplicationShellData", () => {
  it("maps only safe serializable shell metadata", () => {
    expect(mapApplicationShellData(baseInput)).toEqual({
      organization: { id: ORGANIZATION_ID, name: "Apex Autohaus" },
      user: {
        displayName: "Miguel Santos",
        email: "owner@apex-autohaus.example",
        roleName: "Owner",
      },
      scope: "assigned_branches",
      branches: [
        {
          id: BRANCH_ID,
          name: "Quezon City Main",
          isPrimary: true,
        },
      ],
    });
  });

  it.each([
    ["auth user", { authUser: { ...baseInput.authUser, id: OTHER_BRANCH_ID } }],
    ["profile", { profile: { ...baseInput.profile, id: OTHER_BRANCH_ID } }],
    [
      "organization",
      {
        organization: {
          ...baseInput.organization,
          id: CROSS_ORGANIZATION_ID,
        },
      },
    ],
    [
      "membership",
      {
        membership: {
          ...baseInput.membership,
          organization_id: CROSS_ORGANIZATION_ID,
        },
      },
    ],
    [
      "role",
      {
        role: { ...baseInput.role, organization_id: CROSS_ORGANIZATION_ID },
      },
    ],
    [
      "branch",
      {
        branches: [
          {
            ...baseInput.branches[0],
            organization_id: CROSS_ORGANIZATION_ID,
          },
        ],
      },
    ],
  ])("rejects a cross-boundary %s row", (_, override) => {
    expect(mapApplicationShellData({ ...baseInput, ...override })).toBeNull();
  });

  it.each([
    ["missing email", { authUser: { id: USER_ID } }],
    ["blank display name", { profile: { id: USER_ID, display_name: " " } }],
    ["inactive organization", { organization: { ...baseInput.organization, is_active: false } }],
    ["malformed role", { role: { id: "not-a-uuid", organization_id: ORGANIZATION_ID, name: "Owner" } }],
    ["inactive branch", { branches: [{ ...baseInput.branches[0], is_active: false }] }],
  ])("fails closed for %s", (_, override) => {
    expect(mapApplicationShellData({ ...baseInput, ...override })).toBeNull();
  });

  it("rejects assigned-scope branch rows outside the reviewed access context", () => {
    expect(
      mapApplicationShellData({
        ...baseInput,
        branches: [
          ...baseInput.branches,
          {
            id: OTHER_BRANCH_ID,
            organization_id: ORGANIZATION_ID,
            name: "Unassigned branch",
            is_primary: false,
            is_active: true,
          },
        ],
      }),
    ).toBeNull();
  });

  it("returns no branches for an empty assigned scope", () => {
    expect(
      mapApplicationShellData({
        ...baseInput,
        context: { ...assignedContext, branchIds: [] },
        branches: [],
      })?.branches,
    ).toEqual([]);
  });

  it("allows all same-organization branches for organization scope in deterministic order", () => {
    const result = mapApplicationShellData({
      ...baseInput,
      context: {
        ...assignedContext,
        scope: "organization",
        branchIds: [],
      },
      membership: {
        ...baseInput.membership,
        organization_scope: "organization",
      },
      branches: [
        {
          id: OTHER_BRANCH_ID,
          organization_id: ORGANIZATION_ID,
          name: "Makati",
          is_primary: false,
          is_active: true,
        },
        ...baseInput.branches,
      ],
    });

    expect(result?.branches.map((branch) => branch.id)).toEqual([
      BRANCH_ID,
      OTHER_BRANCH_ID,
    ]);
  });
});
