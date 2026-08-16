export const AD_PLAN_CONFIG = {
  FREE: { key: 'FREE', label: 'Free', days: 0, maxListings: 3, maxPremiumListings: 0, maxCampaigns: 0, maxActiveCampaigns: 0, analytics: false, companyPanel: false, revenue: 0 },
  PRO: { key: 'PRO', label: 'Pro', days: 30, maxListings: 25, maxPremiumListings: 3, maxCampaigns: 0, maxActiveCampaigns: 0, analytics: true, companyPanel: false, revenue: 29 },
  BUSINESS: { key: 'BUSINESS', label: 'Business', days: 30, maxListings: 200, maxPremiumListings: 30, maxCampaigns: 30, maxActiveCampaigns: 30, analytics: true, companyPanel: true, revenue: 99 },
  OWNER_FREE: { key: 'OWNER_FREE', label: 'Owner Free', days: 30, maxListings: 999999, maxPremiumListings: 999999, maxCampaigns: 99, maxActiveCampaigns: 99, analytics: true, companyPanel: true, revenue: 0 },
  BASICO: { key: 'BASICO', label: 'Básico', days: 7, maxCampaigns: 3, maxActiveCampaigns: 1, revenue: 25000 },
  DESTACADO: { key: 'DESTACADO', label: 'Destacado', days: 15, maxCampaigns: 8, maxActiveCampaigns: 3, revenue: 65000 },
  PREMIUM: { key: 'PREMIUM', label: 'Premium', days: 30, maxCampaigns: 20, maxActiveCampaigns: 8, revenue: 145000 },
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
    maxListings: Number(config.maxListings || 0),
    maxPremiumListings: Number(config.maxPremiumListings || 0),
    maxCampaigns: Number(config.maxCampaigns || 0),
    maxActiveCampaigns: Number(config.maxActiveCampaigns || 0),
    analytics: Boolean(config.analytics),
    companyPanel: Boolean(config.companyPanel),
  };
}

export function addDays(dateValue, days) {
  const date = new Date(dateValue || Date.now());
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString();
}
