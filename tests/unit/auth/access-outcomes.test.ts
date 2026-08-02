import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRequiredAccessContext } from "@/features/auth/get-access-context";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";
const MEMBERSHIP_ID = "44444444-4444-4444-8444-444444444444";
const ROLE_ID = "66666666-6666-4666-8666-666666666666";
const BRANCH_ID = "88888888-8888-4888-8888-888888888888";

const { createServerSupabaseClientMock, headersMock, redirectMock } =
  vi.hoisted(() => ({
    createServerSupabaseClientMock: vi.fn(),
    headersMock: vi.fn(),
    redirectMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));
vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

type QueryResult = { data: unknown; error: unknown };
type Query = Promise<QueryResult> & {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

const makeQuery = (
  result: QueryResult,
  singleResult: QueryResult = result,
) => {
  const query = Promise.resolve(result) as Query;
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.maybeSingle = vi.fn().mockResolvedValue(singleResult);
  return query;
};

const membership = {
  id: MEMBERSHIP_ID,
  organization_id: ORGANIZATION_ID,
  user_id: USER_ID,
  role_id: ROLE_ID,
  status: "active",
  organization_scope: "assigned_branches",
};

const createSupabaseDouble = ({
  membershipResult = { data: membership, error: null },
  rolePermissionsResult = {
    data: [
      {
        organization_id: ORGANIZATION_ID,
        role_id: ROLE_ID,
        permission: { key: "vehicles.read" },
      },
    ],
    error: null,
  },
  modulesResult = {
    data: [
      {
        organization_id: ORGANIZATION_ID,
        is_enabled: true,
        module: { key: "dealership" },
      },
    ],
    error: null,
  },
  branchesResult = {
    data: [
      {
        organization_id: ORGANIZATION_ID,
        membership_id: MEMBERSHIP_ID,
        branch_id: BRANCH_ID,
      },
    ],
    error: null,
  },
}: Partial<{
  membershipResult: QueryResult;
  rolePermissionsResult: QueryResult;
  modulesResult: QueryResult;
  branchesResult: QueryResult;
}> = {}) => {
  const queries = {
    organization_memberships: makeQuery(
      { data: [], error: null },
      membershipResult,
    ),
    role_permissions: makeQuery(rolePermissionsResult),
    organization_modules: makeQuery(modulesResult),
    membership_branches: makeQuery(branchesResult),
  };

  return {
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: USER_ID } },
        error: null,
      }),
    },
    from: vi.fn((table: keyof typeof queries) => queries[table]),
  };
};

describe("required access outcomes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(
      new Headers({ "x-carsys-current-path": "/settings" }),
    );
    redirectMock.mockImplementation((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    });
  });

  it("routes a genuine missing active membership to unauthorized", async () => {
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseDouble({
        membershipResult: { data: null, error: null },
      }),
    );

    await expect(getRequiredAccessContext()).rejects.toThrow(
      "REDIRECT:/unauthorized",
    );
  });

  it("routes a membership query failure to a generic unavailable state", async () => {
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseDouble({
        membershipResult: {
          data: null,
          error: { message: "database unavailable" },
        },
      }),
    );

    await expect(getRequiredAccessContext()).rejects.toThrow(
      "REDIRECT:/access-unavailable",
    );
  });

  it("routes malformed access rows to a generic unavailable state", async () => {
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseDouble({
        rolePermissionsResult: {
          data: [{ organization_id: ORGANIZATION_ID }],
          error: null,
        },
      }),
    );

    await expect(getRequiredAccessContext()).rejects.toThrow(
      "REDIRECT:/access-unavailable",
    );
  });

  it("returns a valid organization context without redirecting", async () => {
    createServerSupabaseClientMock.mockResolvedValue(createSupabaseDouble());

    await expect(getRequiredAccessContext()).resolves.toEqual({
      organizationId: ORGANIZATION_ID,
      userId: USER_ID,
      scope: "assigned_branches",
      branchIds: [BRANCH_ID],
      permissions: ["vehicles.read"],
      enabledModules: ["dealership"],
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
