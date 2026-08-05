import { expect, it } from "vitest";
import { signInSchema } from "@/features/auth/schemas";
it("rejects malformed sign-in data", () => expect(signInSchema.safeParse({ email: "not-email", password: "" }).success).toBe(false));
