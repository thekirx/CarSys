"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { signInAction, type AuthActionState } from "@/features/auth/actions";
import { demoRoles } from "@/lib/demo-data";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary button-block" disabled={pending} type="submit">
      {pending ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />}
      {pending ? "Signing in…" : "Sign in securely"}
    </button>
  );
}

export function SignInForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action] = useActionState(signInAction, initialState);
  return (
    <div className="signin-stack">
      <form action={action} className="signin-form">
        <input type="hidden" name="next" value={next} />
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@apexautohaus.ph" aria-describedby="email-error" />
          {state.fields?.email ? <p id="email-error" className="field-error">{state.fields.email[0]}</p> : null}
        </div>
        <div className="field-group">
          <div className="label-row"><label htmlFor="password">Password</label><span>Secure workspace</span></div>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" aria-describedby="password-error" />
          {state.fields?.password ? <p id="password-error" className="field-error">{state.fields.password[0]}</p> : null}
        </div>
        {state.error ? <div className="form-error" role="alert">{state.error}</div> : null}
        <SubmitButton />
      </form>

      <div className="demo-divider"><span>or explore demo roles</span></div>
      <div className="demo-role-grid">
        {demoRoles.map((role) => (
          <form action={action} key={role.key}>
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="demoRole" value={role.key} />
            <button className="demo-role" type="submit">
              <span className="demo-role-icon"><ShieldCheck size={16} /></span>
              <span><strong>{role.name}</strong><small>{role.person}</small></span>
              <ArrowRight size={15} />
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
