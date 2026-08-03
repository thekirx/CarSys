import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  ALL_BRANCHES,
  OrganizationProvider,
  useOrganization,
} from "@/components/app-shell/organization-provider";

const branches = [
  { id: "branch-2", name: "Makati", isPrimary: false },
  { id: "branch-1", name: "Quezon City Main", isPrimary: true },
] as const;

function OrganizationConsumer() {
  const { selectedBranchId, selectBranch } = useOrganization();

  return (
    <div>
      <output aria-label="Selected branch">
        {selectedBranchId ?? "none"}
      </output>
      <button type="button" onClick={() => selectBranch("branch-2")}>
        Select accessible
      </button>
      <button type="button" onClick={() => selectBranch("outside-branch")}>
        Select inaccessible
      </button>
      <button type="button" onClick={() => selectBranch(ALL_BRANCHES)}>
        Select all
      </button>
    </div>
  );
}

const metadata = {
  organization: { id: "org-1", name: "Apex Autohaus" },
  user: {
    displayName: "Miguel Santos",
    email: "owner@apex-autohaus.example",
    roleName: "Owner",
  },
};

afterEach(cleanup);

describe("OrganizationProvider", () => {
  it("keeps assigned-scope selection within accessible branches", async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider
        {...metadata}
        scope="assigned_branches"
        branches={branches}
        initialSelectedBranchId="outside-branch"
      >
        <OrganizationConsumer />
      </OrganizationProvider>,
    );

    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      "branch-1",
    );
    await user.click(screen.getByRole("button", { name: "Select accessible" }));
    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      "branch-2",
    );
    await user.click(
      screen.getByRole("button", { name: "Select inaccessible" }),
    );
    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      "branch-2",
    );
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      "branch-2",
    );
  });

  it("supports All branches only for organization scope", async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider
        {...metadata}
        scope="organization"
        branches={branches}
        initialSelectedBranchId="outside-branch"
      >
        <OrganizationConsumer />
      </OrganizationProvider>,
    );

    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      ALL_BRANCHES,
    );
    await user.click(screen.getByRole("button", { name: "Select accessible" }));
    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      "branch-2",
    );
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByLabelText("Selected branch")).toHaveTextContent(
      ALL_BRANCHES,
    );
  });

  it("remains deterministic for an empty assigned scope", () => {
    render(
      <OrganizationProvider
        {...metadata}
        scope="assigned_branches"
        branches={[]}
        initialSelectedBranchId="outside-branch"
      >
        <OrganizationConsumer />
      </OrganizationProvider>,
    );

    expect(screen.getByLabelText("Selected branch")).toHaveTextContent("none");
  });
});
