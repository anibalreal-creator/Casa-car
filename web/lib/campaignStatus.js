import { getAdPlan } from '../data/adPlans';

export function getCampaignDurationDays(campaign = {}) {
  const planKey = String(campaign.plan_key || campaign.plan || 'basico').trim().toLowerCase();
  const plan = getAdPlan(planKey);
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
  let computedEndsAtIso = endsAtIso || null;

  if (!endsAt && startsAt && Number.isFinite(startsAt) && (isPaidActiveCampaignStatus(status) || campaign.active || campaign.is_active)) {
    const durationMs = getCampaignDurationDays(campaign) * 24 * 60 * 60 * 1000;
    if (durationMs > 0) {
      endsAt = startsAt + durationMs;
      computedEndsAtIso = new Date(endsAt).toISOString();
    }
  }

  if (isTerminalCampaignStatus(status)) {
    return { status, active: false, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  if (isPendingCampaignStatus(status)) {
    return { status: status || 'pending_payment', active: false, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  if (endsAt && !Number.isNaN(endsAt) && endsAt <= now) {
    return { status: 'expired', active: false, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  if (startsAt && !Number.isNaN(startsAt) && startsAt > now) {
    return { status: 'scheduled', active: false, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  if (status === 'scheduled') {
    return { status: 'active', active: true, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  const explicitlyInactive =
    (campaign.active === false && campaign.is_active !== true) ||
    (campaign.is_active === false && campaign.active !== true);
  if (explicitlyInactive) {
    return { status: status || 'paused', active: false, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  if (isPaidActiveCampaignStatus(status) || campaign.active || campaign.is_active) {
    return { status: 'active', active: true, starts_at: startsAtIso, ends_at: computedEndsAtIso };
  }

  return { status: status || 'draft', active: !!campaign.active, starts_at: startsAtIso, ends_at: computedEndsAtIso };
}

export function isCampaignLive(campaign = {}) {
  return deriveCampaignState(campaign).active === true;
}

export function patchForCampaignAction(campaign = {}, action = '') {
  const normalizedAction = String(action || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const durationDays = getCampaignDurationDays(campaign);

  if (normalizedAction === 'activate') {
    const existingEnd = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;
    const existingStart = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null;
    const keepFutureSchedule = existingStart && Number.isFinite(existingStart) && existingStart > Date.now();
    const startsAt = keepFutureSchedule ? campaign.starts_at : nowIso;
    const startsAtMs = new Date(startsAt).getTime();
    const keepExistingEnd = existingEnd && Number.isFinite(existingEnd) && existingEnd > startsAtMs;
    const endsAt = keepExistingEnd ? campaign.ends_at : addDaysIso(durationDays, startsAt);
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

export function buildCampaignStatePatch(campaign = {}) {
  const next = deriveCampaignState(campaign);
  const patch = {};
  const currentStatus = normalizeCampaignStatus(campaign.status);
  const currentActive = campaign.active === true || campaign.is_active === true;

  if (next.status !== currentStatus) patch.status = next.status;
  if (next.active !== currentActive) patch.active = next.active;
  if (Object.prototype.hasOwnProperty.call(campaign, 'is_active') && next.active !== (campaign.is_active === true)) {
    patch.is_active = next.active;
  }
  if (next.starts_at && !campaign.starts_at) patch.starts_at = next.starts_at;
  if (next.ends_at && !campaign.ends_at) patch.ends_at = next.ends_at;

  return patch;
}
