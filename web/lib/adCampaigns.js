import { normalizeAdRecord, sortAds } from './adHelpers';
import { getPlanDurationDays, getPlanLimits, getPlanRevenue } from './adPlans';
import { deriveCampaignState, isCampaignLive as isDerivedCampaignLive } from './campaignStatus';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasTarget(value) {
  return String(value || '').trim().length > 0;
}

export function planRevenue(plan) {
  return getPlanRevenue(plan);
}

export function isCampaignLive(item = {}) {
  return isDerivedCampaignLive(item);
}

export async function syncCampaignStatuses(supabase, rows = []) {
  const synced = [];
  for (const row of rows) {
    const next = deriveCampaignState(row);
    const nextStatus = next.status;
    const nextActive = next.active;
    const currentStatus = normalize(row.status);
    const currentActive = row.active === true || row.is_active === true;
    if (currentStatus !== nextStatus || currentActive !== nextActive) {
      try {
        const { data } = await supabase
          .from('ad_campaigns')
          .update({ status: nextStatus, active: nextActive })
          .eq('id', row.id)
          .select('*')
          .single();
        synced.push(data || { ...row, status: nextStatus, active: nextActive });
      } catch {
        synced.push({ ...row, status: nextStatus, active: nextActive });
      }
    } else {
      synced.push(row);
    }
  }
  return synced;
}

function mismatch(targetValue, ctxValue) {
  if (!hasTarget(targetValue)) return false;
  if (!hasTarget(ctxValue)) return false;
  return normalize(targetValue) !== normalize(ctxValue);
}

export function scoreCampaign(item = {}, ctx = {}) {
  if (ctx.slot && normalize(item.slot_key || item.slot) !== normalize(ctx.slot)) return -999;
  if (mismatch(item.page_key || item.page, ctx.page)) return -999;
  if (mismatch(item.category || item.category_key, ctx.category)) return -999;
  if (mismatch(item.country || item.country_code, ctx.country)) return -999;
  if (mismatch(item.state || item.province, ctx.state)) return -999;
  if (mismatch(item.city, ctx.city)) return -999;

  let score = 100;
  if (hasTarget(item.page_key || item.page) && normalize(item.page_key || item.page) === normalize(ctx.page)) score += 25;
  if (hasTarget(item.category || item.category_key) && normalize(item.category || item.category_key) === normalize(ctx.category)) score += 22;
  if (hasTarget(item.country || item.country_code) && normalize(item.country || item.country_code) === normalize(ctx.country)) score += 15;
  if (hasTarget(item.state || item.province) && normalize(item.state || item.province) === normalize(ctx.state)) score += 8;
  if (hasTarget(item.city) && normalize(item.city) === normalize(ctx.city)) score += 8;
  score += Number(item.plan_rank || 0) * 10;
  score -= Math.min(30, Number(item.impressions || 0) * 0.1);
  score -= Math.min(15, Number(item.clicks || 0) * 0.2);
  return score;
}

export function pickCampaigns(rows = [], ctx = {}, limit = 1) {
  const normalized = sortAds((rows || []).map(normalizeAdRecord)).filter(isCampaignLive);
  const scored = normalized
    .map((item) => ({ item, score: scoreCampaign(item, ctx) }))
    .filter((entry) => entry.score > -900)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (Number(b.item.plan_rank || 0) !== Number(a.item.plan_rank || 0)) return Number(b.item.plan_rank || 0) - Number(a.item.plan_rank || 0);
      return new Date(b.item.created_at || 0).getTime() - new Date(a.item.created_at || 0).getTime();
    });

  return scored.slice(0, Math.max(1, Number(limit || 1))).map((entry) => entry.item);
}

export function summarizeCampaigns(rows = []) {
  const mapped = (rows || []).map((item) => {
    const impressions = Number(item.impressions || 0);
    const clicks = Number(item.clicks || 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const revenueEstimate = planRevenue(item.plan_key || item.plan || item.plan_name);
    const days = getPlanDurationDays(item.plan_key || item.plan || item.plan_name);
    const limits = getPlanLimits(item.plan_key || item.plan || item.plan_name);
    return { ...item, impressions, clicks, ctr, revenueEstimate, durationDays: days, limits };
  });
  const summary = mapped.reduce((acc, item) => {
    acc.campaigns += 1;
    acc.impressions += Number(item.impressions || 0);
    acc.clicks += Number(item.clicks || 0);
    acc.revenueEstimate += Number(item.revenueEstimate || 0);
    if (isCampaignLive(item)) acc.active += 1;
    return acc;
  }, { campaigns: 0, active: 0, impressions: 0, clicks: 0, revenueEstimate: 0 });
  summary.ctr = summary.impressions > 0 ? Number(((summary.clicks / summary.impressions) * 100).toFixed(2)) : 0;
  return { rows: mapped, summary };
}
