import { getSupabaseServer } from "../../lib/supabaseServer";
import { checkRateLimit } from "../../lib/server/rateLimit";

function clean(value = "", max = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function publicAuction(item = {}) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    current_price: item.current_price,
    currency: item.currency,
    status: item.status,
    ends_at: item.ends_at,
    created_at: item.created_at,
  };
}

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    if (!checkRateLimit(req, res, { name: "auctions-read", limit: 120, windowMs: 60_000 })) return;
    const { data, error } = await supabase
      .from("auctions")
      .select("id,title,description,image_url,current_price,currency,status,ends_at,created_at")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: "No se pudieron cargar subastas" });
    return res.status(200).json((data || []).map(publicAuction));
  }

  if (req.method === "PATCH") {
    if (!checkRateLimit(req, res, { name: "auctions-bid", limit: 8, windowMs: 10 * 60_000 })) return;
    const body = req.body || {};
    const auctionId = clean(body.auction_id, 120);
    const amount = Number(body.amount || 0);
    if (!auctionId || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Oferta invalida" });

    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select("id,current_price,status,ends_at")
      .eq("id", auctionId)
      .single();
    if (auctionError || !auction) return res.status(404).json({ error: "Subasta no encontrada" });

    if (amount <= Number(auction.current_price || 0)) {
      return res.status(400).json({ error: "La oferta debe ser mayor al precio actual" });
    }

    const { error: bidError } = await supabase.from("auction_bids").insert({
      auction_id: auctionId,
      bidder_name: clean(body.bidder_name, 100),
      bidder_email: clean(body.bidder_email, 160),
      amount,
    });
    if (bidError) return res.status(500).json({ error: "No se pudo registrar la oferta" });

    const { data, error } = await supabase
      .from("auctions")
      .update({ current_price: amount })
      .eq("id", auctionId)
      .select("id,title,description,image_url,current_price,currency,status,ends_at,created_at")
      .single();
    if (error) return res.status(500).json({ error: "No se pudo actualizar la subasta" });
    return res.status(200).json(publicAuction(data));
  }

  return res.status(405).json({ error: "Method not allowed" });
}
