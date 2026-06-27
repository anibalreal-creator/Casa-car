const EMAIL_SEND_COOLDOWN_MS = 60 * 1000;

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getStorageKey(action, email) {
  return `casa-car-auth-email:${action}:${cleanEmail(email)}`;
}

function secondsLabel(ms) {
  return Math.max(1, Math.ceil(ms / 1000));
}

export function getAuthRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/callback`;
}

export function isEmailRateLimitError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const status = Number(error?.status || error?.code || 0);
  return status === 429 || (message.includes("rate") && message.includes("limit"));
}

export function getAuthErrorMessage(error) {
  if (isEmailRateLimitError(error)) {
    return "Supabase limito el envio de emails por seguridad. Espera unos minutos y no sigas reintentando. Para produccion hay que configurar SMTP propio en Supabase Auth.";
  }

  const message = String(error?.message || "").trim();
  if (!message) return "No se pudo completar la autenticacion.";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Email o contrasena incorrectos.";
  }
  return "No se pudo completar la autenticacion. Revisa los datos o intenta nuevamente en unos minutos.";
}

export function assertEmailSendCooldown(action, email) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(action, email);
  const last = Number(window.localStorage.getItem(key) || 0);
  const remaining = EMAIL_SEND_COOLDOWN_MS - (Date.now() - last);

  if (remaining > 0) {
    throw new Error(`Ya se pidio un correo para ese email. Espera ${secondsLabel(remaining)} segundos antes de reenviar.`);
  }
}

export function rememberEmailSend(action, email) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(action, email), String(Date.now()));
}

export async function signUpWithEmail(supabaseClient, { email, password }) {
  const normalizedEmail = cleanEmail(email);
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (!normalizedEmail || !password) throw new Error("Completa email y contrasena.");

  assertEmailSendCooldown("signup", normalizedEmail);

  const { data, error } = await supabaseClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    if (isEmailRateLimitError(error)) rememberEmailSend("signup", normalizedEmail);
    throw new Error(getAuthErrorMessage(error));
  }

  rememberEmailSend("signup", normalizedEmail);
  return data;
}

export async function signInWithEmail(supabaseClient, { email, password }) {
  const normalizedEmail = cleanEmail(email);
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (!normalizedEmail || !password) throw new Error("Completa email y contrasena.");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) throw new Error(getAuthErrorMessage(error));
  return data;
}

export async function sendEmailMagicLink(supabaseClient, email) {
  const normalizedEmail = cleanEmail(email);
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (!normalizedEmail) throw new Error("Completa el email.");

  assertEmailSendCooldown("magic-link", normalizedEmail);

  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    if (isEmailRateLimitError(error)) rememberEmailSend("magic-link", normalizedEmail);
    throw new Error(getAuthErrorMessage(error));
  }

  rememberEmailSend("magic-link", normalizedEmail);
  return data;
}
