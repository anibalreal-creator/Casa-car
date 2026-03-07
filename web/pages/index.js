import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [ciudadFiltro, setCiudadFiltro] = useState("")
  const [precioMin, setPrecioMin] = useState("")
  const [precioMax, setPrecioMax] = useState("")
  const [dormFiltro, setDormFiltro] = useState("")
  const [banosFiltro, setBanosFiltro] = useState("")
  const [soloPileta, setSoloPileta] = useState(false)
  const [ordenPrecio, setOrdenPrecio] = useState("recientes")

  useEffect(() => {
    async function cargar() {
      setLoading(true)

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) setItems(data)

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

  function obtenerPrecio(item) {
    const valor = item.price ?? item.precio ?? 0
    return Number(valor) || 0
  }

  function obtenerCiudad(item) {
    return item.city || item.ciudad || ""
  }

  function obtenerDormitorios(item) {
    return Number(item.dormitorios ?? 0) || 0
  }

  function obtenerBanos(item) {
    return Number(item.banos ?? 0) || 0
  }

  function tienePileta(item) {
    return Boolean(item.pileta)
  }

  function obtenerTelefono(item) {
    if (!item.telefono) return null
    return String(item.telefono).replace(/\D/g, "")
  }

  const resultados = useMemo(() => {
    let filtrados = [...items]

    if (ciudadFiltro.trim()) {
      filtrados = filtrados.filter((item) =>
        obtenerCiudad(item).toLowerCase().includes(ciudadFiltro.toLowerCase())
      )
    }

    if (precioMin !== "") {
      filtrados = filtrados.filter((item) => obtenerPrecio(item) >= Number(precioMin))
    }

    if (precioMax !== "") {
      filtrados = filtrados.filter((item) => obtenerPrecio(item) <= Number(precioMax))
    }

    if (dormFiltro !== "") {
      filtrados = filtrados.filter((item) => obtenerDormitorios(item) >= Number(dormFiltro))
    }

    if (banosFiltro !== "") {
      filtrados = filtrados.filter((item) => obtenerBanos(item) >= Number(banosFiltro))
    }

    if (soloPileta) {
      filtrados = filtrados.filter((item) => tienePileta(item))
    }

    if (ordenPrecio === "menor") {
      filtrados.sort((a, b) => obtenerPrecio(a) - obtenerPrecio(b))
    } else if (ordenPrecio === "mayor") {
      filtrados.sort((a, b) => obtenerPrecio(b) - obtenerPrecio(a))
    } else {
      filtrados.sort((a, b) => {
        const da = new Date(a.created_at || 0).getTime()
        const db = new Date(b.created_at || 0).getTime()
        return db - da
      })
    }

    return filtrados
  }, [items, ciudadFiltro, precioMin, precioMax, dormFiltro, banosFiltro, soloPileta, ordenPrecio])

  function limpiarFiltros() {
    setCiudadFiltro("")
    setPrecioMin("")
    setPrecioMax("")
    setDormFiltro("")
    setBanosFiltro("")
    setSoloPileta(false)
    setOrdenPrecio("recientes")
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topHeader}>
          <div>
            <h1 style={styles.logo}>Casa-Car</h1>
            <p style={styles.subtitle}>Propiedades y vehículos en un solo lugar</p>
          </div>

          <Link href="/publicar" style={styles.publishBtn}>
            + Publicar anuncio
          </Link>
        </header>

        <section style={styles.filtersBar}>
          <input
            type="text"
            placeholder="Ciudad"
            value={ciudadFiltro}
            onChange={(e) => setCiudadFiltro(e.target.value)}
            style={styles.filterInputLg}
          />

          <select
            value={ordenPrecio}
            onChange={(e) => setOrdenPrecio(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="recientes">Más recientes</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
          </select>

          <input
            type="number"
            placeholder="Precio desde"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            style={styles.filterInput}
          />

          <input
            type="number"
            placeholder="Precio hasta"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            style={styles.filterInput}
          />

          <select
            value={dormFiltro}
            onChange={(e) => setDormFiltro(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Dormitorios</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>

          <select
            value={banosFiltro}
            onChange={(e) => setBanosFiltro(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Baños</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>

          <label style={styles.checkboxWrap}>
            <input
              type="checkbox"
              checked={soloPileta}
              onChange={(e) => setSoloPileta(e.target.checked)}
            />
            <span>Con pileta</span>
          </label>

          <button onClick={limpiarFiltros} style={styles.clearBtn}>
            Limpiar
          </button>
        </section>

        <div style={styles.resultsTop}>
          <div style={styles.resultsCount}>
            {loading ? "Cargando anuncios..." : `${resultados.length} anuncios encontrados`}
          </div>
        </div>

        {loading ? (
          <div style={styles.message}>Cargando publicaciones...</div>
        ) : resultados.length === 0 ? (
          <div style={styles.message}>No hay resultados con esos filtros.</div>
        ) : (
          <div style={styles.resultsList}>
            {resultados.map((item) => {
              const imageUrl = obtenerImagen(item)
              const telefono = obtenerTelefono(item)
              const precio = obtenerPrecio(item)
              const ciudad = obtenerCiudad(item)
              const dorms = obtenerDormitorios(item)
              const banos = obtenerBanos(item)
              const pileta = tienePileta(item)

              return (
                <article key={item.id} style={styles.card}>
                  <div style={styles.cardImageCol}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title || "Anuncio"}
                        style={styles.cardImage}
                      />
                    ) : (
                      <div style={styles.noImage}>Sin foto</div>
                    )}
                  </div>

                  <div style={styles.cardMainCol}>
                    <div style={styles.price}>USD {precio}</div>

                    <h2 style={styles.cardTitle}>{item.title || "Sin título"}</h2>

                    <div style={styles.cardCity}>
                      {ciudad || "Sin ciudad"}
                    </div>

                    <div style={styles.featuresRow}>
                      <span style={styles.featureBadge}>
                        🛏 {dorms > 0 ? `${dorms} dorm.` : "Sin dato"}
                      </span>

                      <span style={styles.featureBadge}>
                        🚿 {banos > 0 ? `${banos} baño${banos > 1 ? "s" : ""}` : "Sin dato"}
                      </span>

                      <span style={styles.featureBadge}>
                        🏊 {pileta ? "Con pileta" : "Sin pileta"}
                      </span>
                    </div>

                    <p style={styles.cardDescription}>
                      {item.description || "Sin descripción"}
                    </p>
                  </div>

                  <div style={styles.cardActionsCol}>
                    {telefono && (
                      <a
                        href={`https://wa.me/${telefono}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.whatsappBtn}
                      >
                        💬 WhatsApp
                      </a>
                    )}

                    <Link href={`/anuncio/${item.id}`} style={styles.detailBtn}>
                      Ver detalle
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    fontFamily: "Arial, sans-serif",
    padding: "24px 16px"
  },
  container: {
    maxWidth: 1280,
    margin: "0 auto"
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20
  },
  logo: {
    margin: 0,
    fontSize: 48,
    lineHeight: 1,
    fontWeight: 800,
    color: "#0f172a"
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: 16,
    color: "#6b7280"
  },
  publishBtn: {
    textDecoration: "none",
    background: "#0b1730",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 12,
    fontWeight: 700,
    display: "inline-block"
  },
  filtersBar: {
    display: "grid",
    gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr auto auto",
    gap: 10,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    marginBottom: 18
  },
  filterInputLg: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 15
  },
  filterInput: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 15
  },
  filterSelect: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 15,
    background: "#fff"
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 8px",
    fontSize: 14,
    color: "#111827",
    whiteSpace: "nowrap"
  },
  clearBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    borderRadius: 10,
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  resultsTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827"
  },
  message: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 24,
    color: "#374151"
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  card: {
    display: "grid",
    gridTemplateColumns: "320px 1fr 180px",
    gap: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    alignItems: "stretch",
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)"
  },
  cardImageCol: {
    width: "100%"
  },
  cardImage: {
    width: "100%",
    height: 230,
    objectFit: "cover",
    borderRadius: 12,
    display: "block"
  },
  noImage: {
    width: "100%",
    height: 230,
    background: "#f3f4f6",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 20
  },
  cardMainCol: {
    display: "flex",
    flexDirection: "column"
  },
  price: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 8
  },
  cardTitle: {
    margin: 0,
    fontSize: 26,
    color: "#111827"
  },
  cardCity: {
    marginTop: 8,
    fontSize: 16,
    color: "#2563eb",
    fontWeight: 700
  },
  featuresRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  featureBadge: {
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 14,
    color: "#374151"
  },
  cardDescription: {
    marginTop: 16,
    color: "#4b5563",
    lineHeight: 1.6,
    fontSize: 15
  },
  cardActionsCol: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10
  },
  whatsappBtn: {
    textDecoration: "none",
    background: "#25D366",
    color: "#fff",
    borderRadius: 10,
    padding: "12px 14px",
    textAlign: "center",
    fontWeight: 700
  },
  detailBtn: {
    textDecoration: "none",
    background: "#1d4ed8",
    color: "#fff",
    borderRadius: 10,
    padding: "12px 14px",
    textAlign: "center",
    fontWeight: 700
  }
}