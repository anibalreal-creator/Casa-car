import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { supabase } from "../lib/supabase"

export default function PerfilPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null)
      setLoading(false)

      if (!data.session) {
        router.push("/login")
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession || null)
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div style={styles.page}>Cargando perfil...</div>
  }

  if (!session) {
    return <div style={styles.page}>Redirigiendo...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.back}>
          ← Volver
        </Link>

        <h1 style={styles.title}>Mi perfil</h1>

        <div style={styles.box}>
          <b>Email</b>
          <div>{session.user.email}</div>
        </div>

        <div style={styles.actions}>
          <Link href="/favoritos" style={styles.linkBtn}>
            Ver favoritos
          </Link>

          <button onClick={cerrarSesion} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
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
    maxWidth: 520,
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
    fontSize: 30
  },
  box: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  linkBtn: {
    textDecoration: "none",
    background: "#1d4ed8",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700
  },
  logoutBtn: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer"
  }
}
