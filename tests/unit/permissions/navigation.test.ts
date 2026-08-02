import { describe, expect, it } from "vitest";

import { getVisibleNavigation } from "@/features/permissions/navigation";
import {
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

describe("role-aware navigation", () => {
  it("never shows disabled Fleet or Rental navigation", () => {
    const labels = visibleLabels({
      ...broadContext,
      enabledModules: ["dealership"],
    });

    expect(labels).not.toContain("Fleet Management");
    expect(labels).not.toContain("Vehicle Rental");
  });

  it("requires both the declared permission and module", () => {
    expect(visibleLabels(broadContext)).toContain("Vehicle Inventory");

    expect(
      visibleLabels({
        ...broadContext,
        permissions: broadContext.permissions.filter(
          (permission) => permission !== "vehicles.read",
        ),
      }),
    ).not.toContain("Vehicle Inventory");

    expect(
      visibleLabels({
        ...broadContext,
        enabledModules: broadContext.enabledModules.filter(
          (module) => module !== "fleet_management",
        ),
      }),
    ).not.toContain("Fleet Management");
  });

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
    expect(secondResult.map((item) => item.label)).toContain("Vehicle Rental");
  });
});
