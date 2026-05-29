export const SLOT_ALIASES = {
  home_hero: 'home_top',
  home_top: 'home_top',
  'home top': 'home_top',
  'home superior': 'home_top',
  home_superior: 'home_top',
  home_media: 'home_middle',
  home_middle: 'home_middle',
  'home middle': 'home_middle',
  'home media': 'home_middle',
  'buscar sidebar': 'search_sidebar',
  buscar_sidebar: 'search_sidebar',
  search_sidebar: 'search_sidebar',
  listing_inline: 'listing_inline',
  listing: 'listing_inline',
  ficha: 'listing_inline',
  ficha_anuncio: 'listing_inline',
  'ficha de anuncio': 'listing_inline',
  footer_strip: 'footer_strip',
  footer: 'footer_strip',
  pie_global: 'footer_strip',
  'pie global': 'footer_strip',
};

export const SLOT_LABELS = {
  home_top: 'Home superior',
  home_middle: 'Home media',
  search_sidebar: 'Buscar sidebar',
  listing_inline: 'Ficha de anuncio',
  footer_strip: 'Pie global',
};

export function normalizeSlotKey(value, fallback = 'home_middle') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return fallback;
  return SLOT_ALIASES[raw] || raw || fallback;
}

export function getSlotLabel(value, fallback = 'Banner') {
  const key = normalizeSlotKey(value, '');
  return SLOT_LABELS[key] || fallback || key || 'Banner';
}
