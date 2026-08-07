import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { UserManagementRecord } from "@/features/settings/users/user-queries";

vi.mock("@/features/settings/users/user-actions", () => ({
  setMembershipStatusAction: vi.fn(),
}));

import { UserTable } from "@/features/settings/users/user-table";

const users: UserManagementRecord[] = [{
  id: "user-1", membershipId: "membership-1", name: "Paolo Reyes", email: "sales@example.com",
  role: "Sales Agent", roleCode: "sales-agent", scope: "Assigned branches", branches: "Quezon City Main", status: "Active",
}];

it("renders user access details and disables mutations in demo mode", () => {
  render(<UserTable initialUsers={users} currentUserId="owner" demoMode />);
  expect(screen.getAllByText("Paolo Reyes")[0]).toBeInTheDocument();
  expect(screen.getAllByText("Sales Agent")[0]).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Suspend" })[0]).toBeDisabled();
});
