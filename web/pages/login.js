import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "../supabase/client"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Si ya hay sesión, mandalo al inicio
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.replace("/")
    }
    check()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert("Error al iniciar sesión: " + error.message)
      return
    }

    router.push("/") // o "/publicar" si querés
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    alert("Sesión cerrada")
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h1>Iniciar sesión</h1>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 10 }}>
          <input
            style={{ width: "100%", padding: 8 }}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            style={{ width: "100%", padding: 8 }}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: 10, width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleLogout} style={{ padding: 10, width: "100%" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
