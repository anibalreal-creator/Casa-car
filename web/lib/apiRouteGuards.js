import { getServerUser } from './auth';
import { isAdmin } from './permissions';
import { isOwnerEmail, normalizeEmail } from './owner';

function header(req, name) {
  return req?.headers?.[name] || req?.headers?.[name.toLowerCase()] || req?.headers?.[name.toUpperCase()] || '';
}

export function getAdminApiKey() {
  return (
    process.env.ADMIN_API_KEY ||
    process.env.INTERNAL_API_KEY ||
    process.env.CRON_SECRET ||
    process.env.VERCEL_CRON_SECRET ||
    ''
  ).trim();
}

export function hasValidAdminApiKey(req) {
  const expected = getAdminApiKey();
  if (!expected) return false;
  const authHeader = String(header(req, 'authorization') || '').trim();
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const received = String(
    bearerToken ||
    header(req, 'x-admin-key') ||
    req?.query?.admin_key ||
    req?.body?.admin_key ||
    ''
  ).trim();
  return Boolean(received && received === expected);
}

export function isLocalDevelopmentRequest(req) {
  const host = String(header(req, 'x-forwarded-host') || header(req, 'host') || '').toLowerCase();
  const referer = String(header(req, 'referer') || '').toLowerCase();
  return host.includes('localhost') || host.startsWith('127.0.0.1') || referer.includes('localhost:');
}

export async function requireAuthenticatedRoute(req, res) {
  const user = await getServerUser(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }
  return user;
}

export async function requireAdminRoute(req, res, options = {}) {
  const { allowLocalDev = true } = options;

  if (hasValidAdminApiKey(req)) {
    return { id: 'internal', email: 'internal@system.local', role: 'internal' };
  }

  if (allowLocalDev && process.env.NODE_ENV !== 'production' && isLocalDevelopmentRequest(req)) {
    return { id: 'local-dev', email: 'local@localhost', role: 'local-dev' };
  }

  const user = await getServerUser(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  const email = normalizeEmail(user.email || '');
  if (isOwnerEmail(email) || (await isAdmin(user.id, email))) {
    return user;
  }

  res.status(403).json({ error: 'Acceso restringido' });
  return null;
}

export async function requireResourceOwner(req, res, resolver) {
  const user = await requireAuthenticatedRoute(req, res);
  if (!user) return null;

  const resource = await resolver(user);
  if (!resource) return null;

  const ownerId = resource?.user_id ? String(resource.user_id) : '';
  const ownerEmail = normalizeEmail(resource?.contact_email || resource?.user_email || resource?.email || '');
  const userEmail = normalizeEmail(user.email || '');
  const sameOwner = (ownerId && ownerId === String(user.id)) || (ownerEmail && ownerEmail === userEmail);
  const elevated = isOwnerEmail(userEmail) || (await isAdmin(user.id, userEmail));

  if (!sameOwner && !elevated) {
    res.status(403).json({ error: 'No autorizado' });
    return null;
  }

  return user;
}

export function hideDebugGetInProduction(req, res) {
  if (req.method === 'GET' && process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return true;
  }
  return false;
}
