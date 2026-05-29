
import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

function sanitizeText(value = "", maxLength = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function getListingOwner(supabase, listingId) {
  const { data, error } = await supabase.from('listings').select('id, user_id').eq('id', listingId).single();
  if (error) throw new Error(error.message || 'No se encontró la publicación');
  return data;
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === 'GET') {
    const { listing_id, target_user_id } = req.query;
    try {
      let resolvedTargetUserId = target_user_id;
      if (!resolvedTargetUserId && listing_id) {
        const listing = await getListingOwner(supabase, listing_id);
        resolvedTargetUserId = listing.user_id;
      }
      if (!resolvedTargetUserId) return res.status(400).json({ error: 'Falta listing_id o target_user_id' });

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, reviewer_name, reviewer_email, created_at, target_user_id')
        .eq('target_user_id', resolvedTargetUserId)
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      const reviews = data || [];
      const count = reviews.length;
      const avg = count ? Number((reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / count).toFixed(1)) : 0;
      return res.status(200).json({ summary: { rating_avg: avg, reviews_count: count }, reviews });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'No se pudieron cargar las reseñas' });
    }
  }

  if (req.method === 'POST') {
    if (!checkRateLimit(req, res, { name: 'reviews-write', limit: 10, windowMs: 10 * 60_000 })) return;

    try {
      const body = req.body || {};
      const listingId = sanitizeText(body.listing_id, 120);
      if (!listingId) return res.status(400).json({ error: 'Falta listing_id' });
      const rating = Number(body.rating || 0);
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });
      const comment = sanitizeText(body.comment || '', 1000);
      if (!comment) return res.status(400).json({ error: 'La reseña no puede estar vacía' });

      const listing = await getListingOwner(supabase, listingId);
      const payload = {
        target_user_id: listing.user_id,
        author_user_id: null,
        rating,
        comment,
        reviewer_name: sanitizeText(body.reviewer_name || 'Usuario Casa-Car', 80),
        reviewer_email: sanitizeText(body.reviewer_email || '', 160),
      };
      const { data, error } = await supabase.from('reviews').insert(payload).select('*').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'No se pudo guardar la reseña' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
