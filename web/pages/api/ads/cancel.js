import { getSupabaseServer } from '../../../lib/supabaseServer';
import { normalizeAdRecord } from '../../../lib/adHelpers';
import { allowMethods, requireInternalRequest, safeJson } from '../../../lib/server/internalApi';
import { requireResourceOwner } from '../../../lib/apiRouteGuards';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireInternalRequest(req, res)) return;

  try {
    const id = String(req.body?.id || '').trim();
    if (!id) return safeJson(res, 400, { error: 'Falta id de campaña' });

    const supabase = getSupabaseServer();
    const user = await requireResourceOwner(req, res, async () => {
      const { data, error } = await supabase.from('ad_campaigns').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    });
    if (!user) return;

    let updated = null;
    let lastError = null;
    const now = new Date().toISOString();
    const cancelPatch = { status: 'paused', active: false, is_active: false, mercadopago_status: 'cancelled_by_user', ends_at: now };
    const cancelPatchNoIsActive = { status: 'paused', active: false, mercadopago_status: 'cancelled_by_user', ends_at: now };
    const cancelPatchMinimal = { status: 'paused', active: false, ends_at: now };
    const CANCEL_PATCHES = [
      cancelPatch,
      cancelPatchNoIsActive,
      cancelPatchMinimal,
      { active: false, is_active: false, ends_at: now },
      { active: false, ends_at: now },
      { status: 'paused', active: false },
      { active: false },
    ];
    const patches = CANCEL_PATCHES.flatMap((patch) => [{ ...patch, updated_at: now }, patch]);

    for (const patch of patches) {
      const { data, error } = await supabase.from('ad_campaigns').update(patch).eq('id', id).select('*').maybeSingle();
      if (!error) {
        updated = data;
        break;
      }
      lastError = error;
    }

    if (!updated && lastError) return safeJson(res, 500, { error: 'No se pudo dar de baja la publicidad' });
    return safeJson(res, 200, { ok: true, campaign: normalizeAdRecord(updated) });
  } catch (error) {
    return safeJson(res, 500, { error: 'No se pudo dar de baja la publicidad' });
  }
}
