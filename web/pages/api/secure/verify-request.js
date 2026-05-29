import { requireUser } from "../../../lib/auth";
import { getSupabaseServer } from "../../../lib/supabaseServer";

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body || {};
  const payload = {
    user_id: user.id,
    company_name: body.company_name || "",
    contact_name: body.contact_name || user.email || "",
    phone: body.phone || "",
    website: body.website || "",
    status: "pending",
    notes: body.notes || "",
  };
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from("verification_requests").insert(payload).select("*").single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "No se pudo enviar la solicitud" });
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
