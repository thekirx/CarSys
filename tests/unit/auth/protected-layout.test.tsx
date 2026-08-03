import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedApplicationLayout from "@/app/(app)/layout";

const { getRequiredAccessContextMock, headersMock } = vi.hoisted(() => ({
  getRequiredAccessContextMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("@/features/auth/get-access-context", () => ({
  CURRENT_PATH_HEADER: "x-carsys-current-path",
  getRequiredAccessContext: getRequiredAccessContextMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("@/components/app-shell/get-shell-data", () => ({
  loadApplicationShellData: vi.fn(),
}));

describe("protected application layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(
      new Headers({ "x-carsys-current-path": "/unauthorized" }),
    );
    getRequiredAccessContextMock.mockImplementation(
      async (options?: { allowMissingMembership?: boolean }) => {
        if (options?.allowMissingMembership) {
          return null;
        }

        throw new Error("REDIRECT:/unauthorized");
      },
    );
  });

  it("does not render protected children when a client spoofs the exception path", async () => {
    await expect(
      ProtectedApplicationLayout({ children: <div>Sensitive child</div> }),
    ).rejects.toThrow("REDIRECT:/unauthorized");
  });
});
