import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const parsePublicEnv = (env: Record<string, string | undefined>) =>
  publicEnvSchema.parse(env);

export function getPublicEnv(): PublicEnv | null {
  const result = publicEnvSchema.safeParse(process.env);
  return result.success ? result.data : null;
}

export const isDemoMode = () =>
  process.env.NEXT_PUBLIC_CARSYS_DEMO_MODE === "true" || getPublicEnv() === null;
