import { getSupabaseServer } from "../../lib/supabaseServer";

export default async function handler(req, res) {
  const supabase = getSupabaseServer();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("auctions").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === "PATCH") {
    const body = req.body || {};
    const auctionId = body.auction_id;
    const amount = Number(body.amount || 0);

    const { data: auction, error: auctionError } = await supabase.from("auctions").select("*").eq("id", auctionId).single();
    if (auctionError) return res.status(500).json({ error: auctionError.message });

    if (amount <= Number(auction.current_price || 0)) {
      return res.status(400).json({ error: "La oferta debe ser mayor al precio actual" });
    }

    const { error: bidError } = await supabase.from("auction_bids").insert({
      auction_id: auctionId,
      bidder_name: body.bidder_name || "",
      bidder_email: body.bidder_email || "",
      amount
    });
    if (bidError) return res.status(500).json({ error: bidError.message });

    const { data, error } = await supabase.from("auctions").update({ current_price: amount }).eq("id", auctionId).select("*").single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
