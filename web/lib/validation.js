import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'empresa', 'vendedor', 'user']).default('user');
export const membershipPlanSchema = z.enum(['FREE', 'PRO', 'BUSINESS', 'INMOBILIARIA', 'CONCESIONARIA']).default('FREE');
export const adPlanSchema = z.enum(['basico', 'destacado', 'premium']).default('basico');
export const adStatusSchema = z.enum(['draft', 'pending_payment', 'scheduled', 'active', 'expired', 'paused']).default('draft');
export const slotSchema = z.enum(['home_top', 'home_middle', 'search_sidebar', 'listing_inline', 'footer_strip']).default('home_middle');

export const listingSchema = z.object({
  title: z.string().trim().min(3).max(140),
  category: z.string().trim().min(2).max(80),
  subtype: z.string().trim().max(80).optional().or(z.literal('')),
  listing_type: z.enum(['venta', 'alquiler', 'temporal']).default('venta'),
  price: z.coerce.number().min(0).max(999999999999),
  currency: z.string().trim().min(1).max(10).default('USD'),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  zone: z.string().trim().max(120).optional().or(z.literal('')),
  address: z.string().trim().max(180).optional().or(z.literal('')),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  images: z.array(z.string().url().or(z.string().startsWith('/'))).max(20).default([]),
  main_image_index: z.coerce.number().int().min(0).max(19).default(0),
  rooms: z.coerce.number().int().min(0).max(100).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).max(100).optional().nullable(),
  surface: z.coerce.number().min(0).max(10000000).optional().nullable(),
  pool: z.coerce.boolean().optional().default(false),
  garage: z.coerce.boolean().optional().default(false),
  highlighted: z.coerce.boolean().optional().default(false),
  is_premium: z.coerce.boolean().optional().default(false),
  premium_plan: z.string().trim().max(40).optional().nullable(),
  premium_until: z.string().optional().nullable(),
  language: z.string().trim().max(12).optional().default('es'),
  specs_json: z.record(z.any()).optional().default({}),
  status: z.enum(['draft', 'active', 'paused', 'expired', 'sold', 'review']).default('active')
});

export const campaignSchema = z.object({
  name: z.string().trim().min(3).max(120),
  title: z.string().trim().min(3).max(120).optional().or(z.literal('')),
  company_name: z.string().trim().max(120).optional().or(z.literal('')),
  slot: z.string().trim().max(80).optional().or(z.literal('')),
  slot_key: slotSchema.optional(),
  banner_url: z.string().trim().min(1).refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), 'Banner inválido'),
  target_url: z.string().url().optional().or(z.literal('')),
  destination_url: z.string().url().optional().or(z.literal('')),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  plan: z.string().optional().or(z.literal('')),
  plan_key: adPlanSchema.optional(),
  status: adStatusSchema.optional(),
  budget: z.coerce.number().min(0).max(999999999).default(0),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_name: z.string().trim().max(120).optional().or(z.literal('')),
  cta_text: z.string().trim().max(40).optional().or(z.literal('')),
}).transform((value) => ({
  ...value,
  title: value.title || value.name,
  company_name: value.company_name || value.name,
  destination_url: value.destination_url || value.target_url || '',
  target_url: value.target_url || value.destination_url || '',
  plan_key: value.plan_key || String(value.plan || 'basico').trim().toLowerCase(),
  slot_key: value.slot_key || value.slot || 'home_middle',
  status: value.status || 'draft',
}));

export const reportSchema = z.object({
  listing_id: z.string().trim().min(2),
  reason: z.enum(['spam', 'fraude', 'contenido_inapropiado', 'duplicado', 'ya_no_disponible', 'otro']).default('otro'),
  details: z.string().trim().max(1200).optional().or(z.literal('')),
});

export const savedSearchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  filters: z.record(z.any()),
  notify_email: z.coerce.boolean().default(true),
  notify_whatsapp: z.coerce.boolean().default(false),
});

export function parseOrThrow(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error('Payload inválido');
    error.statusCode = 400;
    error.details = result.error.flatten();
    throw error;
  }
  return result.data;
}
