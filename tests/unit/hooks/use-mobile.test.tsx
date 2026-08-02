import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "@/hooks/use-mobile";

class TestMediaQueryList extends EventTarget implements MediaQueryList {
  readonly media = "(max-width: 767px)";
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null =
    null;

  constructor(private readonly readMatches: () => boolean) {
    super();
  }

  get matches() {
    return this.readMatches();
  }

  addListener(listener: ((event: MediaQueryListEvent) => void) | null) {
    if (listener) this.addEventListener("change", listener as EventListener);
  }

  removeListener(listener: ((event: MediaQueryListEvent) => void) | null) {
    if (listener) this.removeEventListener("change", listener as EventListener);
  }
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates when the mobile media query changes", () => {
    let matches = false;
    const mediaQueryList = new TestMediaQueryList(() => matches);

    vi.stubGlobal("matchMedia", () => mediaQueryList);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      mediaQueryList.dispatchEvent(new Event("change"));
    });

    expect(result.current).toBe(true);
  });
});
