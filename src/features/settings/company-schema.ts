import { z } from "zod";
import { philippinePhone, requiredText } from "@/lib/validation/shared";

export const companySettingsSchema = z.object({
  name: requiredText.max(100),
  email: z.string().trim().email("Enter a valid contact email"),
  phone: philippinePhone,
  address: requiredText.max(240),
  timezone: z.literal("Asia/Manila"),
  currency: z.literal("PHP"),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
