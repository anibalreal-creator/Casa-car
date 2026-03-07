import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setItems(data)
      }

      setLoading(false)
    }

    cargar()
  }, [])

  function obtenerImagen(item) {
    if (!item.photos || !Array.isArray(item.photos) || item.photos.length === 0) {
      return null
    }

    const first = item.photos[0]

    if (!first) return null

    const { data } = supabase.storage.from("listings").getPublicUrl(first)
    return data?.publicUrl || null
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>Casa-Car</h1>
          <p style={styles.subtitle}>Propiedades y vehículos en un solo lugar</p>
        </div>

        <Link href="/publicar" style={styles.publishBtn}>
          + Publicar anuncio
        </Link>
      </header>

      {loading ? (
        <div style={styles.message}>Cargando anuncios...</div>
      ) : items.length === 0 ? (
        <div style={styles.message}>Todavía no hay anuncios publicados.</div>
      ) : (
        <div style={styles.grid}>
          {items.map((item) => {
            const imageUrl = obtenerImagen(item)

            return (
              <div key={item.id} style={styles.card}>
                <div style={styles.imageWrap}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title || "Anuncio"}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.noImage}>Sin foto</div>
                  )}
                </div>

                <div style={styles.cardBody}>
                  <h3 style={styles.title}>{item.title || "Sin título"}</h3>

                  <div style={styles.price}>
                    USD {item.price ?? item.precio ?? 0}
                  </div>

                  <div style={styles.city}>{item.city || "Sin ciudad"}</div>

                  <div style={styles.description}>
                    {item.description || "Sin descripción"}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f8",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    maxWidth: 1200,
    margin: "0 auto 28px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap"
  },
  logo: {
    margin: 0,
    fontSize: 42,
    fontWeight: 800,
    color: "#111827"
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#6b7280",
    fontSize: 16
  },
  publishBtn: {
    background: "#111827",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block"
  },
  message: {
    maxWidth: 1200,
    margin: "40px auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 24,
    color: "#374151"
  },
  grid: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(0,0,0,0.05)"
  },
  imageWrap: {
    width: "100%",
    height: 220,
    background: "#e5e7eb"
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 20,
    background: "#f3f4f6"
  },
  cardBody: {
    padding: 18
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: 28,
    color: "#111827"
  },
  price: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 10
  },
  city: {
    color: "#2563eb",
    fontWeight: 700,
    marginBottom: 10,
    fontSize: 16
  },
  description: {
    color: "#4b5563",
    lineHeight: 1.5,
    fontSize: 15
  }
}