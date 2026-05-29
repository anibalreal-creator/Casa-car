import { requireUser } from '../../../../lib/auth';
import { getCurrentMembership } from '../../../../lib/permissions';
import { isOwnerEmail, ownerMembership } from '../../../../lib/owner';
import { getSupabaseServer } from '../../../../lib/supabaseServer';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const supabase = getSupabaseServer();
  const membership = isOwnerEmail(user.email) ? ownerMembership() : await getCurrentMembership(user.id).catch(() => ({ plan: 'FREE', active: false }));

  try {
    const [{ data: campaigns }, { data: listings }] = await Promise.all([
      supabase.from('ad_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('listings').select('id, title, views, is_premium, highlighted, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);

    const activeAds = (campaigns || []).filter((x) => x.active || x.status === 'active').length;
    const impressions = (campaigns || []).reduce((acc, item) => acc + Number(item.impressions || 0), 0);
    const clicks = (campaigns || []).reduce((acc, item) => acc + Number(item.clicks || 0), 0);
    const ctr = impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      membership,
      metrics: {
        campaigns: (campaigns || []).length,
        activeAds,
        premiumListings: (listings || []).filter((x) => x.is_premium || x.highlighted).length,
        totalViews: (listings || []).reduce((acc, x) => acc + Number(x.views || 0), 0),
        impressions,
        clicks,
        ctr,
      },
      campaigns: campaigns || [],
      listings: listings || [],
      verification: { verified: false, pending: false, latestRequest: null },
    });
  } catch (error) {
    return res.status(200).json({
      membership,
      metrics: { campaigns: 0, activeAds: 0, premiumListings: 0, totalViews: 0, impressions: 0, clicks: 0, ctr: 0 },
      campaigns: [], listings: [], verification:{ verified:false, pending:false, latestRequest:null },
      warning: error.message || 'No se pudieron cargar métricas reales',
    });
  }
}
