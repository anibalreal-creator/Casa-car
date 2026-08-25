import { randomUUID } from 'crypto';
import { requireUser, readBearer } from '../../../lib/auth';
import { getSupabaseServer, getSupabaseUserClient } from '../../../lib/supabaseServer';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extensionFor(contentType, fileName = '') {
  const fromName = String(fileName || '').toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1];
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpg' ? 'jpeg' : fromName;
  }
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'jpeg';
}

function isPolicyError(error) {
  return /row-level|security policy|violates|rls/i.test(String(error?.message || error || ''));
}

function isServerClientConfigError(error) {
  return /SUPABASE_SERVICE_ROLE_KEY|Falta configurar|service_role|service role/i.test(String(error?.message || error || ''));
}

async function uploadToListingsBucket(client, path, buffer, contentType) {
  return client.storage.from('listings').upload(path, buffer, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const contentType = String(req.body?.contentType || '').toLowerCase();
    const dataBase64 = String(req.body?.dataBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'Formato de imagen no permitido' });
    }
    if (!dataBase64) {
      return res.status(400).json({ error: 'Falta imagen' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ error: 'Imagen invalida' });
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: 'La imagen es demasiado pesada' });
    }

    const ext = extensionFor(contentType, req.body?.fileName);
    const rawFolder = String(req.body?.folder || req.body?.purpose || 'publicar').toLowerCase();
    const folder = ['ads', 'publicar', 'listings'].includes(rawFolder) ? rawFolder : 'publicar';
    const path = `${folder}/${user.id}/${Date.now()}-${randomUUID()}.${ext}`;
    const supabase = getSupabaseServer();
    const { error } = await uploadToListingsBucket(supabase, path, buffer, contentType);

    if (error) throw error;

    const publicClient = getSupabaseUserClient(readBearer(req));
    const { data } = publicClient.storage.from('listings').getPublicUrl(path);
    return res.status(201).json({ path, publicUrl: data?.publicUrl || '' });
  } catch (error) {
    if (isServerClientConfigError(error)) {
      return res.status(500).json({ error: 'Falta configurar correctamente la clave segura de Supabase en el servidor.' });
    }
    if (isPolicyError(error)) {
      return res.status(403).json({ error: 'No se pudo subir la imagen por permisos de seguridad del bucket listings.' });
    }
    return res.status(500).json({ error: error.message || 'No se pudo subir la imagen' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};
