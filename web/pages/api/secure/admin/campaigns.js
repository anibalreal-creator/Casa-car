import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { normalizeAdRecord } from '../../../../lib/adHelpers';
import { patchForCampaignAction, deriveCampaignState } from '../../../../lib/campaignStatus';
import { requireUser } from '../../../../lib/auth';
import { isAdmin } from '../../../../lib/permissions';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await isAdmin(user.id, user.email))) return res.status(403).json({ error: 'Solo admin' });

  const supabase = getSupabaseServer();

  if (req.method === 'GET') {
    const requestedStatus = String(req.query.status || 'all').trim().toLowerCase();
    const search = String(req.query.search || '').trim().toLowerCase();

    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'No se pudieron cargar campanias' });
    }

    let campaigns = (data || []).map((item) => {
      const normalized = normalizeAdRecord(item);
      const derived = deriveCampaignState(normalized);
      return { ...normalized, status: derived.status, active: derived.active, is_active: derived.active };
    });

    if (requestedStatus !== 'all') {
      campaigns = campaigns.filter((item) => String(item.status || '').toLowerCase() === requestedStatus);
    }

    if (search) {
      campaigns = campaigns.filter((item) =>
        [item.title, item.company_name, item.contact_email, item.plan_name, item.slot_label]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      );
    }

    return res.status(200).json({ campaigns });
  }

  if (req.method === 'POST') {
    const { id, action } = req.body || {};

    if (!id || !action) {
      return res.status(400).json({ error: 'Faltan id o action' });
    }

    const { data: current, error: currentError } = await supabase.from('ad_campaigns').select('*').eq('id', id).maybeSingle();
    if (currentError) return res.status(500).json({ error: 'No se pudo cargar la campania' });
    if (!current) return res.status(404).json({ error: 'Campaña no encontrada' });

    let actionName = action;
    if (action === 'renew') actionName = 'activate';
    const patch = patchForCampaignAction(current, actionName);
    const { error } = await supabase.from('ad_campaigns').update(patch).eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'No se pudo actualizar la campania' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
