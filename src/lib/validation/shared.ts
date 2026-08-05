import { z } from "zod";

export const requiredText = z.string().trim().min(1, "This field is required");
export const positiveMoney = z.number().finite().nonnegative();
export const organizationSlug = z
  .string()
  .trim()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");
export const philippinePhone = z
  .string()
  .trim()
  .regex(/^(?:\+63|0)9\d{9}$/, "Enter a valid Philippine mobile number")
  .or(z.literal(""));
