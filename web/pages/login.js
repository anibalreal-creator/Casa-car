import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "../lib/supabase"
import { getAuthErrorMessage, signInWithEmail, signUpWithEmail } from "../lib/authEmail"
import { useLang } from "../context/LanguageContext"

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const [modo, setModo] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/")
    })
  }, [router])

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
        router.push("/")
      }
    } catch (err) {
      alert(getAuthErrorMessage(err) || t("auth_error", "Error de autenticacion"))
    } finally {
      setLoading(false)
    }
  }

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
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

        <button onClick={loginGoogle} style={styles.google}>
          {t("login_google", "Continuar con Google")}
        </button>

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
  }
}
