import { getSupabaseServer } from '../../lib/supabaseServer';
import { checkRateLimit } from '../../lib/server/rateLimit';

const FIELD_MAP = {
  whatsapp_click: 'clicks_whatsapp',
  mail_click: 'clicks_mail',
  chat_message: 'chat_messages',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'listing-event', limit: 90, windowMs: 60_000 })) return;

  try {
    const { id, type } = req.body || {};
    const listingId = String(id || '').trim();
    const field = FIELD_MAP[type];
    if (!listingId || !UUID_RE.test(listingId) || !field) {
      return res.status(400).json({ error: 'Evento invalido' });
    }

    const supabase = getSupabaseServer();
    const { data: current, error: currentError } = await supabase
      .from('listings')
      .select(`${field},status`)
      .eq('id', listingId)
      .maybeSingle();
    if (currentError || !current || current.status !== 'active') {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const nextValue = Number(current?.[field] || 0) + 1;
    const { error } = await supabase.from('listings').update({ [field]: nextValue }).eq('id', listingId);
    if (error) return res.status(200).json({ ok: true });

    return res.status(200).json({ ok: true, field, value: nextValue });
  } catch {
    return res.status(200).json({ ok: true });
  }
}
