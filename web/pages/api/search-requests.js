import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { checkRateLimit } from '../../lib/server/rateLimit';

const OWNER_PHONE = '3424073042';

function cleanText(value, max = 500) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function parseMoney(value) {
  const cleaned = String(value || '').replace(/[^\d.,]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function getIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(`${ip}:${process.env.SEARCH_REQUEST_SALT || 'casa-car'}`).digest('hex');
}

function buildWhatsappMessage(payload) {
  const lines = [
    'Hola Casa-Car, quiero dejar un pedido personalizado.',
    payload.category ? `Rubro: ${payload.category}` : '',
    payload.operation ? `Operacion: ${payload.operation}` : '',
    payload.zones ? `Zonas: ${payload.zones}` : '',
    payload.budget_max ? `Presupuesto aprox: ${payload.budget_currency} ${payload.budget_max}` : '',
    payload.details ? `Detalle: ${payload.details}` : '',
    payload.contact_name ? `Mi nombre: ${payload.contact_name}` : '',
  ].filter(Boolean);
  return `https://wa.me/54${OWNER_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo no permitido.' });
  }

  if (!checkRateLimit(req, res, { name: 'search-requests', limit: 8, windowMs: 60 * 60 * 1000 })) {
    return;
  }

  const body = req.body || {};
  const payload = {
    request_type: cleanText(body.request_type || 'pedido_personalizado', 80),
    category: cleanText(body.category, 80),
    operation: cleanText(body.operation, 80),
    budget_currency: cleanText(body.budget_currency || 'USD', 8).toUpperCase(),
    budget_min: parseMoney(body.budget_min),
    budget_max: parseMoney(body.budget_max),
    zones: cleanText(body.zones, 500),
    details: cleanText(body.details, 900),
    contact_name: cleanText(body.contact_name, 120),
    contact_phone: cleanText(body.contact_phone, 80),
    contact_email: cleanText(body.contact_email, 160).toLowerCase(),
    source: cleanText(body.source || 'web', 80),
    ip_hash: hashIp(getIp(req)),
    user_agent: cleanText(req.headers['user-agent'], 240),
  };

  if (!payload.zones && !payload.details) {
    return res.status(400).json({ error: 'Contanos zona o detalle de lo que estas buscando.' });
  }

  if (!payload.contact_phone && !payload.contact_email) {
    return res.status(400).json({ error: 'Dejanos WhatsApp o email para poder responderte.' });
  }

  const { error } = await supabaseAdmin.from('search_requests').insert(payload);
  if (error) {
    console.error('search request insert error', error);
    return res.status(500).json({ error: 'No pudimos guardar el pedido. Proba nuevamente.' });
  }

  return res.status(200).json({
    ok: true,
    message: 'Pedido recibido. Te vamos a responder con opciones personalizadas.',
    whatsappUrl: buildWhatsappMessage(payload),
  });
}
