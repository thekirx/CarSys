import { expect, it } from "vitest";
import { inviteUserSchema } from "@/features/settings/users/user-schema";
it("requires branch assignments for branch-scoped roles", () => expect(inviteUserSchema.safeParse({ email: "agent@apexautohaus.demo", fullName: "Paolo Reyes", roleId: "sales-agent", scope: "assigned_branches", branchIds: [] }).success).toBe(false));
