import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { supabase } from "../lib/supabase"
import {
  getAuthErrorMessage,
  getPasswordRecoveryWhatsAppUrl,
  sendPasswordRecoveryEmail,
  signInWithEmail,
  signUpWithEmail,
  updateRecoveredPassword,
  verifyPasswordRecoveryCode,
} from "../lib/authEmail"
import { useLang } from "../context/LanguageContext"

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
    return "Google todavía no está habilitado para crear cuentas. Ingresá con email y contraseña.";
  }
  return "No se pudo completar el ingreso. Intentá nuevamente o usá email y contraseña.";
}

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const [modo, setModo] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [recoveryVerified, setRecoveryVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const nextPath = safeNextPath(router.query.next);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.mode === "registro") setModo("registro");
    const isRecoveryRedirect = router.query.recover === "1" || router.query.recover === "true";
    const authNotice = getAuthQueryMessage(router.query.auth_error || router.query.error_description || router.query.error);
    if (authNotice) setNotice(authNotice);
    supabase.auth.getSession().then(({ data }) => {
      if (isRecoveryRedirect) {
        setModo("reset");
        if (data.session) {
          setRecoveryVerified(true);
          setNotice("Correo verificado. Escribí tu nueva contraseña para terminar la recuperación.");
        }
        return;
      }

      if (data.session) router.replace(nextPath)
    })
  }, [router, router.isReady, nextPath])

  function changeMode(nextMode) {
    setModo(nextMode);
    setNotice("");
    setPassword("");
    setRepeatPassword("");
    setRecoveryCode("");
    setRecoveryVerified(false);
  }

  function validateRepeatedPassword() {
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    if (password !== repeatPassword) {
      throw new Error("Las contraseñas no coinciden.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setNotice("")

    try {
      if (modo === "registro") {
        validateRepeatedPassword();
        await signUpWithEmail(supabase, {
          email,
          password
        })
        setNotice(t("signup_created", "Cuenta creada correctamente. Ya podes usar Casa-Car."));
        router.push(nextPath);
      } else if (modo === "recuperar") {
        await sendPasswordRecoveryEmail(supabase, email);
        setModo("reset");
        setNotice("Si el proveedor de correo lo permite, vas a recibir un enlace seguro para cambiar la contraseña. Revisá también Spam/Correo no deseado.");
      } else if (modo === "reset") {
        validateRepeatedPassword();
        if (!recoveryVerified) {
          await verifyPasswordRecoveryCode(supabase, { email, code: recoveryCode });
          setRecoveryVerified(true);
        }
        await updateRecoveredPassword(supabase, password);
        setNotice("Contraseña actualizada correctamente. Ya podés ingresar.");
        setModo("login");
        setPassword("");
        setRepeatPassword("");
        setRecoveryCode("");
        setRecoveryVerified(false);
      } else {
        await signInWithEmail(supabase, {
          email,
          password
        })
        router.push(nextPath)
      }
    } catch (err) {
      setNotice(err?.message || getAuthErrorMessage(err) || t("auth_error", "Error de autenticacion"))
    } finally {
      setLoading(false)
    }
  }

  async function loginGoogle() {
    setLoading(true);
    setNotice("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          skipBrowserRedirect: true
        }
      })

      if (error) throw error;
      if (!data?.url) throw new Error("No se pudo generar la URL de Google.");

      const check = await fetch(`/api/auth/oauth-check?url=${encodeURIComponent(data.url)}`);
      const checkData = await check.json().catch(() => ({}));
      if (!check.ok || !checkData.ok) {
        throw new Error(checkData.error || "Google todavía no está habilitado en Supabase.");
      }

      window.location.assign(checkData.redirectUrl || data.url);
    } catch (error) {
      setNotice(error?.message || t("google_login_error", "No se pudo iniciar con Google"));
    } finally {
      setLoading(false);
    }
  }

  function getTitle() {
    if (modo === "registro") return t("signup_title", "Crear cuenta");
    if (modo === "recuperar") return "Recuperar contraseña";
    if (modo === "reset") return "Cambiar contraseña";
    return t("login_title", "Iniciar sesion");
  }

  function getSubmitLabel() {
    if (loading) return t("login_processing", "Procesando...");
    if (modo === "registro") return t("signup_submit", "Crear cuenta");
    if (modo === "recuperar") return "Enviar recuperación";
    if (modo === "reset") return "Guardar nueva contraseña";
    return t("login_submit", "Entrar");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.back}>
          {t("login_back", "Volver")}
        </Link>

        <h1 style={styles.title}>
          {getTitle()}
        </h1>

        {notice ? <p style={styles.notice}>{notice}</p> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          {modo !== "reset" || !recoveryVerified ? (
            <input
              type="email"
              placeholder={t("login_email_placeholder", "Email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          ) : null}

          {modo !== "recuperar" ? (
            <input
              type="password"
              placeholder={modo === "reset" ? "Nueva contraseña" : t("login_password_placeholder", "Contraseña")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          ) : null}

          {modo === "registro" || modo === "reset" ? (
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              style={styles.input}
              required
            />
          ) : null}

          {modo === "reset" && !recoveryVerified ? (
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Código de verificación"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              style={styles.input}
              required
            />
          ) : null}

          <button type="submit" style={styles.primary} disabled={loading}>
            {getSubmitLabel()}
          </button>
        </form>

        {modo === "registro" ? (
          <p style={styles.help}>
            La cuenta se activa al instante. No pedimos verificacion por email para que puedas publicar sin esperar.
          </p>
        ) : null}
        {modo === "recuperar" ? (
          <p style={styles.help}>
            Si el email no llega, no sigas reintentando: Supabase puede bloquear los envíos. Usá la recuperación asistida por WhatsApp.
          </p>
        ) : null}
        {modo === "reset" ? (
          <p style={styles.help}>
            Ingresá el código o abrí el enlace recibido por email. Si no llega, usá la recuperación asistida por WhatsApp.
          </p>
        ) : null}

        {modo === "login" || modo === "registro" ? (
          <button
            type="button"
            onClick={loginGoogle}
            style={styles.google}
            disabled={loading}
          >
            <span style={styles.googleMark}>G</span>
            <span>{t("login_google", "Continuar con Google")}</span>
          </button>
        ) : null}

        {modo === "login" ? (
          <button
            type="button"
            onClick={() => changeMode("recuperar")}
            style={styles.secondaryBtn}
          >
            Recuperar contraseña
          </button>
        ) : null}

        {modo === "recuperar" ? (
          <button
            type="button"
            onClick={() => changeMode("reset")}
            style={styles.secondaryBtn}
          >
            Ya tengo código
          </button>
        ) : null}

        {modo === "recuperar" || modo === "reset" ? (
          <a
            href={getPasswordRecoveryWhatsAppUrl(email)}
            target="_blank"
            rel="noreferrer"
            style={styles.whatsappRecovery}
          >
            Recuperar por WhatsApp
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => changeMode(modo === "login" ? "registro" : "login")}
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
    border: "none",
    background: "#0b1730",
    color: "#fff",
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  googleMark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 999,
    background: "#fff",
    color: "#1d4ed8",
    fontWeight: 900
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
  secondaryBtn: {
    width: "100%",
    marginTop: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: 12,
    cursor: "pointer",
    fontWeight: 700
  },
  whatsappRecovery: {
    width: "100%",
    marginTop: 12,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    borderRadius: 12,
    padding: 13,
    cursor: "pointer",
    fontWeight: 800,
    textDecoration: "none",
    display: "block",
    textAlign: "center",
    boxSizing: "border-box"
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
