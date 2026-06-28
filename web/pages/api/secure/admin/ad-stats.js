import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { requireUser } from '../../../../lib/auth';
import { isAdmin } from '../../../../lib/permissions';
import { AD_PLANS } from '../../../../data/adPlans';
import { syncCampaignStatuses } from '../../../../lib/adCampaigns';

const PLAN_VALUES = AD_PLANS.reduce((acc, item) => {
  acc[String(item.key || '').trim().toUpperCase()] = Number(item.price || 0);
  acc[String(item.name || '').trim().toUpperCase()] = Number(item.price || 0);
  return acc;
}, { FREE: 0, OWNER_FREE: 0 });

function normalizePlan(plan) {
  return String(plan || '').trim().toUpperCase();
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await isAdmin(user.id, user.email))) return res.status(403).json({ error: 'Solo admin' });

  const supabase = getSupabaseServer();

  const { data: campaigns, error: campaignsError } = await supabase
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (campaignsError) {
    return res.status(500).json({ error: campaignsError.message });
  }

  const { data: events } = await supabase
    .from('analytics_events')
    .select('campaign_id, event_type, ad_campaign_id');

  const eventsByCampaign = {};
  for (const event of events || []) {
    const key = event.campaign_id || event.ad_campaign_id;
    if (!key) continue;
    if (!eventsByCampaign[key]) {
      eventsByCampaign[key] = { impressions: 0, clicks: 0 };
    }
    if (event.event_type === 'impression') eventsByCampaign[key].impressions += 1;
    if (event.event_type === 'click') eventsByCampaign[key].clicks += 1;
  }

  const syncedCampaigns = await syncCampaignStatuses(supabase, campaigns || []);
  const rows = syncedCampaigns.map((campaign) => {
    const stats = eventsByCampaign[campaign.id] || { impressions: 0, clicks: 0 };
    const clicks = Number(stats.clicks || campaign.clicks || 0);
    const impressions = Number(stats.impressions || campaign.impressions || 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const revenueEstimate = PLAN_VALUES[normalizePlan(campaign.plan_key || campaign.plan)] ?? 0;

    return {
      ...campaign,
      impressions,
      clicks,
      ctr,
      revenueEstimate,
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.campaigns += 1;
      acc.impressions += Number(row.impressions || 0);
      acc.clicks += Number(row.clicks || 0);
      acc.revenueEstimate += Number(row.revenueEstimate || 0);
      return acc;
    },
    { campaigns: 0, impressions: 0, clicks: 0, revenueEstimate: 0 }
  );

  summary.ctr = summary.impressions > 0 ? Number(((summary.clicks / summary.impressions) * 100).toFixed(2)) : 0;

  return res.status(200).json({ summary, campaigns: rows });
}
