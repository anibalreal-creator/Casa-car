import { getSupabaseServer } from "../../../lib/supabaseServer";
import { getSiteUrl } from "../../../lib/siteUrl";
import { checkRateLimit } from "../../../lib/server/rateLimit";
import { calculateTourismQuote } from "../../../lib/tourism";

function sanitize(value = "", max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try { return JSON.parse(images); } catch { return []; }
  }
  return [];
}

async function createCheckout({ listing, reservation, total }) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token || !reservation.pay_now || !total) return null;

  const baseUrl = getSiteUrl();
  const preference = {
    items: [{
      id: String(listing.id),
      title: `Reserva Casa-Car - ${listing.title || "Turismo"}`,
      description: `${reservation.nights} noches / ${reservation.guests} huespedes`,
      quantity: 1,
      currency_id: listing.currency === "ARS" ? "ARS" : "USD",
      unit_price: Number(total || 0),
    }],
    metadata: {
      source: "casa-car",
      feature: "tourism_booking",
      listing_id: String(listing.id),
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      guest_email: reservation.guest_email,
    },
    back_urls: {
      success: `${baseUrl}/listing/${listing.id}`,
      failure: `${baseUrl}/listing/${listing.id}`,
      pending: `${baseUrl}/listing/${listing.id}`,
    },
    auto_return: "approved",
    external_reference: `tourism:${listing.id}:${Date.now()}`,
    notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
    statement_descriptor: "CASA-CAR",
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return data.init_point || data.sandbox_init_point || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(req, res, { name: "tourism-reservations", limit: 10, windowMs: 5 * 60_000 })) return;

  try {
    const supabase = getSupabaseServer();
    const body = req.body || {};
    const listingId = sanitize(body.listing_id, 120);
    if (!listingId) return res.status(400).json({ error: "Falta listing_id" });

    const { data: listing, error } = await supabase.from("listings").select("*").eq("id", listingId).maybeSingle();
    if (error) throw error;
    if (!listing) return res.status(404).json({ error: "Alojamiento no encontrado" });

    const reservation = {
      listing_id: listingId,
      check_in: sanitize(body.check_in, 20),
      check_out: sanitize(body.check_out, 20),
      guests: Math.max(1, Number(body.guests || 1)),
      guest_name: sanitize(body.guest_name, 100),
      guest_email: sanitize(body.guest_email, 180),
      guest_phone: sanitize(body.guest_phone, 80),
      note: sanitize(body.note, 1200),
      pay_now: body.pay_now === true || body.pay_now === "true",
    };
    if (!reservation.check_in || !reservation.check_out) return res.status(400).json({ error: "Faltan fechas" });
    if (!reservation.guest_name || !reservation.guest_email) return res.status(400).json({ error: "Faltan datos del huesped" });

    const item = { ...listing, images: normalizeImages(listing.images) };
    const quote = calculateTourismQuote(item, {
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      guests: reservation.guests,
    });
    if (!quote.nights) return res.status(400).json({ error: "Fechas invalidas" });
    if (quote.blocked) return res.status(409).json({ error: "Fechas no disponibles" });

    const payload = {
      ...reservation,
      nights: quote.nights,
      total_estimate: quote.total,
      currency: quote.currency,
      status: reservation.pay_now ? "pending_payment" : "pending_confirmation",
      created_at: new Date().toISOString(),
    };

    let saved = null;
    const insert = await supabase.from("tourism_reservations").insert(payload).select("*").maybeSingle();
    if (!insert.error) saved = insert.data;

    if (insert.error) {
      await supabase.from("messages").insert({
        listing_id: listingId,
        sender_name: reservation.guest_name,
        sender_email: reservation.guest_email,
        body: `Reserva turismo ${reservation.check_in} a ${reservation.check_out}, ${reservation.guests} huespedes. ${reservation.note}`,
      });
    }

    await supabase.from("listing_events").insert({
      listing_id: listingId,
      event_type: "tourism_booking_request",
      source: reservation.pay_now ? "booking_pay_now" : "booking_request",
    });

    const checkoutUrl = await createCheckout({ listing: item, reservation: payload, total: quote.total });

    return res.status(200).json({
      ok: true,
      reservation: saved || payload,
      checkout_url: checkoutUrl,
      message: checkoutUrl ? "Checkout creado." : "Solicitud de reserva enviada.",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "No se pudo crear la reserva" });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
    responseLimit: "2mb",
  },
};
