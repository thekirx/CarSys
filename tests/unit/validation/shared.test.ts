import { describe, expect, it } from "vitest";
import { organizationSlug, positiveMoney, requiredText } from "@/lib/validation/shared";

describe("shared validation", () => {
  it("trims required text", () => expect(requiredText.parse("  Apex  ")).toBe("Apex"));
  it("rejects negative money", () => expect(positiveMoney.safeParse(-1).success).toBe(false));
  it("accepts a lowercase organization slug", () => expect(organizationSlug.parse("apex-autohaus")).toBe("apex-autohaus"));
});
