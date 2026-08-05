import { expect, it } from "vitest";
import { getVisibleNavigation } from "@/features/permissions/navigation";
import { createDemoAccessContext } from "@/lib/demo-data";

it("never shows disabled Fleet or Rental navigation", () => {
  const labels = getVisibleNavigation(createDemoAccessContext("owner")).map((item) => item.label);
  expect(labels).not.toContain("Fleet Management");
  expect(labels).not.toContain("Vehicle Rental");
});

it("hides settings from a sales agent", () => {
  expect(getVisibleNavigation(createDemoAccessContext("sales-agent")).map((item) => item.label)).not.toContain("Settings");
});
