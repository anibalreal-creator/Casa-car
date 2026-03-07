import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/router"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const Map = dynamic(() => import("../../components/Map"), {
  ssr: false
})

export default function DetalleAnuncio() {
  const router = useRouter()
  const { id } = router.query

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imagenActiva, setImagenActiva] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!id) return

    async function cargarAnuncio() {
      setLoading(true)
      setErrorMsg("")

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        setErrorMsg(error.message || "Error al cargar el anuncio")
        setItem(null)
        setLoading(false)
        return
      }

      setItem(data || null)
      setLoading(false)
    }

    cargarAnuncio()
  }, [id])

  const imagenes = useMemo(() => {
    if (!item?.photos || !Array.isArray(item.photos)) return []

    return item.photos
      .filter(Boolean)
      .map((foto) => {
        const { data } = supabase.storage.from("listings").getPublicUrl(foto)
        return data?.publicUrl || null
      })
      .filter(Boolean)
  }, [item])

  const imagenPrincipal = imagenes[imagenActiva] || null

  function obtenerPrecio() {
    return (
      Number(
        item?.price ??
          item?.precio ??
          0
      ) || 0
    )
  }

  function obtenerTitulo() {
    return (
      item?.title ||
      item?.titulo ||
      "Sin título"
    )
  }

  function obtenerDescripcion() {
    return (
      item?.description ||
      item?.descripcion ||
      item?.DESCRIPCION ||
      "Sin descripción"
    )
  }

  function obtenerCiudad() {
    return (
      item?.city ||
      item?.ciudad ||
      "Sin ciudad"
    )
  }

  function obtenerDormitorios() {
    return Number(item?.dormitorios ?? 0) || 0
  }

  function obtenerBanos() {
    return Number(item?.banos ?? item?.baños ?? 0) || 0
  }

  function obtenerTelefono() {
    if (!item?.telefono) return null
    return String(item.telefono).replace(/\D/g, "")
  }

  function obtenerMoneda() {
    return item?.currency || item?.moneda || "USD"
  }

  function imprimirFicha() {
    window.print()
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.message}>Cargando anuncio...</div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Link href="/" style={styles.backBtn}>
            ← Volver
          </Link>

          <div style={{ ...styles.message, marginTop: 16 }}>
            {errorMsg ? (
              <>
                <div style={styles.errorText}>Error: {errorMsg}</div>
                <div>No existe el anuncio.</div>
              </>
            ) : (
              <div>No existe el anuncio.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const telefono = obtenerTelefono()
  const precio = obtenerPrecio()
  const titulo = obtenerTitulo()
  const descripcion = obtenerDescripcion()
  const ciudad = obtenerCiudad()
  const dormitorios = obtenerDormitorios()
  const banos = obtenerBanos()
  const moneda = obtenerMoneda()
  const pileta = Boolean(item?.pileta)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.backBtn}>
            ← Volver
          </Link>

          <button onClick={imprimirFicha} style={styles.printBtn}>
            Imprimir
          </button>
        </div>

        <div style={styles.galleryCard}>
          <div style={styles.mainImageWrap}>
            {imagenPrincipal ? (
              <img
                src={imagenPrincipal}
                alt={titulo}
                style={styles.mainImage}
              />
            ) : (
              <div style={styles.noImageBig}>Sin foto</div>
            )}
          </div>

          {imagenes.length > 1 && (
            <div style={styles.thumbsRow}>
              {imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImagenActiva(index)}
                  style={{
                    ...styles.thumbButton,
                    border:
                      imagenActiva === index
                        ? "2px solid #1d4ed8"
                        : "1px solid #d1d5db"
                  }}
                >
                  <img
                    src={img}
                    alt={`Foto ${index + 1}`}
                    style={styles.thumbImage}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.mainGrid}>
          <div style={styles.leftCol}>
            <div style={styles.infoCard}>
              <div style={styles.price}>{moneda} {precio}</div>
              <h1 style={styles.title}>{titulo}</h1>
              <div style={styles.city}>{ciudad}</div>

              <div style={styles.featuresRow}>
                <span style={styles.featureBadge}>
                  🛏 {dormitorios > 0 ? `${dormitorios} dormitorios` : "Dormitorios s/d"}
                </span>

                <span style={styles.featureBadge}>
                  🚿 {banos > 0 ? `${banos} baño${banos > 1 ? "s" : ""}` : "Baños s/d"}
                </span>

                <span style={styles.featureBadge}>
                  🏊 {pileta ? "Con pileta" : "Sin pileta"}
                </span>
              </div>

              <div style={styles.sectionTitle}>Descripción</div>
              <p style={styles.description}>{descripcion}</p>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.sectionTitle}>Características</div>

              <div style={styles.specGrid}>
                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Precio</div>
                  <div style={styles.specValue}>{moneda} {precio}</div>
                </div>

                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Ciudad</div>
                  <div style={styles.specValue}>{ciudad}</div>
                </div>

                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Dormitorios</div>
                  <div style={styles.specValue}>{dormitorios || "Sin dato"}</div>
                </div>

                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Baños</div>
                  <div style={styles.specValue}>{banos || "Sin dato"}</div>
                </div>

                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Pileta</div>
                  <div style={styles.specValue}>{pileta ? "Sí" : "No"}</div>
                </div>

                <div style={styles.specItem}>
                  <div style={styles.specLabel}>Moneda</div>
                  <div style={styles.specValue}>{moneda}</div>
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <div style={styles.sectionTitle}>Ubicación</div>
              <p style={styles.locationText}>{ciudad}</p>
              <Map city={ciudad} />
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.contactCard}>
              <div style={styles.contactTitle}>Contactá al anunciante</div>

              {telefono ? (
                <a
                  href={`https://wa.me/${telefono}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.whatsappBtn}
                >
                  💬 Contactar por WhatsApp
                </a>
              ) : (
                <div style={styles.noPhone}>
                  Este anuncio todavía no tiene teléfono.
                </div>
              )}

              <button onClick={imprimirFicha} style={styles.secondaryBtn}>
                Imprimir ficha
              </button>
            </div>

            <div style={styles.adCard}>
              <div style={styles.adTitle}>Espacio publicitario</div>
              <div style={styles.adBox}>
                Acá puede ir un anuncio destacado, crédito, seguro, escribanía o inmobiliaria premium.
              </div>
            </div>
          </div>
        </div>
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
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap"
  },
  backBtn: {
    display: "inline-block",
    textDecoration: "none",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700
  },
  printBtn: {
    border: "none",
    background: "#0b1730",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  message: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 24,
    color: "#374151"
  },
  errorText: {
    color: "#b91c1c",
    marginBottom: 10,
    fontWeight: 700
  },
  galleryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18
  },
  mainImageWrap: {
    width: "100%"
  },
  mainImage: {
    width: "100%",
    height: 520,
    objectFit: "cover",
    borderRadius: 14,
    display: "block"
  },
  noImageBig: {
    width: "100%",
    height: 520,
    background: "#e5e7eb",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 24
  },
  thumbsRow: {
    display: "flex",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap"
  },
  thumbButton: {
    padding: 0,
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
    cursor: "pointer"
  },
  thumbImage: {
    width: 100,
    height: 70,
    objectFit: "cover",
    display: "block"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 18
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 18
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 18
  },
  infoCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 22
  },
  contactCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 22,
    position: "sticky",
    top: 16
  },
  adCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 22
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 12,
    color: "#111827"
  },
  adBox: {
    background: "#f3f4f6",
    borderRadius: 12,
    padding: 18,
    color: "#4b5563",
    lineHeight: 1.6,
    fontSize: 14
  },
  price: {
    fontSize: 34,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 10
  },
  title: {
    margin: 0,
    fontSize: 34,
    color: "#111827"
  },
  city: {
    marginTop: 10,
    fontSize: 18,
    color: "#2563eb",
    fontWeight: 700
  },
  featuresRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18
  },
  featureBadge: {
    background: "#f3f4f6",
    borderRadius: 999,
    padding: "9px 13px",
    fontSize: 14,
    color: "#374151"
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: 800,
    color: "#111827"
  },
  description: {
    color: "#4b5563",
    lineHeight: 1.7,
    fontSize: 16,
    margin: 0
  },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14
  },
  specItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14
  },
  specLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6
  },
  specValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827"
  },
  locationText: {
    margin: "0 0 12px 0",
    color: "#374151"
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 16
  },
  whatsappBtn: {
    display: "block",
    textDecoration: "none",
    background: "#25D366",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    textAlign: "center",
    fontWeight: 800,
    marginBottom: 12
  },
  secondaryBtn: {
    width: "100%",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: "14px 16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  noPhone: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    color: "#4b5563",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  }
}