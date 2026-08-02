import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SidebarMenuSkeleton } from "@/components/ui/sidebar";

describe("SidebarMenuSkeleton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders deterministic markup across separate server renders", () => {
    let randomValue = 0;
    vi.spyOn(Math, "random").mockImplementation(() => randomValue);

    const firstRender = renderToStaticMarkup(<SidebarMenuSkeleton />);
    randomValue = 0.99;
    const secondRender = renderToStaticMarkup(<SidebarMenuSkeleton />);

    expect(secondRender).toBe(firstRender);
  });
});
