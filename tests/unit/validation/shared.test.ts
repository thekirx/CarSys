import { describe, expect, it } from "vitest";

import {
  organizationSlug,
  positiveMoney,
  requiredText,
} from "@/lib/validation/shared";

describe("requiredText", () => {
  it("trims required text before returning it", () => {
    expect(requiredText.parse("  Apex  ")).toBe("Apex");
  });

  it("rejects whitespace-only input", () => {
    expect(requiredText.safeParse(" \t ").success).toBe(false);
  });
});

describe("positiveMoney", () => {
  it("accepts zero", () => {
    expect(positiveMoney.safeParse(0).success).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(positiveMoney.safeParse(-1).success).toBe(false);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite amount %s",
    (amount) => {
      expect(positiveMoney.safeParse(amount).success).toBe(false);
    },
  );
});

describe("organizationSlug", () => {
  it("accepts lowercase hyphen-separated slugs", () => {
    expect(organizationSlug.parse("apex-autohaus")).toBe("apex-autohaus");
  });

  it.each(["Apex-autohaus", "-apex", "apex-", "apex--autohaus", "apex autohaus"])(
    "rejects malformed slug %s",
    (slug) => {
      expect(organizationSlug.safeParse(slug).success).toBe(false);
    },
  );
});
