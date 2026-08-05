# Core workflow and product boundary

## Phase 1 flow

1. A user authenticates through Supabase or selects a fictional demo role locally.
2. CarSys resolves one active organization membership, role permissions, scope, and branch assignments.
3. The protected application shell renders only permitted navigation.
4. Dashboard data is shaped through a stable contract with financial values omitted for unauthorized roles.
5. Owners manage company identity, review modules, and validate user invitations.
6. RLS remains the final tenant, branch, and sensitive-data boundary.

## Vehicle lifecycle contract

Phase 1 defines these workflow states:

```text
acquired
→ for_inspection
→ for_repair_or_preparation
→ ready_for_listing
→ available
→ reserved
→ sold
→ released
```

Exception states are `withdrawn`, `returned_to_supplier`, `written_off`, and `archived`.

Phase 2 adds the transition history, inspection details, preparation tasks, media, documents, and validation rules required to operate this lifecycle rather than merely summarize it.

## Dashboard contract

The dashboard consumes:

- Inventory totals and workflow counts
- Six-month unit and booked-revenue series
- Priority alerts
- Upcoming test-drive previews
- Inventory-aging previews
- Financial summary only when authorized

`dashboard_snapshots` is a temporary read-model boundary for workflows whose source tables arrive in later phases. Components do not need to change when snapshot producers are replaced with live aggregate queries.

## Future modules

Fleet Management and Vehicle Rental reuse the shared identity, tenancy, branch, notification, storage, and audit contracts. They remain disabled and noninteractive until their domain workflows and commercial enablement process are specified.
