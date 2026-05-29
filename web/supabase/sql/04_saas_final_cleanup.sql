-- Casa-Car SaaS final cleanup / campañas activas

update public.ad_campaigns
set status = 'active'
where coalesce(status, 'pending_payment') in ('pending_payment','scheduled','paused')
  and starts_at is not null
  and ends_at is not null
  and now() between starts_at and ends_at;

update public.ad_campaigns
set status = 'expired'
where status <> 'expired'
  and ends_at is not null
  and now() > ends_at;
