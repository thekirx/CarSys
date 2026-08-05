"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, MailPlus, UserPlus, X } from "lucide-react";
import { inviteUserAction, type InviteUserState } from "@/features/settings/users/user-actions";
import type { InviteOption } from "@/features/settings/users/user-queries";

function InviteSubmit() {
  const { pending } = useFormStatus();
  return <button className="button button-primary" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16} /> : <MailPlus size={16} />}{pending ? "Sending…" : "Send invitation"}</button>;
}

export function InviteUserDialog({ roles, branches }: { roles: InviteOption[]; branches: InviteOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scope, setScope] = useState("assigned_branches");
  const [state, action] = useActionState(inviteUserAction, {} as InviteUserState);
  return <>
    <button className="button button-primary" onClick={() => dialogRef.current?.showModal()}><UserPlus size={16} /> Invite team member</button>
    <dialog className="dialog" ref={dialogRef} onClose={() => setScope("assigned_branches")}>
      <div className="dialog-header"><div><h2>Invite team member</h2><p>Add a user to Apex Autohaus and define their access.</p></div><button onClick={() => dialogRef.current?.close()} aria-label="Close dialog"><X size={19} /></button></div>
      <form action={action} className="dialog-form">
        <div className="form-grid form-grid-two"><Field label="Full name" name="fullName" placeholder="e.g. Carlo Mendoza" error={state.fields?.fullName?.[0]} /><Field label="Email address" name="email" type="email" placeholder="carlo@example.com" error={state.fields?.email?.[0]} /></div>
        <div className="form-grid form-grid-two">
          <div className="field-group"><label htmlFor="roleId">Role</label><select id="roleId" name="roleId" defaultValue={roles[0]?.id}>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select>{state.fields?.roleId?.[0] ? <p className="field-error">{state.fields.roleId[0]}</p> : null}</div>
          <div className="field-group"><label htmlFor="scope">Access scope</label><select id="scope" name="scope" value={scope} onChange={(event) => setScope(event.target.value)}><option value="assigned_branches">Assigned branches</option><option value="organization">All branches</option></select></div>
        </div>
        {scope === "assigned_branches" ? <div className="branch-checkboxes">{branches.map((branch, index) => <label className="checkbox-row" key={branch.id}><input type="checkbox" name="branchIds" value={branch.id} defaultChecked={index === 0} /><span><strong>{branch.name}</strong><small>Active operating branch</small></span></label>)}{state.fields?.branchIds?.[0] ? <p className="field-error">{state.fields.branchIds[0]}</p> : null}</div> : <div className="scope-note">This user can access all current and future branches.</div>}
        {state.error ? <div className="form-error">{state.error}</div> : null}{state.success ? <div className="form-success">{state.success}</div> : null}
        <div className="dialog-actions"><button className="button button-ghost" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><InviteSubmit /></div>
      </form>
    </dialog>
  </>;
}

function Field({ label, name, placeholder, type = "text", error }: { label: string; name: string; placeholder: string; type?: string; error?: string }) {
  return <div className="field-group"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} placeholder={placeholder} aria-invalid={Boolean(error)} />{error ? <p className="field-error">{error}</p> : null}</div>;
}
