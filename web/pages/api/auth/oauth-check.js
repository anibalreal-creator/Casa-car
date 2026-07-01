function cleanOAuthError(message) {
  const text = String(message || "").trim().toLowerCase();
  if (text.includes("provider") || text.includes("google") || text.includes("unsupported")) {
    return "Google todavía no está habilitado en Supabase. Hay que activar el proveedor Google con Client ID y Client Secret.";
  }
  return "No se pudo iniciar Google. Revisa la configuracion OAuth en Supabase.";
}

function isAllowedSupabaseAuthorizeUrl(rawUrl) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !rawUrl) return false;

  try {
    const candidate = new URL(rawUrl);
    const supabase = new URL(supabaseUrl);
    return (
      candidate.origin === supabase.origin &&
      candidate.pathname === "/auth/v1/authorize" &&
      candidate.searchParams.get("provider") === "google"
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!isAllowedSupabaseAuthorizeUrl(rawUrl)) {
    return res.status(400).json({ ok: false, error: "URL OAuth invalida." });
  }

  try {
    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "manual",
      headers: { accept: "application/json" },
    });

    const redirectLocation = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && redirectLocation) {
      return res.status(200).json({ ok: true, redirectUrl: redirectLocation });
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    if (response.ok) {
      return res.status(200).json({
        ok: true,
        redirectUrl: typeof payload?.url === "string" ? payload.url : null,
      });
    }

    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error;
    return res.status(400).json({ ok: false, error: cleanOAuthError(message) });
  } catch {
    return res.status(502).json({
      ok: false,
      error: "No pudimos verificar Google con Supabase. Intenta nuevamente en unos minutos.",
    });
  }
}
