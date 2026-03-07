import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [anuncios, setAnuncios] = useState([])
  const [fotos, setFotos] = useState({})
  const [debug, setDebug] = useState({})

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })

    setAnuncios(listings || [])

    const nuevoDebug = {
      listingsError: listingsError ? listingsError.message : null,
      anuncios: [],
    }

    if (!listings || listings.length === 0) {
      setDebug(nuevoDebug)
      return
    }

    const mapa = {}

    for (const anuncio of listings) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from("listings")
        .list(anuncio.id)

      let fotoUrl = null
      let nombres = []

      if (files && files.length > 0) {
        nombres = files.map((f) => f.name)

        const nombre = files[0].name
        fotoUrl =
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/${anuncio.id}/${nombre}`

        mapa[anuncio.id] = fotoUrl
      }

      nuevoDebug.anuncios.push({
        id: anuncio.id,
        titulo: anuncio.titulo,
        filesError: filesError ? filesError.message : null,
        filesCount: files ? files.length : 0,
        fileNames: nombres,
        fotoUrl,
      })
    }

    setFotos(mapa)
    setDebug(nuevoDebug)
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
        ))}
      </div>

      <br /><br />

      <div
        style={{
          background: "#111",
          color: "#0f0",
          padding: 12,
          fontSize: 12,
          whiteSpace: "pre-wrap",
          overflowX: "auto"
        }}
      >
        {JSON.stringify(debug, null, 2)}
      </div>
    </div>
  )
}