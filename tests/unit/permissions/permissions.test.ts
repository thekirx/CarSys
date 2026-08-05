import { describe, expect, it } from "vitest";
import { canAccessBranch, hasPermission } from "@/features/permissions/permissions";
import { createDemoAccessContext } from "@/lib/demo-data";

describe("permission resolution", () => {
  const owner = createDemoAccessContext("owner");
  it("allows an explicit permission", () => expect(hasPermission(owner, "settings.manage")).toBe(true));
  it("denies an absent permission", () => expect(hasPermission(createDemoAccessContext("sales-agent"), "users.manage")).toBe(false));
  it("allows organization scope across branches", () => expect(canAccessBranch(owner, "branch-2")).toBe(true));
});
