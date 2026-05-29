function clean(value) {
  return String(value || '').trim();
}

export function getSiteUrl(req) {
  const envUrl =
    clean(process.env.NEXT_PUBLIC_SITE_URL) ||
    clean(process.env.SITE_URL) ||
    clean(process.env.NEXT_PUBLIC_APP_URL);

  if (envUrl) return envUrl.replace(/\/$/, '');

  if (req?.headers?.host) {
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${req.headers.host}`;
  }

  return 'http://localhost:3000';
}

export function getMercadoPagoAccessToken() {
  return clean(process.env.MERCADOPAGO_ACCESS_TOKEN) || clean(process.env.MP_ACCESS_TOKEN);
}

export function getSupabasePublicEnv() {
  return {
    url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getSupabaseServiceRoleKey() {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSetupSnapshot() {
  const publicEnv = getSupabasePublicEnv();
  const mpToken = getMercadoPagoAccessToken();
  const siteUrl = getSiteUrl();

  return {
    supabaseUrlConfigured: Boolean(publicEnv.url),
    supabaseAnonConfigured: Boolean(publicEnv.anonKey),
    supabaseServiceConfigured: Boolean(getSupabaseServiceRoleKey()),
    mercadopagoConfigured: Boolean(mpToken),
    siteUrlConfigured: Boolean(siteUrl),
    siteUrl,
  };
}

export function assertSupabaseBrowserEnv() {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error('Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { url, anonKey };
}

export function assertSupabaseServerEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error('Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  }
  return { url, serviceRoleKey };
}
