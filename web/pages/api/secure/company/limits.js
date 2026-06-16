import { requireUser } from '../../../../lib/auth';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { getListingLimitState } from '../../../../lib/listingLimits';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseServer();

  try {
    const listingState = await getListingLimitState(supabase, user);
    const { planKey, membershipActive, limits, usage } = listingState;
    const canUseCompanyPanel = Boolean(listingState.ownerMode || limits.companyPanel);

    return res.status(200).json({
      planKey,
      membershipActive,
      limits,
      usage: {
        campaigns: Number(usage?.campaigns || 0),
        activeCampaigns: Number(usage?.activeCampaigns || 0),
        listings: Number(usage?.listings || 0),
        premiumListings: Number(usage?.premiumListings || 0),
      },
      canCreateCampaign: canUseCompanyPanel && Number(usage?.campaigns || 0) < Number(limits.maxCampaigns || 0),
      canActivateCampaign: canUseCompanyPanel && Number(usage?.activeCampaigns || 0) < Number(limits.maxActiveCampaigns || 0),
      canCreateListing: Number(usage?.listings || 0) < Number(limits.maxListings || 0),
      canActivatePremium: Number(usage?.premiumListings || 0) < Number(limits.maxPremiumListings || 0),
      canUseCompanyPanel,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
