begin;
select plan(5);
select results_eq($$select count(*)::int from public.organizations where slug = 'apex-autohaus'$$, array[1], 'Apex organization exists');
select results_eq($$select count(*)::int from public.branches where code = 'QC-MAIN'$$, array[1], 'QC Main exists');
select results_eq($$select count(*)::int from public.roles where is_system = true$$, array[5], 'Five default roles exist');
select results_eq($$select count(*)::int from public.organization_modules om join public.modules m on m.id = om.module_id where om.enabled and m.key = 'dealership'$$, array[1], 'Dealership is enabled');
select results_eq($$select count(*)::int from public.organization_modules om join public.modules m on m.id = om.module_id where om.enabled and m.key in ('fleet_management', 'vehicle_rental')$$, array[0], 'Future modules are disabled');
select * from finish();
rollback;
