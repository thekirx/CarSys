import { describe, expect, it } from "vitest";

import { canAccessBranch, hasPermission } from "@/features/permissions/permissions";
import {
  moduleKeys,
  permissionKeys,
  type OrganizationAccessContext,
} from "@/features/permissions/types";

const organizationContext: OrganizationAccessContext = {
  organizationId: "org-1",
  userId: "user-1",
  scope: "organization",
  branchIds: [],
  permissions: [
    "settings.manage",
    "financials.view_sensitive",
    "vehicles.read",
  ],
  enabledModules: ["dealership"],
};

describe("permission resolution", () => {
  it("allows an explicitly resolved permission", () => {
    expect(hasPermission(organizationContext, "settings.manage")).toBe(true);
  });

  it("denies a permission that was not resolved", () => {
    expect(hasPermission(organizationContext, "users.manage")).toBe(false);
  });

  it("allows organization scope for any non-empty branch ID", () => {
    expect(canAccessBranch(organizationContext, "branch-elsewhere")).toBe(true);
    expect(canAccessBranch(organizationContext, "")).toBe(false);
  });

  it("limits assigned scope to exact, non-empty branch membership", () => {
    const assignedContext: OrganizationAccessContext = {
      ...organizationContext,
      scope: "assigned_branches",
      branchIds: ["branch-1", "branch-1", "", " branch-2"],
    };

    expect(canAccessBranch(assignedContext, "branch-1")).toBe(true);
    expect(canAccessBranch(assignedContext, "branch-2")).toBe(false);
    expect(canAccessBranch(assignedContext, "")).toBe(false);
  });

  it("fails closed for malformed context IDs", () => {
    const malformedContext: OrganizationAccessContext = {
      ...organizationContext,
      organizationId: "",
    };

    expect(hasPermission(malformedContext, "settings.manage")).toBe(false);
    expect(canAccessBranch(malformedContext, "branch-1")).toBe(false);
  });

  it("matches the database permission and module catalogs exactly", () => {
    expect(permissionKeys).toEqual([
      "settings.manage",
      "users.manage",
      "modules.manage",
      "financials.view_sensitive",
      "vehicles.read",
      "vehicles.manage",
      "reports.read",
      "audit_logs.read",
    ]);
    expect(moduleKeys).toEqual([
      "dealership",
      "fleet_management",
      "vehicle_rental",
    ]);
  });
});
