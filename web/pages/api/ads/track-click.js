import { getSupabaseServer } from '../../../lib/supabaseServer';
import { checkRateLimit } from '../../../lib/server/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'ad-track-click', limit: 180, windowMs: 60_000 })) return;
  const supabase = getSupabaseServer();
  try {
    const { campaignId = '' } = req.body || {};
    if (!campaignId || String(campaignId).startsWith('house-')) {
      return res.status(200).json({ ok: true, ignored: true });
    }
    const { data, error } = await supabase.from('ad_campaigns').select('clicks').eq('id', campaignId).maybeSingle();
    if (error) throw error;
    const current = Number(data?.clicks || 0);
    const { error: updateError } = await supabase.from('ad_campaigns').update({ clicks: current + 1 }).eq('id', campaignId);
    if (updateError) throw updateError;
    return res.status(200).json({ ok: true, clicks: current + 1 });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'No se pudo trackear click' });
  }
}
