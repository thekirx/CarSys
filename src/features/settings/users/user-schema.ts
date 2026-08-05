import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  fullName: z.string().trim().min(2, "Enter the team member's name"),
  roleId: z.string().min(1, "Select a role"),
  scope: z.enum(["organization", "assigned_branches"]),
  branchIds: z.array(z.string()),
}).superRefine((data, ctx) => {
  if (data.scope === "assigned_branches" && data.branchIds.length === 0) ctx.addIssue({ code: "custom", path: ["branchIds"], message: "Assign at least one branch" });
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
