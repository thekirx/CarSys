import { z } from "zod";

export const requiredText = z.string().trim().min(1, "This field is required");

export const positiveMoney = z.number().finite().nonnegative();

export const organizationSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
