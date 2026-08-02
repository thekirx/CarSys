import { signInSchema, type SignInValues } from "@/features/auth/schemas";

export const INVALID_CREDENTIALS_MESSAGE =
  "Email or password is incorrect.";

export type SignInActionState = Readonly<{
  fieldErrors?: Readonly<{
    email?: readonly string[];
    password?: readonly string[];
  }>;
  formError?: string;
}>;

type Authenticate = (
  credentials: SignInValues,
) => Promise<{ error: unknown | null }>;

export type PasswordSignInResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; state: SignInActionState }>;

export async function performPasswordSignIn(
  formData: FormData,
  authenticate: Authenticate,
): Promise<PasswordSignInResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      state: { fieldErrors: parsed.error.flatten().fieldErrors },
    };
  }

  try {
    const result = await authenticate(parsed.data);
    if (result.error) {
      return {
        ok: false,
        state: { formError: INVALID_CREDENTIALS_MESSAGE },
      };
    }
  } catch {
    return {
      ok: false,
      state: { formError: INVALID_CREDENTIALS_MESSAGE },
    };
  }

  return { ok: true };
}
