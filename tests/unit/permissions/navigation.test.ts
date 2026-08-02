import { describe, expect, it } from "vitest";

import {
  getVisibleNavigation,
  type NavigationItem,
} from "@/features/permissions/navigation";
import {
  moduleKeys,
  permissionKeys,
  type ModuleKey,
  type OrganizationAccessContext,
  type PermissionKey,
} from "@/features/permissions/types";

const broadContext: OrganizationAccessContext = {
  organizationId: "org-1",
  userId: "user-1",
  scope: "organization",
  branchIds: [],
  permissions: permissionKeys,
  enabledModules: ["dealership", "fleet_management", "vehicle_rental"],
};

const visibleLabels = (context: OrganizationAccessContext) =>
  getVisibleNavigation(context).map((item) => item.label);

const exactRegistryCases: ReadonlyArray<{
  name: string;
  permissions: readonly PermissionKey[];
  expected: readonly NavigationItem[];
}> = [
  {
    name: "reporting",
    permissions: ["reports.read"],
    expected: [
      {
        key: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        requiredModule: "dealership",
        requiredPermission: "reports.read",
      },
      {
        key: "reports",
        label: "Reports",
        href: "/reports",
        requiredModule: "dealership",
        requiredPermission: "reports.read",
      },
    ],
  },
  {
    name: "vehicle inventory",
    permissions: ["vehicles.read"],
    expected: [
      {
        key: "vehicle-inventory",
        label: "Vehicle Inventory",
        href: "/vehicles",
        requiredModule: "dealership",
        requiredPermission: "vehicles.read",
      },
    ],
  },
  {
    name: "company settings",
    permissions: ["settings.manage"],
    expected: [
      {
        key: "company-settings",
        label: "Company Settings",
        href: "/settings/company",
        requiredModule: "dealership",
        requiredPermission: "settings.manage",
      },
    ],
  },
  {
    name: "module settings",
    permissions: ["modules.manage"],
    expected: [
      {
        key: "module-settings",
        label: "Module Settings",
        href: "/settings/modules",
        requiredModule: "dealership",
        requiredPermission: "modules.manage",
      },
    ],
  },
  {
    name: "user management",
    permissions: ["users.manage"],
    expected: [
      {
        key: "user-management",
        label: "User Management",
        href: "/settings/users",
        requiredModule: "dealership",
        requiredPermission: "users.manage",
      },
    ],
  },
  {
    name: "audit logs",
    permissions: ["audit_logs.read"],
    expected: [
      {
        key: "audit-logs",
        label: "Audit Logs",
        href: "/audit-logs",
        requiredModule: "dealership",
        requiredPermission: "audit_logs.read",
      },
    ],
  },
];

describe("role-aware navigation", () => {
  it.each([
    ["disabled", ["dealership"]],
    ["enabled", moduleKeys],
  ] as const)("never shows %s Fleet or Rental navigation", (_, enabledModules) => {
    const labels = visibleLabels({ ...broadContext, enabledModules });

    expect(labels).not.toContain("Fleet Management");
    expect(labels).not.toContain("Vehicle Rental");
  });

  it("requires both the declared permission and module", () => {
    const inventoryContext: OrganizationAccessContext = {
      ...broadContext,
      permissions: ["vehicles.read"],
      enabledModules: ["dealership"],
    };

    expect(visibleLabels(inventoryContext)).toEqual(["Vehicle Inventory"]);

    expect(
      visibleLabels({
        ...inventoryContext,
        permissions: [],
      }),
    ).toEqual([]);

    expect(
      visibleLabels({
        ...inventoryContext,
        enabledModules: ["fleet_management", "vehicle_rental"],
      }),
    ).toEqual([]);
  });

  it.each(exactRegistryCases)(
    "returns the exact $name registry contract",
    ({ permissions, expected }) => {
      expect(
        getVisibleNavigation({
          ...broadContext,
          permissions,
          enabledModules: ["dealership"],
        }),
      ).toEqual(expected);
    },
  );

  it("does not grant navigation through duplicate malformed entries", () => {
    const malformedPermissions: OrganizationAccessContext = {
      ...broadContext,
      permissions: ["reports.read ", "reports.read "] as unknown as readonly PermissionKey[],
      enabledModules: ["dealership"],
    };
    const malformedModules: OrganizationAccessContext = {
      ...broadContext,
      permissions: ["reports.read"],
      enabledModules: [" dealership", "dealership "] as unknown as readonly ModuleKey[],
    };

    expect(getVisibleNavigation(malformedPermissions)).toEqual([]);
    expect(getVisibleNavigation(malformedModules)).toEqual([]);
  });

  it("returns fresh items that cannot mutate the canonical registry", () => {
    const firstResult = getVisibleNavigation(broadContext);
    const mutableResult = firstResult as unknown as Array<{ label: string }>;

    mutableResult[0].label = "Changed by caller";
    mutableResult.pop();

    const secondResult = getVisibleNavigation(broadContext);
    expect(secondResult[0].label).toBe("Dashboard");
    expect(secondResult.map((item) => item.label)).toContain("Audit Logs");
    expect(secondResult.map((item) => item.label)).not.toContain("Vehicle Rental");
  });
});
