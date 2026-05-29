import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

function sanitizeText(value = "", maxLength = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    if (!checkRateLimit(req, res, { name: "messages-read", limit: 120, windowMs: 60_000 })) return;
    const { listing_id } = req.query;
    if (!listing_id) return res.status(400).json({ error: "Falta listing_id" });
    const { data, error } = await supabase.from("messages").select("*").eq("listing_id", listing_id).order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === "POST") {
    if (!checkRateLimit(req, res, { name: "messages-write", limit: 12, windowMs: 5 * 60_000 })) return;
    const body = req.body || {};
    const listingId = sanitizeText(body.listing_id, 120);
    const messageBody = sanitizeText(body.body, 2000);
    if (!listingId) return res.status(400).json({ error: "Falta listing_id" });
    if (!messageBody) return res.status(400).json({ error: "El mensaje no puede estar vacio" });

    const payload = {
      listing_id: listingId,
      sender_name: sanitizeText(body.sender_name, 80),
      sender_email: sanitizeText(body.sender_email, 160),
      body: messageBody
    };
    const { data, error } = await supabase.from("messages").insert(payload).select("*").single();
    if (error) return res.status(500).json({ error: error.message });

    const { data: listing } = await supabase.from("listings").select("chat_messages").eq("id", listingId).single();
    await supabase.from("listings").update({ chat_messages: Number(listing?.chat_messages || 0) + 1 }).eq("id", listingId);

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
