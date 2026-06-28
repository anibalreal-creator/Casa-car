import { getSupabaseServer } from '../../../lib/supabaseServer';
import { requireUser } from '../../../lib/auth';
import { canManageCompany, getCurrentMembership } from '../../../lib/permissions';
import { parseOrThrow, campaignSchema } from '../../../lib/validation';
import { ok, fail, methodNotAllowed } from '../../../lib/api';
import { enforceCampaignActivationLimit, enforceCampaignCreationLimit } from '../../../lib/listingLimits';
import { syncCampaignStatuses } from '../../../lib/adCampaigns';
import { isCampaignLive, patchForCampaignAction } from '../../../lib/campaignStatus';

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!(await canManageCompany(user.id, user.email))) return res.status(403).json({ error: 'Tu plan no permite administrar campañas' });
    const supabase = getSupabaseServer();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('ad_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      const synced = await syncCampaignStatuses(supabase, data || []);
      const rows = synced.map((item) => ({
        ...item,
        ctr: Number(item.impressions || 0) ? Number(((Number(item.clicks || 0) / Number(item.impressions || 1)) * 100).toFixed(2)) : 0,
      }));
      return ok(res, rows);
    }

    if (req.method === 'POST') {
      const campaignQuota = await enforceCampaignCreationLimit(supabase, user);
      if (!campaignQuota.canCreateCampaign) {
        return res.status(campaignQuota.canUseCompanyPanel ? 402 : 403).json(campaignQuota.blockedResponse);
      }

      const membership = await getCurrentMembership(user.id);
      const payload = parseOrThrow(campaignSchema, req.body || {});
      const { data, error } = await supabase.from('ad_campaigns').insert({
        ...payload,
        user_id: user.id,
        plan: membership?.plan || payload.plan,
        status: 'pending_payment',
        impressions: 0,
        clicks: 0,
      }).select('*').single();
      if (error) throw error;
      return ok(res, data, 201);
    }

    if (req.method === 'PATCH') {
      const { id, action } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const patch = {};
      let existing = null;
      if (action === 'activate' || action === 'renew') {
        const { data, error: existingError } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (existingError) throw existingError;
        if (!data) return res.status(404).json({ error: 'Campana no encontrada' });
        existing = data;

        const activationQuota = await enforceCampaignActivationLimit(supabase, user, {
          campaignId: id,
          alreadyActive: isCampaignLive(data),
        });
        if (!activationQuota.canActivateCampaign) {
          return res.status(activationQuota.canUseCompanyPanel ? 402 : 403).json(activationQuota.blockedResponse);
        }
      }
      if (action === 'activate') Object.assign(patch, patchForCampaignAction(existing, 'activate'));
      if (action === 'pause') Object.assign(patch, patchForCampaignAction(existing || {}, 'pause'));
      if (action === 'renew') Object.assign(patch, patchForCampaignAction(existing, 'activate'));
      const { data, error } = await supabase.from('ad_campaigns').update(patch).eq('id', id).eq('user_id', user.id).select('*').single();
      if (error) throw error;
      return ok(res, data);
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo gestionar campañas');
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
