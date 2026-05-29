import { getSupabaseServer } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "Falta user_id" });
  const supabase = getSupabaseServer();
  try {
    const { data } = await supabase.from("reviews").select("rating").eq("target_user_id", user_id).limit(200);
    const count = (data || []).length;
    const average = count ? Number(((data || []).reduce((acc, item) => acc + Number(item.rating || 0), 0) / count).toFixed(1)) : 0;
    return res.status(200).json({ average, count });
  } catch {
    return res.status(200).json({ average: 0, count: 0 });
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
