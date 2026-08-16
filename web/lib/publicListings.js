import { getListingImages } from './listingImages';

export const PUBLIC_LISTING_SELECT = [
  'id',
  'user_id',
  'title',
  'category',
  'subtype',
  'listing_type',
  'price',
  'currency',
  'country',
  'state',
  'city',
  'zone',
  'address',
  'lat',
  'lng',
  'description',
  'phone',
  'images',
  'main_image_index',
  'created_at',
  'featured',
  'highlighted',
  'is_premium',
  'premium_plan',
  'verified',
  'views',
  'clicks_whatsapp',
  'clicks_mail',
  'chat_messages',
  'language',
  'seo_slug',
  'seo_title',
  'seo_description',
  'rooms',
  'bathrooms',
  'surface',
  'pool',
  'garage',
  'furnished',
  'patio',
  'terrace',
  'balcony',
  'garage_number',
  'garage_passthrough',
  'price_on_request',
  'auction_enabled',
  'status',
  'specs_json',
].join(',');

const SENSITIVE_SPEC_KEYS = new Set([
  'contact_email',
  'email',
  'client_request_id',
  'request_id',
  'payment_id',
  'preference_id',
  'external_reference',
  'mercadopago_id',
  'admin_notes',
  'internal_notes',
  'source_url',
  'sourceurl',
  'source',
  'origin_url',
  'originurl',
  'original_url',
  'originalurl',
  'external_url',
  'externalurl',
  'import_url',
  'importurl',
  'url_origen',
  'urlorigen',
  'fuente',
  'link_fuente',
  'linkfuente',
]);

function isSensitiveSpecKey(key) {
  const raw = String(key || '').toLowerCase();
  const compact = raw.replace(/[^a-z0-9]/g, '');
  return (
    SENSITIVE_SPEC_KEYS.has(raw) ||
    SENSITIVE_SPEC_KEYS.has(compact) ||
    compact.includes('password') ||
    compact.includes('secret') ||
    compact.includes('token') ||
    compact.includes('apikey') ||
    compact.includes('authorization') ||
    compact.includes('clientrequestid') ||
    compact.includes('mercadopago') ||
    compact.includes('sourceurl') ||
    compact.includes('originurl') ||
    compact.includes('originalurl') ||
    compact.includes('externalurl') ||
    compact.includes('importurl') ||
    compact.includes('urlorigen') ||
    compact.includes('fuente') ||
    compact === 'email' ||
    compact === 'contactemail'
  );
}

function sanitizeSpecs(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveSpecKey(key))
      .map(([key, raw]) => {
        if (raw === null || raw === undefined) return [key, raw];
        if (typeof raw === 'object') return [key, Array.isArray(raw) ? raw.slice(0, 20) : sanitizeSpecs(raw)];
        return [key, String(raw).slice(0, 500)];
      })
  );
}

export function toPublicListingRecord(item = {}, options = {}) {
  const { includeContact = false, includeOwnerId = false } = options;
  if (!item) return null;

  const record = {
    id: item.id,
    title: item.title || item.titulo || '',
    category: item.category || '',
    subtype: item.subtype || '',
    listing_type: item.listing_type || 'venta',
    price: item.price ?? item.precio ?? 0,
    currency: item.currency || item.moneda || 'USD',
    country: item.country || '',
    state: item.state || '',
    city: item.city || item.ciudad || '',
    zone: item.zone || '',
    address: item.address || '',
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    description: item.description || item.descripcion || '',
    phone: item.phone || '',
    images: getListingImages(item),
    main_image_index: Number(item.main_image_index || 0),
    created_at: item.created_at || null,
    featured: Boolean(item.featured),
    highlighted: Boolean(item.highlighted),
    is_premium: Boolean(item.is_premium),
    premium_plan: item.premium_plan || null,
    verified: Boolean(item.verified),
    views: Number(item.views || 0),
    clicks_whatsapp: Number(item.clicks_whatsapp || 0),
    clicks_mail: Number(item.clicks_mail || 0),
    chat_messages: Number(item.chat_messages || 0),
    language: item.language || 'es',
    seo_slug: item.seo_slug || item.slug || '',
    seo_title: item.seo_title || '',
    seo_description: item.seo_description || '',
    slug: item.slug || item.seo_slug || '',
    rooms: item.rooms ?? null,
    bathrooms: item.bathrooms ?? null,
    surface: item.surface ?? null,
    pool: Boolean(item.pool),
    garage: Boolean(item.garage),
    furnished: Boolean(item.furnished),
    patio: Boolean(item.patio),
    terrace: Boolean(item.terrace),
    balcony: Boolean(item.balcony),
    garage_number: item.garage_number ?? null,
    garage_passthrough: Boolean(item.garage_passthrough),
    price_on_request: Boolean(item.price_on_request),
    auction_enabled: Boolean(item.auction_enabled),
    status: item.status || 'active',
    specs_json: sanitizeSpecs(item.specs_json),
    seller_name: item.seller_name || '',
    seller_verified: Boolean(item.seller_verified),
    seller_created_at: item.seller_created_at || null,
    seller_active_listings: Number(item.seller_active_listings || 0),
    seller_reviews_count: Number(item.seller_reviews_count || 0),
    seller_rating_avg: Number(item.seller_rating_avg || 0),
  };

  if (includeContact) {
    record.contact_email = item.contact_email || item?.specs_json?.contact_email || '';
  }
  if (includeOwnerId) {
    record.user_id = item.user_id || null;
  }

  return record;
}
