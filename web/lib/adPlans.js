export const AD_PLAN_CONFIG = {
  FREE: { key: 'FREE', label: 'Free', days: 0, maxCampaigns: 0, maxActiveCampaigns: 0, revenue: 0 },
  OWNER_FREE: { key: 'OWNER_FREE', label: 'Owner Free', days: 30, maxCampaigns: 99, maxActiveCampaigns: 99, revenue: 0 },
  BASICO: { key: 'BASICO', label: 'Básico', days: 7, maxCampaigns: 3, maxActiveCampaigns: 1, revenue: 500 },
  DESTACADO: { key: 'DESTACADO', label: 'Destacado', days: 15, maxCampaigns: 8, maxActiveCampaigns: 3, revenue: 1000 },
  PREMIUM: { key: 'PREMIUM', label: 'Premium', days: 30, maxCampaigns: 20, maxActiveCampaigns: 8, revenue: 1500 },
};

export function normalizePlanKey(value) {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'BASIC') return 'BASICO';
  if (key === 'FEATURED') return 'DESTACADO';
  if (key === 'PREMIUN') return 'PREMIUM';
  return key || 'FREE';
}

export function getPlanConfig(value) {
  return AD_PLAN_CONFIG[normalizePlanKey(value)] || AD_PLAN_CONFIG.FREE;
}

export function getPlanDurationDays(value) {
  return Number(getPlanConfig(value).days || 0);
}

export function getPlanRevenue(value) {
  return Number(getPlanConfig(value).revenue || 0);
}

export function getPlanLimits(value) {
  const config = getPlanConfig(value);
  return {
    maxCampaigns: Number(config.maxCampaigns || 0),
    maxActiveCampaigns: Number(config.maxActiveCampaigns || 0),
  };
}

export function addDays(dateValue, days) {
  const date = new Date(dateValue || Date.now());
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString();
}
