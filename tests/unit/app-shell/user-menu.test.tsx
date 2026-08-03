import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  getUserInitials,
  UserMenu,
} from "@/components/app-shell/user-menu";

vi.mock("@/features/auth/actions", () => ({
  signOutAction: vi.fn(),
}));

describe("UserMenu", () => {
  it("shows an accessible trigger, safe initials, identity, role, and sign-out form", async () => {
    const user = userEvent.setup();

    render(
      <UserMenu
        displayName="Miguel Santos"
        email="owner@apex-autohaus.example"
        roleName="Owner"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Open user menu for Miguel Santos",
    });
    expect(trigger).toHaveTextContent("MS");

    await user.click(trigger);

    expect(
      (await screen.findAllByText("Miguel Santos")).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText("owner@apex-autohaus.example"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    expect(signOutItem.tagName).toBe("BUTTON");
    expect(signOutItem.closest("form")).not.toBeNull();
  });

  it("derives initials from letters and numbers without emitting markup characters", () => {
    expect(getUserInitials("Miguel Santos")).toBe("MS");
    expect(getUserInitials("  <script> Santos  ")).toBe("SS");
    expect(getUserInitials("***")).toBe("AA");
  });
});
