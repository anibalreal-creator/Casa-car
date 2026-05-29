import { getSupabaseServer } from '../../../lib/supabaseServer';
import { requireUser } from '../../../lib/auth';
import { getCurrentMembership } from '../../../lib/permissions';
import { isOwnerEmail, ownerMembership } from '../../../lib/owner';
import { ok, fail, methodNotAllowed } from '../../../lib/api';
import { mirrorFeaturedState, getFeaturedDays } from '../../../lib/featuredHelpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const { listing_id, step = 'activate', plan = 'PRO' } = req.body || {};
    if (!listing_id) return res.status(400).json({ error: 'Falta listing_id' });
    const membership = isOwnerEmail(user.email) ? ownerMembership() : await getCurrentMembership(user.id);
    const supabase = getSupabaseServer();
    const { data: listing, error: listingError } = await supabase.from('listings').select('*').eq('id', listing_id).eq('user_id', user.id).maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return res.status(404).json({ error: 'Anuncio no encontrado' });

    if (step === 'publish') {
      const { data, error } = await supabase.from('listings').update({ status: 'review' }).eq('id', listing_id).select('*').single();
      if (error) throw error;
      return ok(res, { flow: 'publish', listing: data, nextStep: 'payment' });
    }

    if (step === 'activate' || step === 'renew') {
      const chosenPlan = isOwnerEmail(user.email) ? 'OWNER_FREE' : (membership?.active ? membership.plan : plan);
      const days = getFeaturedDays(chosenPlan, 30);
      const { data, error, featured } = await mirrorFeaturedState(supabase, listing_id, 'activate', { planKey: chosenPlan, days });
      if (error) throw error;
      return ok(res, { flow: step, listing: data, premiumUntil: featured.untilIso, plan: chosenPlan, highlighted: true });
    }

    if (step === 'expire') {
      const { data, error } = await mirrorFeaturedState(supabase, listing_id, 'expire');
      if (error) throw error;
      return ok(res, { flow: 'expire', listing: data, nextStep: 'renew' });
    }

    return res.status(400).json({ error: 'Paso inválido' });
  } catch (error) {
    return fail(res, error, 'No se pudo completar el flujo premium');
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
