import { getSupabaseServer } from './supabaseServer';
import { isOwnerEmail } from './owner';

export async function getProfile(userId) {
  if (!userId) return null;
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('profiles')
      .select('id, role, email, verified, display_name')
      .eq('id', userId)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function getProfileRole(userId) {
  const profile = await getProfile(userId);
  return String(profile?.role || 'user').toLowerCase();
}

export async function getCurrentMembership(userId) {
  if (!userId) return { plan: 'FREE', active: false };
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, active, expires_at')
      .eq('user_id', userId)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return { plan: 'FREE', active: false, expires_at: null };

    const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : null;
    const notExpired = expiresAt == null || (!Number.isNaN(expiresAt) && expiresAt > Date.now())

    return {
      plan: String(data.plan || 'FREE').toUpperCase(),
      active: Boolean(data.active && notExpired),
      expires_at: data.expires_at || null,
    };
  } catch {
    return { plan: 'FREE', active: false, expires_at: null };
  }
}

export async function canManageCompany(userId, email = '') {
  if (!userId && !email) return false;
  if (isOwnerEmail(email)) return true;

  const role = await getProfileRole(userId);
  if (['admin', 'empresa', 'business', 'company'].includes(role)) return true;

  const membership = await getCurrentMembership(userId);
  return Boolean(
    membership?.active && ['PRO', 'BUSINESS', 'EMPRESA', 'COMPANY'].includes(String(membership?.plan || '').toUpperCase())
  );
}

export async function isAdmin(userId, email = '') {
  if (isOwnerEmail(email)) return true;
  const role = await getProfileRole(userId);
  return role === 'admin';
}
