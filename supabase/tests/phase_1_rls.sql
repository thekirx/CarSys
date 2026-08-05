begin;
select plan(19);
select has_table('public', 'organizations');
select has_table('public', 'organization_memberships');
select has_table('public', 'roles');
select has_table('public', 'branches');
select has_table('public', 'membership_branches');
select has_table('public', 'vehicles');
select has_table('public', 'vehicle_financials');
select has_table('public', 'dashboard_snapshots');
select has_table('public', 'notifications');
select has_table('public', 'audit_logs');
select isnt_empty($$select 1 from pg_class where relname = 'organizations' and relrowsecurity$$, 'organizations has RLS enabled');
select isnt_empty($$select 1 from pg_class where relname = 'vehicles' and relrowsecurity$$, 'vehicles has RLS enabled');
select isnt_empty($$select 1 from pg_class where relname = 'vehicle_financials' and relrowsecurity$$, 'vehicle financials has RLS enabled');
select has_function('private', 'is_active_member', array['uuid']);
select has_function('private', 'has_permission', array['uuid','text']);
select has_function('private', 'can_access_branch', array['uuid','uuid']);
select has_function('private', 'storage_organization_id', array['text']);
select results_eq(
  $$select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'dashboard_snapshots' and cmd <> 'SELECT'$$,
  array[0],
  'authenticated users cannot mutate dashboard snapshots'
);
select results_eq(
  $$select count(*)::int from information_schema.table_constraints where table_schema = 'public' and table_name = 'vehicle_financials' and constraint_type = 'FOREIGN KEY'$$,
  array[2],
  'vehicle financials enforce both vehicle identity and organization ownership'
);
select * from finish();
rollback;
