"use client";

import { useActionState } from "react";

import { signInAction } from "@/features/auth/actions";
import type { SignInActionState } from "@/features/auth/action-logic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type SignInFormProps = Readonly<{
  nextPath: string;
  callbackFailed?: boolean;
}>;

const CALLBACK_ERROR_MESSAGE =
  "Authentication could not be completed. Please try again.";

export function SignInForm({ nextPath, callbackFailed }: SignInFormProps) {
  const initialState: SignInActionState = callbackFailed
    ? { formError: CALLBACK_ERROR_MESSAGE }
    : {};
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  const emailErrors = state.fieldErrors?.email;
  const passwordErrors = state.fieldErrors?.password;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.formError ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={Boolean(emailErrors)} data-disabled={pending}>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(emailErrors)}
            aria-describedby={emailErrors ? "email-error" : undefined}
            disabled={pending}
          />
          <FieldError id="email-error" errors={emailErrors?.map((message) => ({ message }))} />
        </Field>

        <Field data-invalid={Boolean(passwordErrors)} data-disabled={pending}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(passwordErrors)}
            aria-describedby={passwordErrors ? "password-error" : undefined}
            disabled={pending}
          />
          <FieldError
            id="password-error"
            errors={passwordErrors?.map((message) => ({ message }))}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
