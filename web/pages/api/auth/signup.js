import { getSupabaseServer } from "../../../lib/supabaseServer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERS_PAGE_SIZE = 1000;
const MAX_USER_PAGES = 10;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isExistingUserError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists") ||
    message.includes("duplicate")
  );
}

async function findUserByEmail(supabase, email) {
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) throw error;

    const users = data?.users || [];
    const found = users.find((user) => normalizeEmail(user.email) === email);
    if (found) return found;
    if (users.length < USERS_PAGE_SIZE) return null;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Ingresa un email valido." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contrasena debe tener al menos 6 caracteres." });
  }

  try {
    const supabase = getSupabaseServer();
    const metadata = {
      signup_source: "casa-car-web",
      signup_confirmed_without_email: true,
    };

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (!error) {
      return res.status(200).json({
        ok: true,
        confirmed: true,
        userId: data?.user?.id || null,
      });
    }

    if (!isExistingUserError(error)) {
      throw error;
    }

    const existingUser = await findUserByEmail(supabase, email);
    if (!existingUser?.id || existingUser.email_confirmed_at || existingUser.confirmed_at) {
      return res.status(409).json({
        error: "Ya existe una cuenta con ese email. Inicia sesion o usa recuperar contrasena.",
      });
    }

    const existingMetadata =
      existingUser.user_metadata && typeof existingUser.user_metadata === "object"
        ? existingUser.user_metadata
        : {};

    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...existingMetadata,
        ...metadata,
        signup_recovered_from_unconfirmed: true,
      },
    });

    if (updateError) throw updateError;

    return res.status(200).json({
      ok: true,
      confirmed: true,
      restored: true,
      userId: existingUser.id,
    });
  } catch (error) {
    console.error("signup_api_error", error);
    return res.status(500).json({
      error: "No se pudo crear la cuenta. Intenta nuevamente en unos minutos.",
    });
  }
}
