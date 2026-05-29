import { getSupabaseServer } from '../../../lib/supabaseServer';
import { deriveCampaignState } from '../../../lib/campaignStatus';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('ad_campaigns').select('*');
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    let updated = 0;
    const now = new Date().toISOString();

    for (const row of rows) {
      const next = deriveCampaignState(row);
      const currentStatus = String(row.status || '').toLowerCase();
      const currentActive = Boolean(row.active || row.is_active);
      if (currentStatus !== next.status || currentActive !== next.active) {
        const { error: updateError } = await supabase
          .from('ad_campaigns')
          .update({ status: next.status, active: next.active, is_active: next.active })
          .eq('id', row.id);
        if (!updateError) updated += 1;
      }
    }

    return safeJson(res, 200, { ok: true, syncedAt: now, updated, total: rows.length });
  } catch (error) {
    return safeJson(res, 500, { error: error.message || 'No se pudieron sincronizar campañas' });
  }
}
