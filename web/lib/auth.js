import { getSupabaseServer } from "./supabaseServer";

export function readBearer(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization || "";
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function getServerUser(req) {
  const token = readBearer(req);
  if (!token) return null;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await getServerUser(req);
  if (!user) {
    res.status(401).json({ error: "No autorizado" });
    return null;
  }
  return user;
}
