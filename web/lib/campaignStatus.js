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

export function isTerminalCampaignStatus(status = '') {
  return [
    'archived',
    'cancelled',
    'canceled',
    'cancelled_by_user',
    'canceled_by_user',
    'deleted',
    'draft',
    'inactive',
    'paused',
    'rejected',
  ].includes(normalizeCampaignStatus(status));
}

export function isPendingCampaignStatus(status = '') {
  return [
    'awaiting_payment',
    'pending',
    'pending_payment',
    'payment_pending',
  ].includes(normalizeCampaignStatus(status));
}

export function isPaidActiveCampaignStatus(status = '') {
  return [
    'active',
    'active_manual',
    'active_paid',
    'approved',
    'paid',
  ].includes(normalizeCampaignStatus(status));
}

export function deriveCampaignState(campaign = {}) {
  const status = normalizeCampaignStatus(campaign.status);
  const now = Date.now();
  const startsAtIso = campaign.starts_at || campaign.start_date || campaign.approved_at || campaign.created_at || null;
  const endsAtIso = campaign.ends_at || campaign.end_date || null;
  const startsAt = startsAtIso ? new Date(startsAtIso).getTime() : null;
  let endsAt = endsAtIso ? new Date(endsAtIso).getTime() : null;

  if (!endsAt && startsAt && Number.isFinite(startsAt) && (isPaidActiveCampaignStatus(status) || campaign.active || campaign.is_active)) {
    const durationMs = getCampaignDurationDays(campaign) * 24 * 60 * 60 * 1000;
    if (durationMs > 0) endsAt = startsAt + durationMs;
  }

  if (isTerminalCampaignStatus(status)) {
    return { status, active: false };
  }

  if (isPendingCampaignStatus(status)) {
    return { status: status || 'pending_payment', active: false };
  }

  if (endsAt && !Number.isNaN(endsAt) && endsAt <= now) {
    return { status: 'expired', active: false };
  }

  if (startsAt && !Number.isNaN(startsAt) && startsAt > now) {
    return { status: 'scheduled', active: false };
  }

  if (status === 'scheduled') {
    return { status: 'active', active: true };
  }

  const explicitlyInactive =
    (campaign.active === false && campaign.is_active !== true) ||
    (campaign.is_active === false && campaign.active !== true);
  if (explicitlyInactive) {
    return { status: status || 'paused', active: false };
  }

  if (isPaidActiveCampaignStatus(status) || campaign.active || campaign.is_active) {
    return { status: 'active', active: true };
  }

  return { status: status || 'draft', active: !!campaign.active };
}

export function isCampaignLive(campaign = {}) {
  return deriveCampaignState(campaign).active === true;
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
    };
  }

  if (normalizedAction === 'expire') {
    return {
      status: 'expired',
      active: false,
      ends_at: nowIso,
    };
  }

  if (normalizedAction === 'schedule') {
    const startsAt = campaign.starts_at || addDaysIso(1);
    const endsAt = campaign.ends_at || addDaysIso(durationDays, startsAt);
    return {
      status: 'scheduled',
      active: false,
      starts_at: startsAt,
      ends_at: endsAt,
    };
  }

  return {};
}
