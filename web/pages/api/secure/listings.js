import { getSupabaseServer } from '../../../lib/supabaseServer';
import { getServerUser } from '../../../lib/auth';
import { normalizeCategory } from '../../../lib/category';
import { buildListingSlug } from '../../../lib/slugify';
import { parsePagination, parseSort, ok, fail, methodNotAllowed } from '../../../lib/api';
import { enforceListingCreationLimit, enforcePremiumActivationLimit } from '../../../lib/listingLimits';
import { findListingByClientRequestId, sanitizeClientRequestId } from '../../../lib/listingRequestId';
import { normalizeCommercialStatus } from '../../../lib/listingBadges';

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

function hasListingImages(images) {
  return normalizeImages(images).some((src) => typeof src === 'string' && src.trim());
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizePayload(body = {}, ownerId) {
  const images = normalizeImages(body.images);
  const specs = body.specs_json || {};
  const commercialStatus = normalizeCommercialStatus(body.commercial_status || body.availability_status || body.deal_status || specs.commercial_status || specs.availability_status || specs.deal_status);

  return {
    user_id: ownerId,
    title: normalizeText(body.title),
    category: normalizeCategory(body.category || 'General'),
    subtype: normalizeText(body.subtype),
    listing_type: normalizeText(body.listing_type || 'venta'),
    price: toNumber(body.price, 0),
    currency: normalizeText(body.currency || 'USD'),
    country: normalizeText(body.country),
    city: normalizeText(body.city),
    state: normalizeText(body.state),
    zone: normalizeText(body.zone),
    address: normalizeText(body.address),
    lat: toNumber(body.lat),
    lng: toNumber(body.lng),
    language: normalizeText(body.language || 'es'),
    description: normalizeText(body.description),
    phone: normalizeText(body.phone),
    images,
    main_image_index: toNumber(body.main_image_index, 0) || 0,
    rooms: toNumber(body.rooms),
    bathrooms: toNumber(body.bathrooms),
    surface: toNumber(body.surface),
    pool: toBool(body.pool),
    garage: toBool(body.garage),
    highlighted: toBool(body.highlighted),
    is_premium: toBool(body.is_premium),
    premium_plan: normalizeText(body.premium_plan, '') || null,
    premium_expires_at: body.premium_until || null,
    seo_slug: uniqueSlugCandidate(body.seo_slug || buildListingSlug(body)),
    status: normalizeText(body.status || 'active'),
    specs_json: {
      ...specs,
      total_surface: toNumber(body.total_surface, specs.total_surface || null),
      garages_count: toNumber(body.garages_count, specs.garages_count || null),
      antiquity: toNumber(body.antiquity, specs.antiquity || null),
      floor: toNumber(body.floor, specs.floor || null),
      toilets: toNumber(body.toilets, specs.toilets || null),
      orientation: normalizeText(body.orientation || specs.orientation),
      construction_status: normalizeText(body.construction_status || specs.construction_status),
      advertiser_type: normalizeText(body.advertiser_type || specs.advertiser_type),
      commission_share: normalizeText(body.commission_share || specs.commission_share),
      patio: toBool(body.patio || specs.patio),
      balcony: toBool(body.balcony || specs.balcony),
      furnished: toBool(body.furnished || specs.furnished),
      terrace: toBool(body.terrace || specs.terrace),
      sum: toBool(body.sum || specs.sum),
      security24h: toBool(body.security24h || specs.security24h),
      pet_friendly: toBool(body.pet_friendly || specs.pet_friendly),
      professional_use: toBool(body.professional_use || specs.professional_use),
      contact_email: normalizeText(body.contact_email || body?.specs_json?.contact_email),
      commercial_status: commercialStatus,
      availability_status: commercialStatus,
      deal_status: commercialStatus,
    },
    verified: toBool(body.verified),
  };
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  try {
    if (req.method === 'GET') {
      const currentUser = await getServerUser(req);
      const { id, mine, status, q = '', category = '', sort = '', ...restQuery } = req.query || {};
      const pagination = parsePagination(restQuery);

      if (id) {
        let byId = supabase.from('listings').select('*').eq('id', id);
        if (mine === '1') {
          if (!currentUser) return res.status(401).json({ error: 'No autorizado' });
          byId = byId.eq('user_id', currentUser.id);
        }
        const { data, error } = await byId.maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'No encontrado' });
        if (data.status !== 'active' && data.user_id !== currentUser?.id) {
          return res.status(403).json({ error: 'Sin acceso' });
        }
        return ok(res, { ...data, images: normalizeImages(data.images) });
      }

      let query = supabase.from('listings').select('*', { count: 'exact' });
      if (mine === '1') {
        if (!currentUser) return res.status(401).json({ error: 'No autorizado' });
        query = query.eq('user_id', currentUser.id);
      } else {
        query = query.eq('status', status || 'active');
      }

      if (category) query = query.eq('category', normalizeCategory(String(category)));
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

      const sortDescriptor = parseSort(sort);
      query = query
        .order('is_premium', { ascending: false })
        .order('highlighted', { ascending: false })
        .order(sortDescriptor.column, { ascending: sortDescriptor.ascending })
        .range(pagination.from, pagination.to);

      const { data, error, count } = await query;
      if (error) throw error;

      return ok(res, {
        items: (data || []).map((item) => ({ ...item, images: normalizeImages(item.images) })),
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: Number(count || 0),
        totalPages: Math.max(1, Math.ceil(Number(count || 0) / pagination.pageSize)),
      });
    }

    const currentUser = await getServerUser(req);
    if (!currentUser) return res.status(401).json({ error: 'No autorizado' });

    if (req.method === 'POST') {
      const payload = normalizePayload(req.body || {}, currentUser.id);

      if (!payload.title) {
        return res.status(400).json({ error: 'Falta título' });
      }
      if (payload.status === 'active' && !hasListingImages(payload.images)) {
        return res.status(400).json({ error: 'Para publicar un anuncio activo agregá al menos una foto.' });
      }

      const clientRequestId = sanitizeClientRequestId(payload.specs_json?.client_request_id || req.body?.client_request_id);
      if (clientRequestId) {
        payload.specs_json.client_request_id = clientRequestId;
        const existing = await findListingByClientRequestId(supabase, currentUser.id, clientRequestId);
        if (existing) return ok(res, { ...existing, images: normalizeImages(existing.images), duplicateRequest: true });
      }

      const quota = await enforceListingCreationLimit(supabase, currentUser);
      if (!quota.canCreateListing) {
        return res.status(402).json(quota.blockedResponse);
      }

      if (payload.is_premium || payload.highlighted) {
        const premiumQuota = await enforcePremiumActivationLimit(supabase, currentUser);
        if (!premiumQuota.canActivatePremium) {
          return res.status(402).json(premiumQuota.blockedResponse);
        }
      }

      let insertResult = await supabase.from('listings').insert(payload).select('*').single();
      if (insertResult.error && String(insertResult.error.message || '').includes('listings_seo_slug_key')) {
        payload.seo_slug = uniqueSlugCandidate(payload.seo_slug || buildListingSlug(payload));
        insertResult = await supabase.from('listings').insert(payload).select('*').single();
      }
      if (insertResult.error) throw insertResult.error;
      return ok(res, { ...insertResult.data, images: normalizeImages(insertResult.data.images) }, 201);
    }

    if (req.method === 'PUT') {
      const id = String(req.body?.id || '').trim();
      if (!id) return res.status(400).json({ error: 'Falta id' });

      const payload = normalizePayload(req.body || {}, currentUser.id);
      if (payload.status === 'active' && !hasListingImages(payload.images)) {
        return res.status(400).json({ error: 'Para publicar un anuncio activo agregá al menos una foto.' });
      }
      if (payload.is_premium || payload.highlighted) {
        const premiumQuota = await enforcePremiumActivationLimit(supabase, currentUser, { excludeListingId: id });
        if (!premiumQuota.canActivatePremium) {
          return res.status(402).json(premiumQuota.blockedResponse);
        }
      }

      const { data, error } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'No encontrado' });
      return ok(res, { ...data, images: normalizeImages(data.images) });
    }

    if (req.method === 'DELETE') {
      const id = String(req.body?.id || '').trim();
      if (!id) return res.status(400).json({ error: 'Falta id' });

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return ok(res, { ok: true });
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo gestionar anuncios');
  }
}
