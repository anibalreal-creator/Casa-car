import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { requireUser } from '../../../../lib/auth';
import { isAdmin } from '../../../../lib/permissions';
import { ok, fail, methodNotAllowed } from '../../../../lib/api';
import { isCampaignLive } from '../../../../lib/campaignStatus';
import { normalizeAdRecord } from '../../../../lib/adHelpers';
import { syncCampaignStatuses } from '../../../../lib/adCampaigns';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!(await isAdmin(user.id))) return res.status(403).json({ error: 'Solo admin' });

    const supabase = getSupabaseServer();
    const [profiles, listings, campaigns, reviews, reports, subs, requests] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id,status,is_premium', { count: 'exact' }),
      supabase.from('ad_campaigns').select('*', { count: 'exact' }),
      supabase.from('reviews').select('id,rating', { count: 'exact' }),
      supabase.from('listing_reports').select('id,status', { count: 'exact' }),
      supabase.from('subscriptions').select('id,plan,active', { count: 'exact' }),
      supabase.from('verification_requests').select('id,status', { count: 'exact' }),
    ]);

    const campaignRows = (await syncCampaignStatuses(supabase, campaigns.data || [])).map(normalizeAdRecord);
    const ctr = campaignRows.reduce((acc, item) => {
      const impressions = Number(item.impressions || 0);
      const clicks = Number(item.clicks || 0);
      return acc + (impressions ? clicks / impressions : 0);
    }, 0);

    return ok(res, {
      users: profiles.count || 0,
      listings: listings.count || 0,
      premiumListings: (listings.data || []).filter((item) => item.is_premium).length,
      activeListings: (listings.data || []).filter((item) => item.status === 'active').length,
      campaigns: campaigns.count || 0,
      activeCampaigns: campaignRows.filter(isCampaignLive).length,
      reports: reports.count || 0,
      pendingReports: (reports.data || []).filter((item) => item.status === 'pending').length,
      subscriptions: subs.count || 0,
      activeSubscriptions: (subs.data || []).filter((item) => item.active).length,
      verificationRequests: requests.count || 0,
      pendingVerificationRequests: (requests.data || []).filter((item) => item.status === 'pending').length,
      reviewCount: reviews.count || 0,
      averageRating: (() => {
        const rows = reviews.data || [];
        if (!rows.length) return 0;
        return Number((rows.reduce((acc, item) => acc + Number(item.rating || 0), 0) / rows.length).toFixed(2));
      })(),
      averageCampaignCtr: Number((campaignRows.length ? ctr / campaignRows.length : 0).toFixed(4)),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail(res, error, 'No se pudo cargar el overview');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
