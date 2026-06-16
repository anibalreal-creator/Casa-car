import { getPlanLimits, normalizePlanKey } from './adPlans';
import { isOwnerEmail } from './owner';
import { getCurrentMembership } from './permissions';

const FREE_LISTING_LIMIT = 3;

function toPositiveLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function getListingLimitState(supabase, user) {
  const ownerMode = isOwnerEmail(user?.email || '');
  const membership = ownerMode
    ? { plan: 'OWNER_FREE', active: true, expires_at: null }
    : await getCurrentMembership(user?.id).catch(() => ({ plan: 'FREE', active: false, expires_at: null }));
  const planKey = ownerMode ? 'OWNER_FREE' : (membership?.active ? normalizePlanKey(membership?.plan) : 'FREE');
  const limits = getPlanLimits(planKey);
  const maxListings = toPositiveLimit(limits.maxListings, FREE_LISTING_LIMIT);

  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;

  return {
    planKey,
    membershipActive: Boolean(ownerMode || membership?.active),
    limits: { ...limits, maxListings },
    usage: { listings: Number(count || 0) },
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
    blockedResponse: canCreateListing ? null : {
      error: `Ya usaste tus ${maxListings} publicaciones incluidas. Para publicar otro anuncio elegi un plan pago.`,
      requiresPayment: true,
      reason: 'listing_limit',
      upgradeUrl: '/planes?limit=listings',
      planKey: state.planKey,
      membershipActive: state.membershipActive,
      limits: state.limits,
      usage: state.usage,
    },
  };
}
