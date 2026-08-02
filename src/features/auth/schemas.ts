import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string({ error: "Enter a valid email address" })
    .trim()
    .email("Enter a valid email address"),
  password: z
    .string({ error: "Enter your password" })
    .min(1, "Enter your password"),
});

export type SignInValues = z.infer<typeof signInSchema>;
