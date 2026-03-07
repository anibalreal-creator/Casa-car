import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {

  const [anuncios, setAnuncios] = useState([])
  const [fotos, setFotos] = useState({})

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {

    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })

    setAnuncios(data || [])

    if (!data) return

    const mapa = {}

    for (const anuncio of data) {

      const { data: files } = await supabase
        .storage
        .from("listings")
        .list(anuncio.id)

      if (files && files.length > 0) {

        const nombre = files[0].name

        mapa[anuncio.id] =
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/${anuncio.id}/${nombre}`

      }

    }

    setFotos(mapa)

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

        {anuncios.map((a) => (

          <div
            key={a.id}
            style={{
              border: "1px solid #ddd",
              padding: 10
            }}
          >

            {fotos[a.id] ? (

              <img
                src={fotos[a.id]}
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

        ))}

      </div>

    </div>

  )

}