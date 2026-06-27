import { getSupabaseServer } from '../../../lib/supabaseServer';
import { deriveCampaignState } from '../../../lib/campaignStatus';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';
import { requireAuthenticatedRoute } from '../../../lib/apiRouteGuards';
import { isOwnerEmail } from '../../../lib/owner';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;

  try {
    const user = await requireAuthenticatedRoute(req, res);
    if (!user) return;

    const supabase = getSupabaseServer();
    let query = supabase.from('ad_campaigns').select('*');
    if (!isOwnerEmail(user.email || '')) query = query.eq('user_id', String(user.id));
    const { data, error } = await query;
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
          .update({ status: next.status, active: next.active })
          .eq('id', row.id);
        if (!updateError) updated += 1;
      }
    }

    return safeJson(res, 200, { ok: true, syncedAt: now, updated, total: rows.length });
  } catch {
    return safeJson(res, 500, { error: 'No se pudieron sincronizar campanias' });
  }
}
