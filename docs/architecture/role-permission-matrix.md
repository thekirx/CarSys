# Phase 1 role and permission matrix

## Apex Autohaus demo roles

Phase 1 installs five system roles for the fictional `Apex Autohaus` tenant.
The matrix maps only the six stable permission keys created by the reviewed
Task 5 migration. Branch and tenant read access is still enforced by active
membership, organization scope, branch assignment, and RLS; an empty cell does
not bypass those checks.

| Permission key | Owner | Branch Manager | Sales Agent | Inventory Staff | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| `settings.manage` | Yes |  |  |  |  |
| `modules.manage` | Yes |  |  |  |  |
| `users.manage` | Yes |  |  |  |  |
| `vehicles.manage` | Yes | Yes |  | Yes |  |
| `financials.view_sensitive` | Yes |  |  |  |  |
| `audit_logs.read` | Yes |  |  |  |  |

This produces exactly eight `role_permissions` rows. The seed treats these
system-role grants as authoritative and removes stale grants for the five
system roles before finishing a repeat run.

## Scope and least-privilege decisions

| Role | Demo membership scope | Phase 1 behavior |
| --- | --- | --- |
| Owner | Organization | Reads all Apex branches and administers organization settings, modules, users, inventory, sensitive financials, and audit history. |
| Branch Manager | Assigned branches (`QC-MAIN`) | Reads and maintains inventory only in assigned branches. It cannot configure organization modules, organization settings, memberships, sensitive financials, or audit access. |
| Sales Agent | Assigned branches (`QC-MAIN`) | Reads non-sensitive inventory and dashboard data in assigned branches. The current catalog has no narrowly scoped sales mutation key, so none is granted. |
| Inventory Staff | Assigned branches (`QC-MAIN`) | Reads and maintains vehicle records in assigned branches without sensitive financial access. |
| Viewer | Assigned branches (`QC-MAIN`) | Read-only access to non-sensitive inventory and dashboard data in assigned branches. |

The Task 5 schema deliberately allows active, branch-authorized members to
read ordinary vehicles and non-sensitive dashboard snapshots without a
`vehicles.read` or `reports.read` mapping. Those keys do not exist in the
reviewed catalog and are therefore not invented by this seed.

`settings.manage` can update organization settings, `users.manage` can
administer organization memberships, and `modules.manage` changes tenant
entitlements. They remain Owner-only because the Phase 1 catalog does not yet
contain branch-limited variants. Similarly, the current vehicle-financial RLS
policies require `financials.view_sensitive` for every operation, despite the
key's read-oriented name. Keeping it Owner-only prevents Sales Agent,
Inventory Staff, Branch Manager, and Viewer access to acquisition value,
invested value, expected profit, receivables, and the sensitive financial
dashboard payload.

## Module entitlement

The global Task 5 catalog remains unchanged:

| Module | Apex state |
| --- | --- |
| Dealership | Enabled |
| Fleet Management | Disabled |
| Vehicle Rental | Disabled |

No Fleet Management or Vehicle Rental domain rows or tables are seeded.

## Demo identity bootstrap

`supabase/seed.sql` installs rows that do not depend on Auth: the organization,
branch, module entitlement, roles, role permissions, vehicles, separated
vehicle financials, dashboard snapshots, and system-attributed audit entries.
It cannot safely create profiles first because `profiles.id` references
`auth.users.id`.

Run `scripts/create-demo-users.mjs` only in a trusted administrative process
after the database seed has been applied. It reads these values from that
process only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_USER_PASSWORD`

The password supplies only newly created Auth users. A repeat run deliberately
finds an existing email, confirms and reconciles that identity, and preserves
its current password instead of silently rotating credentials. The script then
upserts the matching profile, active membership, exact QC-MAIN assignment, and
dashboard notification. It prints the email and `created`/`reconciled` status,
never the password, service key, or connection URL.

The wholly fictional demo emails are:

- `owner@apex-autohaus.example`
- `branch.manager@apex-autohaus.example`
- `sales.agent@apex-autohaus.example`
- `inventory.staff@apex-autohaus.example`
- `viewer@apex-autohaus.example`

The service-role key must never be placed in a `NEXT_PUBLIC_` variable or
imported by application code under `src/`.
