# Security model

## Defense in depth

CarSys checks authorization twice:

1. Server Components and Server Actions resolve the current active membership and provide useful redirects or validation errors.
2. PostgreSQL RLS independently rejects unauthorized reads and writes.

Navigation visibility is never treated as an authorization boundary.

## Identity and session handling

- Browser and server clients use `@supabase/ssr`.
- Sessions live in cookies and are refreshed by `src/proxy.ts`.
- Server authorization uses `auth.getUser()` rather than trusting an unverified client session value.
- Editable user metadata is used only for display names, never for role or permission decisions.
- Active memberships, roles, branch assignments, and permissions are read from PostgreSQL.

## Tenant and branch isolation

An active organization membership is required before any organization data is available. Organization-scope roles can access every branch in their tenant. Assigned-branch roles must have a matching `membership_branches` record.

Policy helper functions live in the `private` schema, have fixed search paths, and have narrowly scoped execution grants.

## Sensitive financial data

Acquisition value, preparation cost, and minimum price are stored separately from general vehicle records. This prevents a Sales Agent, Inventory Staff member, or Viewer from receiving sensitive columns in a response that the UI later hides.

## Service credentials

The service-role key is never prefixed with `NEXT_PUBLIC_`, never imported by application code, and never printed. It is used only by the administrative demo-user script. Production invitation endpoints must run server-side, authenticate the caller, require `users.manage`, and validate all organization-local role and branch IDs.

## Audit strategy

Significant organization and membership changes append an `audit_logs` record containing actor, action, entity, before/after JSON, reason, and request metadata when available. Ordinary users cannot modify existing audit records.

## Demo mode

Demo mode is intended for local previews and stakeholder demonstrations. It uses fictional data and a role-selection cookie. Production must set `NEXT_PUBLIC_CARSYS_DEMO_MODE=false`; real access then requires Supabase authentication and active membership.

## Operational checklist

- Rotate any accidentally exposed key immediately.
- Apply database migrations before deploying application changes that depend on them.
- Run Supabase database tests and advisors after every policy change.
- Confirm all new business tables have RLS before exposing them through the Data API.
- Keep private media buckets non-public.
- Avoid logging passwords, access tokens, refresh tokens, or service credentials.

## Tenant-integrity constraints

RLS controls who can issue a statement, while database constraints and validation triggers ensure that accepted rows cannot mix tenant identifiers. Vehicle financial records and dashboard snapshots use composite organization/entity foreign keys. Membership-role and membership-branch triggers reject cross-organization assignments before they reach application code.

Dashboard snapshots are read-only to authenticated application users. They are intended to be produced by controlled backend jobs or administrative service processes, not by any role that merely has report-reading access.

Storage policies parse the organization path segment through a safe helper. Invalid or non-UUID object paths resolve to no organization instead of causing policy-cast errors.

## Administrative invitations

User invitations run through a server action that first checks the caller's `users.manage` permission using the user's Supabase session. The selected role and branches are then verified against the active organization. Only after those checks does a server-only administrative client use `SUPABASE_SERVICE_ROLE_KEY` to invite the Auth identity and create the profile, membership, branch assignments, and audit record. The key is never imported by a Client Component or exposed through a `NEXT_PUBLIC_` variable.
