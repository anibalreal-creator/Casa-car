import { requireUser } from '../../../../lib/auth';
import { getCurrentMembership } from '../../../../lib/permissions';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { getPlanLimits, normalizePlanKey } from '../../../../lib/adPlans';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseServer();

  try {
    const membership = await getCurrentMembership(user.id).catch(() => ({ plan: 'FREE', active: false }));
    const planKey = membership?.active ? normalizePlanKey(membership?.plan) : 'FREE';
    const limits = getPlanLimits(planKey);

    const [{ count: campaignCount }, { count: activeCampaignCount }, { count: listingCount }] = await Promise.all([
      supabase.from('ad_campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('ad_campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    return res.status(200).json({
      planKey,
      membershipActive: Boolean(membership?.active),
      limits,
      usage: {
        campaigns: Number(campaignCount || 0),
        activeCampaigns: Number(activeCampaignCount || 0),
        listings: Number(listingCount || 0),
      },
      canCreateCampaign: Number(campaignCount || 0) < Number(limits.maxCampaigns || 0),
      canActivateCampaign: Number(activeCampaignCount || 0) < Number(limits.maxActiveCampaigns || 0),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
