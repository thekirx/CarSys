import { expect, it } from "vitest";
import { companySettingsSchema } from "@/features/settings/company-schema";
it("requires a company name and valid contact email", () => expect(companySettingsSchema.safeParse({ name: "", email: "bad", phone: "", address: "", timezone: "Asia/Manila", currency: "PHP" }).success).toBe(false));
