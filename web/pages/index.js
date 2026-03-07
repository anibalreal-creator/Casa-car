import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [anuncios, setAnuncios] = useState([])

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })

    setAnuncios(data || [])
  }

  function fotoUrl(path) {
    if (!path) return null
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/${path}`
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Casa-Car</h1>

      <a href="/publicar">+ Publicar anuncio</a>

      <br /><br />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,250px)",
          gap: 20
        }}
      >
        {anuncios.map((a) => {
          const foto = fotoUrl(a.foto_principal)

          return (
            <div
              key={a.id}
              style={{
                border: "1px solid #ddd",
                padding: 10
              }}
            >
              {foto ? (
                <img
                  src={foto}
                  alt=""
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover"
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#eee"
                  }}
                >
                  Sin foto
                </div>
              )}

              <h3>{a.titulo || "Sin título"}</h3>
              <b>USD {a.precio}</b>
              <p>{a.ciudad}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}