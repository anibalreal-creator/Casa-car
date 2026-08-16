import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export const SLOT_META = {
  home_superior: {
    key: 'home_superior',
    label: 'Home superior',
    size: '1200x220',
    page: 'página home',
    demoHref: '/?demoSlot=home_superior',
  },
  home_media: {
    key: 'home_media',
    label: 'Home media',
    size: '1200x180',
    page: 'página home',
    demoHref: '/?demoSlot=home_media#publicidad-demo-home-media',
  },
  buscar_sidebar: {
    key: 'buscar_sidebar',
    label: 'Buscar sidebar',
    size: '320x420',
    page: 'página buscar',
    demoHref: '/buscar?demoSlot=buscar_sidebar',
  },
  ficha_anuncio: {
    key: 'ficha_anuncio',
    label: 'Ficha de anuncio',
    size: '1200x220',
    page: 'página listing',
    demoHref: '/publicidad/slots?slot=listing_inline',
  },
  pie_global: {
    key: 'pie_global',
    label: 'Pie global',
    size: '1200x140',
    page: 'página global',
    demoHref: '/?demoSlot=pie_global#footer',
  },
};

export const PLAN_META = {
  basico: { key: 'basico', label: 'Básico', priceLabel: 'ARS 25.000', durationLabel: '7 días' },
  destacado: { key: 'destacado', label: 'Destacado', priceLabel: 'ARS 65.000', durationLabel: '15 días' },
  premium: { key: 'premium', label: 'Premium', priceLabel: 'ARS 145.000', durationLabel: '30 días' },
};

const SLOT_ALIAS = {
  home_top: 'home_superior',
  home_superior: 'home_superior',
  home_middle: 'home_media',
  home_media: 'home_media',
  home_mid: 'home_media',
  buscar_sidebar: 'buscar_sidebar',
  buscar_silverbar: 'buscar_sidebar',
  search_sidebar: 'buscar_sidebar',
  ficha_anuncio: 'ficha_anuncio',
  listing: 'ficha_anuncio',
  pie_global: 'pie_global',
  footer: 'pie_global',
  global_footer: 'pie_global',
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSlot(slot) {
  const normalized = normalizeText(slot).replace(/\s+/g, '_');
  return SLOT_ALIAS[normalized] || normalized || 'home_media';
}

export function normalizePlan(plan) {
  const normalized = normalizeText(plan).replace(/\s+/g, '_');
  if (normalized.includes('premium')) return 'premium';
  if (normalized.includes('destacado')) return 'destacado';
  return 'basico';
}

export const DEMO_CAMPAIGNS = [
  {
    id: 'demo-1',
    company_name: 'FARMACIA VERONICA CANO',
    title: 'FARMACIA VERONICA CANO',
    description: 'Banner real activo en Home media.',
    plan: 'basico',
    slot: 'home_media',
    link: 'https://wa.me/5493424558880',
    cta: 'Ver más',
    contact: 'anibalreal@hotmail.com',
    banner_url: '/banners/farmacia-vcano-home-media.jpg',
    status: 'active',
    clicks: 0,
  },
  {
    id: 'demo-2',
    company_name: 'FARMACIA VERONICA CANO',
    title: 'FARMACIA VERONICA CANO',
    description: 'Banner real activo en Home superior.',
    plan: 'destacado',
    slot: 'home_superior',
    link: 'https://wa.me/5493424558880',
    cta: 'FARMACIA.VCANO',
    contact: 'anibalreal@hotmail.com',
    banner_url: '/banners/farmacia-vcano-home-superior.jpg',
    status: 'active',
    clicks: 0,
  },
];

export function normalizeCampaign(row) {
  const slot = normalizeSlot(row?.slot || row?.slot_key || row?.slotLabel);
  const plan = normalizePlan(row?.plan || row?.plan_key || row?.plan_name);
  return {
    id: row?.id || '',
    company_name: row?.company_name || row?.empresa || '',
    title: row?.title || row?.titulo || row?.company_name || row?.empresa || '',
    description: row?.description || row?.descripcion || '',
    plan,
    slot,
    link: row?.link || row?.url_destino || '',
    cta: row?.cta || 'Ver más',
    contact: row?.contact || row?.email || '',
    banner_url: row?.banner_url || row?.banner || '',
    status: row?.status || row?.estado || 'pending',
    clicks: Number(row?.clicks || 0),
  };
}

export function getSlotLabel(slot) {
  const key = normalizeSlot(slot);
  return SLOT_META[key]?.label || slot || 'Slot';
}

export function getSlotDemoHref(slot) {
  const key = normalizeSlot(slot);
  return SLOT_META[key]?.demoHref || '/publicidad';
}

export function getPlanLabel(plan) {
  const key = normalizePlan(plan);
  return PLAN_META[key]?.label || plan || 'Plan';
}

export function getCampaignLink(campaign) {
  if (campaign?.link) return campaign.link;
  if (campaign?.contact) return `mailto:${campaign.contact}`;
  return '/publicidad';
}
