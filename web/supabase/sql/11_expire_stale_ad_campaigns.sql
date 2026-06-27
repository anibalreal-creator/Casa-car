-- Limpieza de campanias publicitarias vencidas o dadas de baja.
-- No borra historial: deja fuera de pantalla todo lo que no debe mostrarse.

begin;

do $$
declare
  has_updated_at boolean;
  has_is_active boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ad_campaigns'
      and column_name = 'updated_at'
  ) into has_updated_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ad_campaigns'
      and column_name = 'is_active'
  ) into has_is_active;

  execute format(
    'update public.ad_campaigns
       set status = ''expired'',
           active = false%s%s
     where ends_at is not null
       and ends_at <= now()
       and lower(coalesce(status, '''')) not in (
         ''archived'', ''cancelled'', ''canceled'', ''cancelled_by_user'', ''canceled_by_user'',
         ''deleted'', ''expired'', ''inactive'', ''paused'', ''rejected''
       )',
    case when has_is_active then ', is_active = false' else '' end,
    case when has_updated_at then ', updated_at = now()' else '' end
  );

  execute format(
    'update public.ad_campaigns
       set status = ''expired'',
           active = false%s%s
     where ends_at is null
       and coalesce(starts_at, created_at) is not null
       and lower(coalesce(status, '''')) in (''active'', ''active_manual'', ''active_paid'', ''approved'', ''paid'')
       and coalesce(starts_at, created_at) + (
         case lower(coalesce(plan_key, ''basico''))
           when ''premium'' then interval ''30 days''
           when ''destacado'' then interval ''15 days''
           when ''featured'' then interval ''15 days''
           when ''business'' then interval ''30 days''
           when ''pro'' then interval ''30 days''
           else interval ''7 days''
         end
       ) <= now()',
    case when has_is_active then ', is_active = false' else '' end,
    case when has_updated_at then ', updated_at = now()' else '' end
  );

  execute format(
    'update public.ad_campaigns
       set active = false%s%s
     where lower(coalesce(status, '''')) in (
       ''archived'', ''cancelled'', ''canceled'', ''cancelled_by_user'', ''canceled_by_user'',
       ''deleted'', ''expired'', ''inactive'', ''paused'', ''rejected''
     )',
    case when has_is_active then ', is_active = false' else '' end,
    case when has_updated_at then ', updated_at = now()' else '' end
  );
end $$;

create index if not exists idx_ad_campaigns_slot_dates
  on public.ad_campaigns (slot_key, starts_at, ends_at);

create index if not exists idx_ad_campaigns_status_active
  on public.ad_campaigns (status, active);

commit;
