import { AD_PLANS, AD_SLOTS, getAdPlan, getPlanRank } from '../data/adPlans';
import { normalizeSlotKey, getSlotLabel } from './adSlots';
import { deriveCampaignState } from './campaignStatus';
import { getSiteUrl } from './siteUrl';

export function plusDaysIso(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString();
}

export function getAdStatusFromDates(startsAt, endsAt) {
  const now = Date.now();
  const start = startsAt ? new Date(startsAt).getTime() : now;
  const end = endsAt ? new Date(endsAt).getTime() : now + 1;
  if (Number.isNaN(start) || Number.isNaN(end)) return 'draft';
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}

export function normalizeAdRecord(item = {}) {
  const plan = getAdPlan(item.plan_key || item.plan || 'basico');
  const bannerUrl = item.banner_url || item.image_url || item.creative_url || '';
  const derived = deriveCampaignState(item);
  return {
    ...item,
    plan_key: item.plan_key || item.plan || plan.key,
    plan_name: plan.name,
    plan_rank: getPlanRank(item.plan_key || item.plan || plan.key),
    slot_key: normalizeSlotKey(item.slot_key || item.slot || 'home_middle'),
    slot_label: getSlotLabel(item.slot_label || item.slot_key || item.slot, 'Banner'),
    title: item.title || item.company_name || 'Publicidad en Casa-Car',
    company_name: item.company_name || item.title || 'Empresa',
    banner_url: bannerUrl,
    destination_url: item.destination_url || item.link_url || '#',
    status: derived.status || item.status || getAdStatusFromDates(item.starts_at, item.ends_at),
    active: derived.active,
    is_active: derived.active,
  };
}

export function toPublicAdRecord(item = {}) {
  const normalized = normalizeAdRecord(item);
  const derived = deriveCampaignState(normalized);
  const destination = normalized.destination_url || '#';
  return {
    id: normalized.id,
    title: normalized.title,
    company_name: normalized.company_name,
    plan_key: normalized.plan_key,
    plan_name: normalized.plan_name,
    slot_key: normalized.slot_key,
    slot_label: normalized.slot_label,
    banner_url: normalized.banner_url,
    image: normalized.banner_url,
    destination_url: destination,
    target_url: destination,
    cta_text: normalized.cta_text || 'Ver mas',
    status: derived.status,
    active: derived.active,
  };
}

export function sortAds(items = []) {
  return [...items].sort((a, b) => {
    const planDiff = getPlanRank(b.plan_key) - getPlanRank(a.plan_key);
    if (planDiff) return planDiff;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

export function getHouseAds() {
  return [
    { id: 'house-1a', title: 'Tu empresa puede aparecer acá', company_name: 'Casa-Car Ads', plan_key: 'premium', slot_key: 'home_top', banner_url: '/ads/house-home-top.svg', destination_url: '/panel-empresas', status: 'active', cta_text: 'Ver planes' },
    { id: 'house-1b', title: 'Banners premium para marcas', company_name: 'Casa-Car Ads', plan_key: 'destacado', slot_key: 'home_top', banner_url: '/ads/house-home-top.svg', destination_url: '/publicidad/panel', status: 'active', cta_text: 'Crear campaña' },
    { id: 'house-2a', title: 'Banners para inmobiliarias, concesionarias y servicios', company_name: 'Casa-Car Ads', plan_key: 'destacado', slot_key: 'home_middle', banner_url: '/ads/house-home-middle.svg', destination_url: '/publicidad/panel', status: 'active', cta_text: 'Subir banner' },
    { id: 'house-2b', title: 'Espacios automáticos con cobro listo', company_name: 'Casa-Car Ads', plan_key: 'premium', slot_key: 'home_middle', banner_url: '/ads/house-home-middle.svg', destination_url: '/publicidad', status: 'active', cta_text: 'Ver más' },
    { id: 'house-3a', title: 'Impulsá tu marca con Mercado Pago integrado', company_name: 'Casa-Car Ads', plan_key: 'basico', slot_key: 'search_sidebar', banner_url: '/ads/house-search-sidebar.svg', destination_url: '/publicidad', status: 'active', cta_text: 'Empezar' },
    { id: 'house-3b', title: 'Reservá este espacio lateral', company_name: 'Casa-Car Ads', plan_key: 'destacado', slot_key: 'search_sidebar', banner_url: '/ads/house-search-sidebar.svg', destination_url: '/publicidad/panel', status: 'active', cta_text: 'Reservar' },
    { id: 'house-4a', title: 'Sponsor destacado dentro de cada anuncio', company_name: 'Casa-Car Ads', plan_key: 'destacado', slot_key: 'listing_inline', banner_url: '/ads/house-listing-inline.svg', destination_url: '/publicidad', status: 'active', cta_text: 'Reservar slot' },
    { id: 'house-4b', title: 'Monetización lista para fichas', company_name: 'Casa-Car Ads', plan_key: 'premium', slot_key: 'listing_inline', banner_url: '/ads/house-listing-inline.svg', destination_url: '/publicidad/panel', status: 'active', cta_text: 'Activar' },
    { id: 'house-5a', title: 'Reservá tu espacio publicitario automático', company_name: 'Casa-Car Ads', plan_key: 'premium', slot_key: 'footer_strip', banner_url: '/ads/house-footer-strip.svg', destination_url: '/publicidad', status: 'active', cta_text: 'Planes' },
    { id: 'house-5b', title: 'Pie patrocinado disponible', company_name: 'Casa-Car Ads', plan_key: 'basico', slot_key: 'footer_strip', banner_url: '/ads/house-footer-strip.svg', destination_url: '/publicidad/panel', status: 'active', cta_text: 'Crear campaña' },
  ];
}

export function buildAdPreference({ campaign, baseUrl }) {
  const plan = getAdPlan(campaign.plan_key || 'basico');
  const safeBaseUrl = (baseUrl || getSiteUrl()).replace(/\/+$/, '');
  const returnUrl = `${safeBaseUrl}/publicidad/panel?status=paid`;
  const campaignId = String(campaign.id);
  return {
    items: [
      {
        id: campaignId,
        title: `Casa-Car Publicidad ${plan.name}`,
        description: `Campaña publicitaria ${campaign.title || campaign.company_name || 'Casa-Car Ads'}`,
        category_id: 'services',
        quantity: 1,
        currency_id: plan.currency,
        unit_price: Number(plan.price || 0),
      },
    ],
    metadata: {
      source: 'casa-car',
      feature: 'advertising_campaign',
      campaign_id: campaignId,
      plan_key: plan.key,
      slot_key: campaign.slot_key,
      company_name: campaign.company_name || '',
    },
    external_reference: `ad:${campaignId}`,
    back_urls: {
      success: returnUrl,
      failure: `${safeBaseUrl}/publicidad/panel?status=failure`,
      pending: `${safeBaseUrl}/publicidad/panel?status=pending`,
    },
    auto_return: 'approved',
    notification_url: `${safeBaseUrl}/api/payments/mercadopago/ad-webhook`,
    statement_descriptor: 'CASA-CAR',
  };
}

export function extractCampaignId(value) {
  if (!value) return null;
  const text = String(value);
  if (text.startsWith('ad:')) return text.slice(3).trim();
  return text.trim();
}

export { AD_PLANS, AD_SLOTS, getAdPlan };
