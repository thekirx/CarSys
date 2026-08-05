# CarSys — Apex Autohaus Phase 1

CarSys is a secure vehicle-operations command center for Philippine dealerships. Phase 1 establishes the application shell, Supabase authentication and Row Level Security, organization and branch isolation, role-aware navigation, a dealership dashboard, company/module settings, user-access management, demo data, and the contracts used by later operational phases.

## Delivered in Phase 1

- Responsive Next.js 16 App Router dashboard and application shell
- Cookie-backed Supabase authentication utilities and protected route context
- Five demo roles: Owner, Branch Manager, Sales Agent, Inventory Staff, and Viewer
- Permission-aware navigation and branch access helpers
- Sensitive-financial-data separation through `vehicle_financials`
- Company settings, module catalog, and Owner user-management surfaces
- Read-only Phase 1 inventory view with search and status filtering
- Multi-tenant Supabase schema, RLS policies, private storage policies, seed data, and pgTAP contracts
- Vitest unit tests and Playwright role-access smoke tests
- Built-in demo mode that works before Supabase is connected


## Continue from this handoff ZIP

The archive includes a Git repository on branch `feat/phase-1-foundation`, with `origin` pointing to `https://github.com/thekirx/CarSys.git`. After extracting it:

```bash
cd CarSys-complete
git status
corepack enable
pnpm install
pnpm verify
git push -u origin feat/phase-1-foundation
```

Then open a pull request from `feat/phase-1-foundation` into `main`. Do not add `.env.local` or a service-role key to Git.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Supabase PostgreSQL, Auth, Storage, SSR cookies, and RLS
- Zod, React Hook Form-compatible contracts, Recharts-ready dashboard contracts, Lucide icons
- Vitest, Testing Library, Playwright, and pgTAP

## Prerequisites

- Node.js 22+
- pnpm 10+
- Supabase CLI for local database tests
- Docker Desktop when using `supabase start`

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. With `NEXT_PUBLIC_CARSYS_DEMO_MODE=true`, no external credentials are required. The sign-in page offers one-click demo access for every role.

### Demo-role URLs

- Owner: `/auth/demo?role=owner`
- Branch Manager: `/auth/demo?role=branch-manager`
- Sales Agent: `/auth/demo?role=sales-agent`
- Inventory Staff: `/auth/demo?role=inventory-staff`
- Viewer: `/auth/demo?role=viewer`

Demo mode stores only the selected role in an HTTP-only cookie. It does not bypass production authorization: when Supabase variables are configured and demo mode is disabled, access is resolved from active database membership records.

## Environment variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CARSYS_DEMO_MODE=false
```

Administrative seeding uses server-only values and must never be exposed to browser code:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=server_only_key
DEMO_DEFAULT_PASSWORD=choose_a_private_demo_password
```

Only server-only administrative code reads the service-role key: the demo-user seed script and the Owner invitation action. No Client Component can import it, and it is never exposed with a `NEXT_PUBLIC_` name.

## Supabase setup

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For a local environment:

```bash
supabase start
supabase db reset
supabase test db
```

The migration creates the organization, module, role, permission, branch, vehicle, dashboard, notification, audit, and private-storage contracts. `supabase/seed.sql` adds the fictional Apex Autohaus organization, Quezon City Main branch, 25 vehicles, default roles and permissions, dashboard snapshots, alerts, and an audit record.

Create the five Auth demo identities only after the migration and seed have been applied:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
DEMO_DEFAULT_PASSWORD=... \
pnpm seed:users
```

The script prints email addresses but never prints passwords or secret keys.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
supabase test db
pnpm test:e2e
pnpm build
```

The browser tests run with demo mode enabled so role visibility and protected settings can be verified without remote credentials. Database tests require the Supabase local stack. The repository archive does not include a generated `pnpm-lock.yaml` because its build environment could not reach the npm registry; running `pnpm install` locally creates the lockfile before the first verified commit.

## Production deployment

1. Create a Supabase project and apply the migration.
2. Run the seed only for demo or staging environments.
3. Create production Auth users through a controlled administrative process.
4. Add the public Supabase URL and publishable key to Vercel.
5. Keep `NEXT_PUBLIC_CARSYS_DEMO_MODE=false` in production.
6. Do not add the service-role key unless a server-only administrative endpoint genuinely requires it.
7. Deploy with `pnpm build` as the build command.

## Security model

Every business table has Row Level Security. Application-level hiding is only a usability layer; database policies remain the final boundary. Active organization membership is checked independently from navigation. Branch-scoped users can only access assigned branches. Sensitive acquisition, preparation, and minimum-price values are held in `vehicle_financials`, which requires `financials.view_sensitive`.

See:

- `docs/architecture/security.md`
- `docs/architecture/database-schema.md`
- `docs/architecture/role-permission-matrix.md`
- `docs/architecture/core-workflow.md`

## Current limitations and next phases

Phase 1 intentionally uses seeded dashboard read models and a read-only inventory preview. It does not yet implement the complete vehicle-detail workflow, customer matching, live test-drive scheduling, deal/payment processing, or complete operational reports.

- Phase 2: vehicle details, workflow history, inspections, preparation tasks, media, and documents
- Phase 3: expenses, profitability, customers, requests, matching, and notifications
- Phase 4: test drives, reservations, deals, payments, receivables, and release
- Phase 5: final reporting, audit experience, operational polish, and full demo-flow QA

Fleet Management and Vehicle Rental remain visible only as disabled upgrades inside Owner module settings.
