import { getAdPlan } from '../data/adPlans';

export function getCampaignDurationDays(campaign = {}) {
  const plan = getAdPlan(campaign.plan_key || campaign.plan || 'basico');
  return Number(campaign.duration_days || plan.durationDays || 7);
}

export function addDaysIso(days = 7, fromIso) {
  const base = fromIso ? new Date(fromIso) : new Date();
  base.setDate(base.getDate() + Number(days || 0));
  return base.toISOString();
}

export function normalizeCampaignStatus(status = '') {
  return String(status || '').trim().toLowerCase();
}

export function deriveCampaignState(campaign = {}) {
  const status = normalizeCampaignStatus(campaign.status);
  const now = Date.now();
  const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null;
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;

  if ([ 'paused', 'draft' ].includes(status)) {
    return { status, active: false };
  }

  if ([ 'pending', 'pending_payment', 'payment_pending', 'awaiting_payment' ].includes(status)) {
    return { status: status || 'pending_payment', active: false };
  }

  if (endsAt && !Number.isNaN(endsAt) && endsAt <= now) {
    return { status: 'expired', active: false };
  }

  if (startsAt && !Number.isNaN(startsAt) && startsAt > now) {
    return { status: 'scheduled', active: false };
  }

  if ([ 'scheduled', 'active', 'approved', 'paid' ].includes(status) || campaign.active || campaign.is_active) {
    return { status: 'active', active: true };
  }

  return { status: status || 'draft', active: !!campaign.active };
}

export function patchForCampaignAction(campaign = {}, action = '') {
  const normalizedAction = String(action || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const durationDays = getCampaignDurationDays(campaign);

  if (normalizedAction === 'activate') {
    const startsAt = campaign.starts_at || nowIso;
    const endsAt = campaign.ends_at || addDaysIso(durationDays, startsAt);
    return {
      status: 'active',
      active: true,
      is_active: true,
      starts_at: startsAt,
      ends_at: endsAt,
      approved_at: campaign.approved_at || nowIso,
      mercadopago_status: campaign.mercadopago_status || 'manual_activation',
    };
  }

  if (normalizedAction === 'pause') {
    return {
      status: 'paused',
      active: false,
      is_active: false,
    };
  }

  if (normalizedAction === 'expire') {
    return {
      status: 'expired',
      active: false,
      is_active: false,
      ends_at: nowIso,
    };
  }

  if (normalizedAction === 'schedule') {
    const startsAt = campaign.starts_at || addDaysIso(1);
    const endsAt = campaign.ends_at || addDaysIso(durationDays, startsAt);
    return {
      status: 'scheduled',
      active: false,
      is_active: false,
      starts_at: startsAt,
      ends_at: endsAt,
    };
  }

  return {};
}
