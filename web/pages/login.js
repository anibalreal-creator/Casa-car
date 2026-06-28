import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "../lib/supabase"
import { getAuthErrorMessage, signInWithEmail, signUpWithEmail } from "../lib/authEmail"
import { useLang } from "../context/LanguageContext"

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function safeNextPath(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const path = String(raw || "/").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) return "/";
  return path;
}

function getAuthQueryMessage(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const message = String(raw || "").trim().toLowerCase();
  if (!message) return "";
  if (message.includes("provider") || message.includes("google") || message.includes("unsupported")) {
    return "Google todavia no esta habilitado para crear cuentas. Ingresa con email y contrasena.";
  }
  return "No se pudo completar el ingreso. Intenta nuevamente o usa email y contrasena.";
}

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const [modo, setModo] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const nextPath = safeNextPath(router.query.next);

  useEffect(() => {
    if (!router.isReady) return;
    const authNotice = getAuthQueryMessage(router.query.auth_error || router.query.error_description || router.query.error);
    if (authNotice) setNotice(authNotice);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(nextPath)
    })
  }, [router, router.isReady, nextPath])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (modo === "registro") {
        await signUpWithEmail(supabase, {
          email,
          password
        })
        alert(t("signup_created", "Cuenta creada. Te enviamos un correo de confirmacion. Revisa tambien Spam/Correo no deseado."))
      } else {
        await signInWithEmail(supabase, {
          email,
          password
        })
        router.push(nextPath)
      }
    } catch (err) {
      alert(getAuthErrorMessage(err) || t("auth_error", "Error de autenticacion"))
    } finally {
      setLoading(false)
    }
  }

  async function loginGoogle() {
    if (!GOOGLE_AUTH_ENABLED) {
      setNotice("Google todavia no esta habilitado para crear cuentas. Ingresa con email y contrasena.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    })

    if (error) {
      alert(error.message || t("google_login_error", "No se pudo iniciar con Google"))
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.back}>
          {t("login_back", "Volver")}
        </Link>

        <h1 style={styles.title}>
          {modo === "login" ? t("login_title", "Iniciar sesion") : t("signup_title", "Crear cuenta")}
        </h1>

        {notice ? <p style={styles.notice}>{notice}</p> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder={t("login_email_placeholder", "Email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder={t("login_password_placeholder", "Contrasena")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.primary} disabled={loading}>
            {loading
              ? t("login_processing", "Procesando...")
              : modo === "login"
                ? t("login_submit", "Entrar")
                : t("signup_submit", "Crear cuenta")}
          </button>
        </form>

        {modo === "registro" ? (
          <p style={styles.help}>
            El correo puede tardar unos minutos. Si no llega, revisa Spam y evita reenviar muchas veces seguidas.
          </p>
        ) : null}

        <button
          type="button"
          onClick={loginGoogle}
          style={{ ...styles.google, ...(GOOGLE_AUTH_ENABLED ? {} : styles.googleUnavailable) }}
        >
          {GOOGLE_AUTH_ENABLED
            ? t("login_google", "Continuar con Google")
            : "Google no disponible por ahora"}
        </button>
        {!GOOGLE_AUTH_ENABLED ? (
          <p style={styles.googleHelp}>
            Crea la cuenta con email y contrasena hasta que Google quede habilitado en Supabase.
          </p>
        ) : null}

        <button
          onClick={() => setModo(modo === "login" ? "registro" : "login")}
          style={styles.switchBtn}
        >
          {modo === "login" ? t("login_no_account", "No tengo cuenta") : t("login_have_account", "Ya tengo cuenta")}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f6f7fb",
    padding: 20,
    fontFamily: "Arial, sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 24
  },
  back: {
    textDecoration: "none",
    color: "#111827",
    display: "inline-block",
    marginBottom: 12
  },
  title: {
    marginTop: 0,
    marginBottom: 20,
    fontSize: 28
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 15,
    boxSizing: "border-box"
  },
  primary: {
    border: "none",
    background: "#0b1730",
    color: "#fff",
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
    cursor: "pointer"
  },
  google: {
    width: "100%",
    marginTop: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
    cursor: "pointer"
  },
  googleUnavailable: {
    background: "#f9fafb",
    color: "#6b7280",
    borderStyle: "dashed"
  },
  googleHelp: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.4,
    margin: "8px 0 0"
  },
  switchBtn: {
    width: "100%",
    marginTop: 12,
    border: "none",
    background: "transparent",
    color: "#2563eb",
    padding: 10,
    cursor: "pointer",
    fontWeight: 700
  },
  help: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 1.45,
    margin: "10px 0 0"
  },
  notice: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.4,
    margin: "0 0 14px"
  }
}
