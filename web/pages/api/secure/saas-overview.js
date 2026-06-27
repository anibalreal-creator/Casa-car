import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getServerUser } from '../../../lib/auth';

const OWNER_EMAIL = 'anibalreal@hotmail.com';

function countByStatus(rows = []) {
  return rows.reduce((acc, row) => {
    const key = String(row?.status || 'unknown').toLowerCase();
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const user = await getServerUser(req);
  if (!user || String(user.email || '').toLowerCase() !== OWNER_EMAIL) return res.status(403).json({ error: 'Solo disponible para la cuenta dueña' });

  const supabase = getSupabaseServer();

  try {
    const [subsRes, campaignsRes, listingsRes, ownerAnalyticsRes] = await Promise.all([
      supabase.from('subscriptions').select('id,status'),
      supabase.from('ad_campaigns').select('id,status,impressions,clicks'),
      supabase.from('listings').select('id,status,is_premium'),
      fetchOwnerAnalytics(req),
    ]);

    const subscriptions = countByStatus(subsRes.data || []);
    const campaignsByStatus = countByStatus(campaignsRes.data || []);
    const campaigns = {
      active: campaignsByStatus.active || 0,
      paused: campaignsByStatus.paused || 0,
      expired: campaignsByStatus.expired || 0,
      impressions: (campaignsRes.data || []).reduce((sum, row) => sum + Number(row.impressions || 0), 0),
      clicks: (campaignsRes.data || []).reduce((sum, row) => sum + Number(row.clicks || 0), 0),
    };
    const listings = {
      active: (listingsRes.data || []).filter((row) => row.status === 'active').length,
      premium: (listingsRes.data || []).filter((row) => !!row.is_premium).length,
      total: (listingsRes.data || []).length,
    };

    return res.status(200).json({
      subscriptions: {
        active: subscriptions.active || 0,
        expired: subscriptions.expired || 0,
        canceled: subscriptions.canceled || 0,
        total: (subsRes.data || []).length,
      },
      campaigns,
      listings,
      ownerAnalytics: ownerAnalyticsRes || null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo cargar el overview SaaS' });
  }
}

async function fetchOwnerAnalytics(req) {
  try {
    const host = req.headers.host;
    const protocol = host && host.includes('localhost') ? 'http' : 'https';
    const response = await fetch(`${protocol}://${host}/api/secure/owner/analytics`, { headers: { cookie: req.headers.cookie || '' } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: '2mb',
  },
};
