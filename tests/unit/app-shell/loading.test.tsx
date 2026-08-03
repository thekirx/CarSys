import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import ApplicationLoading from "@/app/(app)/loading";

describe("protected application loading shell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a stable deterministic Skeleton structure matching shell geometry", () => {
    let randomValue = 0;
    vi.spyOn(Math, "random").mockImplementation(() => randomValue);
    const firstMarkup = renderToStaticMarkup(<ApplicationLoading />);
    randomValue = 0.99;
    const secondMarkup = renderToStaticMarkup(<ApplicationLoading />);

    expect(secondMarkup).toBe(firstMarkup);

    render(<ApplicationLoading />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.getByTestId("loading-content")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"].animate-pulse').length).toBeGreaterThan(8);
  });
});
