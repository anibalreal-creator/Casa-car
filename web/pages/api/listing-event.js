import { getSupabaseServer } from '../../lib/supabaseServer';
import { checkRateLimit } from '../../lib/server/rateLimit';

const FIELD_MAP = {
  whatsapp_click: 'clicks_whatsapp',
  mail_click: 'clicks_mail',
  chat_message: 'chat_messages',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRateLimit(req, res, { name: 'listing-event', limit: 90, windowMs: 60_000 })) return;

  try {
    const { id, type } = req.body || {};
    const field = FIELD_MAP[type];
    if (!id || !field) return res.status(400).json({ error: 'Evento inválido' });

    const supabase = getSupabaseServer();
    const { data: current, error: currentError } = await supabase
      .from('listings')
      .select(field)
      .eq('id', id)
      .single();
    if (currentError) return res.status(500).json({ error: currentError.message });

    const nextValue = Number(current?.[field] || 0) + 1;
    const { error } = await supabase.from('listings').update({ [field]: nextValue }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, field, value: nextValue });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'No se pudo registrar el evento' });
  }
}
