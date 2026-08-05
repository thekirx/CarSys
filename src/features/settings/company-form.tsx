"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { updateCompanyAction, type CompanyActionState } from "@/features/settings/company-actions";

export type CompanyFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{pending ? "Saving…" : "Save changes"}</button>;
}

export function CompanyForm({ initialValues }: { initialValues: CompanyFormValues }) {
  const [state, action] = useActionState(updateCompanyAction, {} as CompanyActionState);
  const fieldError = (name: string) => state.fields?.[name]?.[0];
  return (
    <form className="settings-form" action={action}>
      <div className="form-section-heading"><span><Building2 size={20} /></span><div><h3>Company profile</h3><p>Core details shown across documents, notifications, and customer touchpoints.</p></div></div>
      <div className="form-grid form-grid-two">
        <Field label="Registered business name" name="name" defaultValue={initialValues.name} error={fieldError("name")} required />
        <Field label="Contact email" name="email" type="email" defaultValue={initialValues.email} error={fieldError("email")} required />
        <Field label="Mobile number" name="phone" defaultValue={initialValues.phone} error={fieldError("phone")} />
        <Field label="Timezone" name="timezone" defaultValue={initialValues.timezone} readOnly />
      </div>
      <Field label="Primary business address" name="address" defaultValue={initialValues.address} error={fieldError("address")} required />
      <div className="form-grid form-grid-two">
        <Field label="Currency" name="currency" defaultValue={initialValues.currency} readOnly />
        <div className="form-note"><CheckCircle2 size={17} /><span><strong>Philippine defaults enabled</strong><small>Currency, dates, and reporting periods use local conventions.</small></span></div>
      </div>
      {state.error ? <div className="form-error" role="alert">{state.error}</div> : null}
      {state.success ? <div className="form-success" role="status"><CheckCircle2 size={16} />{state.success}</div> : null}
      <div className="form-actions"><button className="button button-ghost" type="reset">Reset</button><SaveButton /></div>
    </form>
  );
}

function Field({ label, name, defaultValue, type = "text", error, required, readOnly }: { label: string; name: string; defaultValue: string; type?: string; error?: string; required?: boolean; readOnly?: boolean }) {
  return <div className="field-group"><label htmlFor={name}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label><input id={name} name={name} type={type} defaultValue={defaultValue} readOnly={readOnly} aria-invalid={Boolean(error)} />{error ? <p className="field-error">{error}</p> : null}</div>;
}
