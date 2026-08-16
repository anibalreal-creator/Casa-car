export const AD_PLANS = [
  {
    key: 'basico',
    name: 'Básico',
    price: 25000,
    currency: 'ARS',
    badge: 'Entrada',
    durationDays: 7,
    slots: ['home_middle', 'search_sidebar', 'footer_strip'],
    impressions: 'Rotación estándar',
    description: 'Ideal para empresas que quieren empezar a aparecer en Casa-Car con una inversión accesible.',
    features: [
      '1 banner activo',
      'Rotación en slots secundarios',
      'Duración 7 días',
      'Link a sitio o WhatsApp',
    ],
  },
  {
    key: 'destacado',
    name: 'Destacado',
    price: 65000,
    currency: 'ARS',
    badge: 'Más elegido',
    durationDays: 15,
    slots: ['home_top', 'home_middle', 'search_sidebar', 'listing_inline', 'footer_strip'],
    impressions: 'Mayor visibilidad',
    description: 'Para marcas que necesitan presencia fuerte en home, resultados y fichas.',
    features: [
      '2 slots simultáneos',
      'Prioridad frente a Básico',
      'Duración 15 días',
      'Métricas de campaña',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 145000,
    currency: 'ARS',
    badge: 'Tipo MercadoLibre',
    durationDays: 30,
    slots: ['home_top', 'home_middle', 'search_sidebar', 'listing_inline', 'footer_strip'],
    impressions: 'Máxima prioridad',
    description: 'Formato full visibility para marcas que quieren dominar la página como un sponsor principal.',
    features: [
      'Prioridad máxima',
      'Hasta 3 slots',
      'Duración 30 días',
      'Aparición destacada en página de publicidad',
    ],
  },
];

export const AD_SLOTS = [
  { key: 'home_top', label: 'Home superior', dimensions: '1200x220', page: 'home', examplePath: '/publicidad/ubicaciones/home_top' },
  { key: 'home_middle', label: 'Home media', dimensions: '1200x180', page: 'home', examplePath: '/publicidad/ubicaciones/home_middle' },
  { key: 'search_sidebar', label: 'Buscar sidebar', dimensions: '320x420', page: 'buscar', examplePath: '/publicidad/ubicaciones/search_sidebar' },
  { key: 'listing_inline', label: 'Ficha de anuncio', dimensions: '1200x220', page: 'listing', examplePath: '/publicidad/ubicaciones/listing_inline' },
  { key: 'footer_strip', label: 'Pie global', dimensions: '1200x140', page: 'global', examplePath: '/publicidad/ubicaciones/footer_strip' },
];

export function getAdPlan(planKey) {
  return AD_PLANS.find((plan) => plan.key === planKey) || AD_PLANS[0];
}

export function getPlanRank(planKey) {
  return {
    premium: 3,
    destacado: 2,
    basico: 1,
  }[String(planKey || '').toLowerCase()] || 0;
}

export function getAdSlot(slotKey) {
  return AD_SLOTS.find((slot) => slot.key === slotKey) || AD_SLOTS[0];
}
