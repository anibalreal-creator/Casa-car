import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

export default function Anuncio() {
  const router = useRouter()
  const { id } = router.query
  const [item, setItem] = useState(null)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [session, setSession] = useState(null)
  const [favoritosCount, setFavoritosCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
  }, [])

  useEffect(() => {
    if (!id) return
    async function cargar() {
      const res = await fetch(`/api/listings?id=${id}`, { cache: "no-store" })
      const data = await res.json()
      setItem(res.ok ? data : null)
      setFotoActiva(0)
    }
    cargar()
  }, [id])

  useEffect(() => {
    if (!id) return
    async function cargarCount() {
      try {
        const res = await fetch(`/api/favoritos?listing_id=${id}`, { cache: "no-store" })
        const data = await res.json()
        setFavoritosCount(data?.count || 0)
      } catch {
        setFavoritosCount(0)
      }
    }
    cargarCount()
  }, [id])

  function obtenerImagen(path) {
    if (!path) return null
    if (String(path).startsWith("http")) return path
    const { data } = supabase.storage.from("listings").getPublicUrl(path)
    return data?.publicUrl || null
  }

  if (!item) {
    return (
      <div style={styles.page}>
        <div style={styles.container}><div style={styles.loadingBox}>Cargando anuncio...</div></div>
      </div>
    )
  }

  const fotos = Array.isArray(item.photos) ? item.photos.filter(Boolean) : []
  const fotoPrincipal = fotos.length > 0 ? obtenerImagen(fotos[fotoActiva]) : null
  const telefono = item?.telefono ? String(item.telefono).replace(/\D/g, "") : null
  const tipo = item?.tipo || ""
  const subtipo = item?.subtipo || ""
  const operacion = item?.operacion || ""
  const ciudad = item?.ciudad || item?.city || ""
  const esMio = Boolean(session?.user?.id && item.user_id === session.user.id)

  async function eliminarAnuncio() {
    if (!session?.user?.id) return
    if (!confirm("¿Eliminar este anuncio?")) return
    const res = await fetch("/api/delete-listing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, user_id: session.user.id })
    })
    if (res.ok) router.push("/")
    else alert("No se pudo eliminar")
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.backBtn}>← Volver</Link>
          <div style={styles.topActions}>
            {esMio ? <Link href={`/editar/${item.id}`} style={styles.editBtn}>Editar</Link> : null}
            {esMio ? <button onClick={eliminarAnuncio} style={styles.deleteBtn}>Eliminar</button> : null}
            <button onClick={() => window.print()} style={styles.printBtn}>Imprimir</button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.headerBlock}>
            <div>
              <h1 style={styles.title}>{item?.titulo || item?.title || "Sin título"}</h1>
              <div style={styles.price}>{item?.moneda || item?.currency || "USD"} {Number(item?.precio ?? item?.price ?? 0).toLocaleString("es-AR")}</div>
              {item?.destacado ? <span style={styles.destacado}>⭐ Destacado</span> : null}
            </div>
            <div style={styles.favsBox}>♥ {favoritosCount}</div>
          </div>

          {fotoPrincipal ? (
            <div>
              <img src={fotoPrincipal} alt={item?.titulo || item?.title || "Anuncio"} style={styles.mainImage} />
              {fotos.length > 1 && (
                <div style={styles.gallery}>
                  {fotos.map((foto, i) => {
                    const url = obtenerImagen(foto)
                    return (
                      <img
                        key={`${foto}-${i}`}
                        src={url}
                        alt={`foto-${i + 1}`}
                        onClick={() => setFotoActiva(i)}
                        style={{ ...styles.thumb, border: i === fotoActiva ? "3px solid #2563eb" : "2px solid transparent" }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ) : <div style={styles.noImage}>Sin foto</div>}

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}><b>Tipo</b><br />{String(tipo).replaceAll("_", " ") || "-"}</div>
            <div style={styles.infoItem}><b>Subtipo</b><br />{String(subtipo).replaceAll("_", " ") || "-"}</div>
            <div style={styles.infoItem}><b>Operación</b><br />{String(operacion).replaceAll("_", " ") || "-"}</div>
            <div style={styles.infoItem}><b>Ciudad</b><br />{ciudad || "-"}</div>
          </div>

          {item.descripcion || item.description ? (
            <div style={styles.descriptionBox}>
              <h3 style={styles.sectionTitle}>Descripción</h3>
              <p style={styles.description}>{item.descripcion || item.description}</p>
            </div>
          ) : null}

          {telefono ? (
            <a href={`https://wa.me/${telefono}`} target="_blank" rel="noreferrer" style={styles.whatsapp}>WhatsApp</a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 40, background: "#f5f6fa", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  container: { maxWidth: 1000, margin: "auto" },
  loadingBox: { background: "#fff", padding: 30, borderRadius: 12, border: "1px solid #e5e7eb" },
  card: { background: "#fff", padding: 30, borderRadius: 12, border: "1px solid #e5e7eb" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" },
  topActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  backBtn: { textDecoration: "none", background: "#eee", color: "#111", padding: "10px 14px", borderRadius: 8, fontWeight: 700 },
  printBtn: { background: "#111", color: "#fff", padding: "10px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  editBtn: { textDecoration: "none", background: "#f59e0b", color: "#fff", padding: "10px 14px", borderRadius: 8, fontWeight: 700 },
  deleteBtn: { background: "#ef4444", color: "#fff", padding: "10px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  headerBlock: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 },
  title: { margin: 0, fontSize: 34, color: "#111827" },
  price: { marginTop: 10, fontSize: 30, fontWeight: "bold", color: "#111827" },
  destacado: { background: "#fde68a", color: "#92400e", padding: "4px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12, display: "inline-block", marginTop: 8 },
  favsBox: { background: "#fff1f2", color: "#be123c", padding: "10px 14px", borderRadius: 999, fontWeight: 800, border: "1px solid #fecdd3" },
  mainImage: { width: "100%", height: 430, objectFit: "contain", background: "#f8fafc", borderRadius: 12, marginTop: 10 },
  noImage: { width: "100%", height: 320, background: "#eef2f7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 22, marginTop: 10 },
  gallery: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  thumb: { width: 120, height: 80, objectFit: "contain", background: "#f8fafc", cursor: "pointer", borderRadius: 8 },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 },
  infoItem: { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, minHeight: 72 },
  sectionTitle: { marginTop: 0, marginBottom: 14, fontSize: 24, color: "#111827" },
  descriptionBox: { marginTop: 30 },
  description: { lineHeight: 1.7, color: "#374151", fontSize: 16 },
  whatsapp: { display: "inline-block", marginTop: 30, background: "#25D366", color: "#fff", padding: "14px 18px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }
}
