import { getSupabaseServer } from '../../lib/supabaseServer';
import { requireAuthenticatedRoute } from '../../lib/apiRouteGuards';
import { normalizeCategory } from '../../lib/category';
import { buildListingSlug } from '../../lib/slugify';
import { parsePagination, parseSort, ok, fail, methodNotAllowed } from '../../lib/api';
import { enforceListingCreationLimit, enforcePremiumActivationLimit } from '../../lib/listingLimits';
import { findListingByClientRequestId, sanitizeClientRequestId } from '../../lib/listingRequestId';
import { PUBLIC_LISTING_SELECT, toPublicListingRecord } from '../../lib/publicListings';

function uniqueSlugCandidate(base) {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return `${base || 'anuncio'}-${suffix}`;
}


function normalizeImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try { return JSON.parse(images); } catch { return []; }
  }
  return [];
}

function normalizeBasic(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function itemMatches(item, { category, q, country, state, city, type }) {
  if (category && normalizeCategory(item?.category || '') !== normalizeCategory(category)) {
    if (!(normalizeCategory(category) === 'Turismo' && (normalizeBasic(item?.listing_type || '') === 'temporal' || ['hotel','cabana','cabaña','experiencia','alquiler temporal'].includes(normalizeBasic(item?.subtype || ''))))) {
      return false;
    }
  }
  if (type && normalizeBasic(item?.listing_type || 'venta') !== normalizeBasic(type)) return false;
  if (country && normalizeBasic(item?.country || '') !== normalizeBasic(country)) return false;
  if (state && normalizeBasic(item?.state || '') !== normalizeBasic(state)) return false;
  if (city && normalizeBasic(item?.city || '') !== normalizeBasic(city)) return false;
  if (q) {
    const hay = normalizeBasic([
      item?.title,
      item?.category,
      item?.subtype,
      item?.country,
      item?.state,
      item?.city,
      item?.zone,
      item?.address,
      item?.description,
    ].filter(Boolean).join(' '));
    if (!hay.includes(normalizeBasic(q))) return false;
  }
  return true;
}

async function enrichListings(supabase, items = []) {
  const userIds = [...new Set((items || []).map((item) => item?.user_id).filter(Boolean))];
  if (!userIds.length) return (items || []).map((item) => ({ ...item, images: normalizeImages(item.images) }));

  const [profilesRes, reviewsRes, listingsRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name, verified, created_at').in('id', userIds),
    supabase.from('reviews').select('target_user_id, rating').in('target_user_id', userIds),
    supabase.from('listings').select('id, user_id').in('user_id', userIds),
  ]);

  const profilesMap = new Map((profilesRes.data || []).map((row) => [row.id, row]));
  const reviewMap = new Map();
  for (const row of (reviewsRes.data || [])) {
    const prev = reviewMap.get(row.target_user_id) || { total: 0, count: 0 };
    prev.total += Number(row.rating || 0);
    prev.count += 1;
    reviewMap.set(row.target_user_id, prev);
  }
  const listingsCount = new Map();
  for (const row of (listingsRes.data || [])) listingsCount.set(row.user_id, Number(listingsCount.get(row.user_id) || 0) + 1);

  return (items || []).map((item) => {
    const profile = profilesMap.get(item.user_id) || {};
    const summary = reviewMap.get(item.user_id) || { total: 0, count: 0 };
    const avg = summary.count ? Number((summary.total / summary.count).toFixed(1)) : 0;
    return {
      ...item,
      images: normalizeImages(item.images),
      verified: Boolean(item.verified || profile.verified),
      seller_verified: Boolean(profile.verified),
      seller_name: profile.display_name || item.seller_name || '',
      seller_created_at: profile.created_at || null,
      seller_active_listings: Number(listingsCount.get(item.user_id) || 0),
      seller_reviews_count: Number(summary.count || 0),
      seller_rating_avg: avg,
    };
  });
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  try {
    if (req.method === 'GET') {
      const { id, user_id, category, q, country, state, city, type, sort = '' } = req.query;
      const pagination = parsePagination(req.query || {});
      const isPublicList = !id && !user_id;
      if (isPublicList) {
        res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=60, stale-while-revalidate=120');
      } else {
        res.setHeader('Cache-Control', 'private, max-age=10');
      }

      if (id) {
        const { data, error } = await supabase.from('listings').select(PUBLIC_LISTING_SELECT).eq('id', id).eq('status', 'active').single();
        if (error) throw error;
        const [item] = await enrichListings(supabase, [data]);
        return ok(res, toPublicListingRecord(item, { includeContact: true }));
      }

      let query = supabase.from('listings').select(PUBLIC_LISTING_SELECT, { count: 'exact' }).eq('status', 'active');
      if (user_id) query = query.eq('user_id', user_id);
      const sortDescriptor = parseSort(sort);
      query = query.order('is_premium', { ascending: false }).order('highlighted', { ascending: false }).order(sortDescriptor.column, { ascending: sortDescriptor.ascending }).range(pagination.from, pagination.to);

      const { data, error, count } = await query;
      if (error) throw error;
      const items = await enrichListings(supabase, data || []);
      const filtered = items.filter((item) => itemMatches(item, { category, q, country, state, city, type }));
      return ok(res, {
        items: filtered.map((item) => toPublicListingRecord(item)),
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: Number(count || filtered.length),
        totalPages: Math.max(1, Math.ceil(Number(count || filtered.length) / pagination.pageSize)),
      });
    }

    if (req.method === 'POST') {
      const user = await requireAuthenticatedRoute(req, res);
      if (!user) return;
      const body = req.body || {};
      const clientRequestId = sanitizeClientRequestId(body?.specs_json?.client_request_id || body?.client_request_id);
      if (clientRequestId) {
        const existing = await findListingByClientRequestId(supabase, user.id, clientRequestId);
        if (existing) return ok(res, { ...existing, images: normalizeImages(existing.images), duplicateRequest: true });
      }
      const quota = await enforceListingCreationLimit(supabase, user);
      if (!quota.canCreateListing) {
        return res.status(402).json(quota.blockedResponse);
      }
      if (body.is_premium || body.highlighted || body.featured) {
        const premiumQuota = await enforcePremiumActivationLimit(supabase, user);
        if (!premiumQuota.canActivatePremium) {
          return res.status(402).json(premiumQuota.blockedResponse);
        }
      }
      const payload = {
        user_id: user.id,
        title: body.title,
        category: normalizeCategory(body.category),
        subtype: body.subtype,
        listing_type: body.listing_type || 'venta',
        price: Number(body.price || 0),
        currency: body.currency || 'USD',
        country: body.country || '',
        city: body.city || '',
        state: body.state || '',
        zone: body.zone || '',
        address: body.address || '',
        lat: body.lat ? Number(body.lat) : null,
        lng: body.lng ? Number(body.lng) : null,
        language: body.language || 'es',
        description: body.description || '',
        phone: body.phone || '',
        images: Array.isArray(body.images) ? body.images : [],
        specs_json: {
          ...(body.specs_json || {}),
          ...(clientRequestId ? { client_request_id: clientRequestId } : {}),
          contact_email: body.contact_email || body?.specs_json?.contact_email || '',
        },
        featured: Boolean(body.featured),
        highlighted: Boolean(body.highlighted),
        is_premium: Boolean(body.is_premium),
        premium_expires_at: body.premium_until || null,
        verified: Boolean(body.verified),
        views: Number(body.views || 0),
        clicks_whatsapp: Number(body.clicks_whatsapp || 0),
        clicks_mail: Number(body.clicks_mail || 0),
        chat_messages: Number(body.chat_messages || 0),
        slug: buildListingSlug({ title: body.title, city: body.city, category: body.category }),
      };
      let insertResult = await supabase.from('listings').insert(payload).select('*').single();
      if (insertResult.error && String(insertResult.error.message || '').includes('listings_seo_slug_key')) {
        payload.seo_slug = uniqueSlugCandidate(payload.seo_slug || buildListingSlug(payload));
        insertResult = await supabase.from('listings').insert(payload).select('*').single();
      }
      if (insertResult.error) throw insertResult.error;
      return ok(res, { ...insertResult.data, images: normalizeImages(insertResult.data.images) }, 201);
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo cargar los anuncios');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
