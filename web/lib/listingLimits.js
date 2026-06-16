import { getPlanLimits, normalizePlanKey } from './adPlans';
import { isOwnerEmail } from './owner';
import { getCurrentMembership } from './permissions';

const FREE_LISTING_LIMIT = 3;
const FREE_PREMIUM_LIMIT = 0;

function toPositiveLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function limitBlockedResponse({ error, reason, upgradeUrl, state }) {
  return {
    error,
    requiresPayment: true,
    reason,
    upgradeUrl: upgradeUrl || '/planes',
    planKey: state.planKey,
    membershipActive: state.membershipActive,
    limits: state.limits,
    usage: state.usage,
  };
}

async function countRows(query) {
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

async function countPremiumListings(supabase, userId, excludeListingId) {
  const baseQuery = () => {
    let query = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (excludeListingId) query = query.neq('id', String(excludeListingId));
    return query;
  };

  const attempts = [
    () => baseQuery().or('is_premium.eq.true,highlighted.eq.true'),
    () => baseQuery().eq('is_premium', true),
    () => baseQuery().eq('highlighted', true),
  ];

  let lastError = null;
  for (const build of attempts) {
    const { count, error } = await build();
    if (!error) return Number(count || 0);
    lastError = error;
  }
  throw lastError;
}

async function countActiveCampaigns(supabase, userId) {
  const baseQuery = () => supabase
    .from('ad_campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const attempts = [
    () => baseQuery().or('active.eq.true,status.eq.active,is_active.eq.true'),
    () => baseQuery().or('active.eq.true,status.eq.active'),
    () => baseQuery().or('status.eq.active,is_active.eq.true'),
    () => baseQuery().eq('status', 'active'),
    () => baseQuery().eq('active', true),
    () => baseQuery().eq('is_active', true),
  ];

  let lastError = null;
  for (const build of attempts) {
    const { count, error } = await build();
    if (!error) return Number(count || 0);
    lastError = error;
  }
  throw lastError;
}

export async function getListingLimitState(supabase, user, options = {}) {
  const ownerMode = isOwnerEmail(user?.email || '');
  const membership = ownerMode
    ? { plan: 'OWNER_FREE', active: true, expires_at: null }
    : await getCurrentMembership(user?.id).catch(() => ({ plan: 'FREE', active: false, expires_at: null }));
  const planKey = ownerMode ? 'OWNER_FREE' : (membership?.active ? normalizePlanKey(membership?.plan) : 'FREE');
  const limits = getPlanLimits(planKey);
  const maxListings = toPositiveLimit(limits.maxListings, FREE_LISTING_LIMIT);
  const maxPremiumListings = toPositiveLimit(limits.maxPremiumListings, FREE_PREMIUM_LIMIT);

  const [listingsCount, premiumListingsCount, campaignsCount, activeCampaignsCount] = await Promise.all([
    countRows(supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id)),
    countPremiumListings(supabase, user.id, options.excludeListingId),
    countRows(supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id)),
    countActiveCampaigns(supabase, user.id),
  ]);

  return {
    planKey,
    membershipActive: Boolean(ownerMode || membership?.active),
    limits: { ...limits, maxListings, maxPremiumListings },
    usage: {
      listings: listingsCount,
      premiumListings: premiumListingsCount,
      campaigns: campaignsCount,
      activeCampaigns: activeCampaignsCount,
    },
    ownerMode,
  };
}

export async function enforceListingCreationLimit(supabase, user) {
  const state = await getListingLimitState(supabase, user);
  const maxListings = Number(state.limits.maxListings || 0);
  const currentListings = Number(state.usage.listings || 0);
  const canCreateListing = currentListings < maxListings;

  return {
    ...state,
    canCreateListing,
    blockedResponse: canCreateListing ? null : limitBlockedResponse({
      error: `Ya usaste tus ${maxListings} publicaciones incluidas. Para publicar otro anuncio elegi un plan pago.`,
      reason: 'listing_limit',
      upgradeUrl: '/planes?limit=listings',
      state,
    }),
  };
}

export async function enforcePremiumActivationLimit(supabase, user, options = {}) {
  const state = await getListingLimitState(supabase, user, options);
  const maxPremiumListings = Number(state.limits.maxPremiumListings || 0);
  const currentPremiumListings = Number(state.usage.premiumListings || 0);
  const canActivatePremium = currentPremiumListings < maxPremiumListings;

  return {
    ...state,
    canActivatePremium,
    blockedResponse: canActivatePremium ? null : limitBlockedResponse({
      error: `Ya usaste tus ${maxPremiumListings} destacados premium incluidos. Para destacar otro anuncio elegi un plan superior.`,
      reason: 'premium_limit',
      upgradeUrl: '/planes?limit=premium',
      state,
    }),
  };
}

export async function enforceCampaignCreationLimit(supabase, user) {
  const state = await getListingLimitState(supabase, user);
  const maxCampaigns = Number(state.limits.maxCampaigns || 0);
  const currentCampaigns = Number(state.usage.campaigns || 0);
  const canUseCompanyPanel = Boolean(state.ownerMode || state.limits.companyPanel);
  const canCreateCampaign = canUseCompanyPanel && currentCampaigns < maxCampaigns;

  return {
    ...state,
    canUseCompanyPanel,
    canCreateCampaign,
    blockedResponse: canCreateCampaign ? null : limitBlockedResponse({
      error: canUseCompanyPanel
        ? `Ya usaste tus ${maxCampaigns} campanas incluidas en BUSINESS.`
        : 'Crear campanas y usar panel empresa requiere plan BUSINESS activo.',
      reason: canUseCompanyPanel ? 'campaign_limit' : 'business_required',
      upgradeUrl: '/planes?limit=campaigns',
      state,
    }),
  };
}

export async function enforceCampaignActivationLimit(supabase, user, options = {}) {
  const state = await getListingLimitState(supabase, user);
  const maxActiveCampaigns = Number(state.limits.maxActiveCampaigns || 0);
  const currentActiveCampaigns = Number(state.usage.activeCampaigns || 0);
  const canUseCompanyPanel = Boolean(state.ownerMode || state.limits.companyPanel);
  const alreadyActive = Boolean(options.alreadyActive);
  const canActivateCampaign = canUseCompanyPanel && (alreadyActive || currentActiveCampaigns < maxActiveCampaigns);

  return {
    ...state,
    canUseCompanyPanel,
    canActivateCampaign,
    blockedResponse: canActivateCampaign ? null : limitBlockedResponse({
      error: canUseCompanyPanel
        ? `Ya tenes ${maxActiveCampaigns} campanas activas en BUSINESS. Pausa una para activar otra.`
        : 'Activar campanas requiere plan BUSINESS activo.',
      reason: canUseCompanyPanel ? 'active_campaign_limit' : 'business_required',
      upgradeUrl: '/planes?limit=campaigns',
      state,
    }),
  };
}
