import { createClient } from '@supabase/supabase-js';
import { requireAdminRoute } from '../../lib/apiRouteGuards';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const access = await requireAdminRoute(req, res);
  if (!access) return;

  try {
    const { data: campaigns, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'No se pudo leer campanias' });

    const rows = campaigns || [];
    const ingresos = rows
      .filter((item) => ['active', 'paid'].includes(String(item.status || '').toLowerCase()))
      .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const clicks = rows.reduce((acc, item) => acc + Number(item.clicks || 0), 0);
    const impressions = rows.reduce((acc, item) => acc + Number(item.impressions || 0), 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

    return res.status(200).json({ campanias: rows, ingresos, clicks, impressions, ctr });
  } catch (error) {
    console.error('admin ads summary failed');
    return res.status(500).json({ error: 'Admin ads error' });
  }
}
