import { describe, expect, it } from "vitest";

import {
  formatManilaDate,
  formatPeso,
} from "@/lib/formatting/philippines";

describe("Philippine formatting", () => {
  it("formats whole peso values with Philippine currency grouping", () => {
    expect(formatPeso(21800000)).toBe("₱21,800,000");
  });

  it("formats UTC timestamps as Manila calendar dates", () => {
    expect(formatManilaDate("2026-08-01T16:30:00.000Z")).toBe("Aug 2, 2026");
  });
});
