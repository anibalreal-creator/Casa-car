import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { supabase } from "../lib/supabaseClient";

export default function Publicar() {
  const router = useRouter();

  const [session, setSession] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [ciudad, setCiudad] = useState("");
  const [tipo, setTipo] = useState("inmueble");
  const [operacion, setOperacion] = useState("venta");

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const canPublish = useMemo(() => {
    if (!titulo.trim()) return false;
    if (!precio || isNaN(Number(precio))) return false;
    return true;
  }, [titulo, precio]);

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    setFiles((prev) => {
      const merged = [...prev, ...picked];
      const seen = new Set();
      const unique = [];
      for (const f of merged) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(f);
        }
      }
      return unique;
    });

    e.target.value = "";
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearAll() {
    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setMoneda("ARS");
    setCiudad("");
    setTipo("inmueble");
    setOperacion("venta");
    setFiles([]);
    setMsg("");
  }

  async function uploadOneFile({ file, anuncioId, index }) {
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `${anuncioId}/${String(index).padStart(2, "0")}_${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage.from("listings").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (upErr) throw upErr;
    return path;
  }

  async function onPublish() {
    setMsg("");

    if (!session) {
      setMsg("Tenés que estar logueado para publicar.");
      return;
    }
    if (!canPublish) {
      setMsg("Completá título y precio (número).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        precio: Number(precio),
        moneda,
        ciudad: ciudad.trim() || null,
        tipo,
        operacion,
      };

      const { data: anuncio, error: insErr } = await supabase
        .from("anuncios")
        .insert(payload)
        .select("*")
        .single();

      if (insErr) throw insErr;

      const anuncioId = anuncio.id;

      let paths = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const p = await uploadOneFile({ file: files[i], anuncioId, index: i });
          paths.push(p);
        }
      }

      if (paths.length > 0) {
        const rows = paths.map((p, i) => ({
          anuncio_id: anuncioId,
          path: p,
          orden: i,
        }));

        const { error: fotosErr } = await supabase.from("anuncio_fotos").insert(rows);
        if (fotosErr) throw fotosErr;
      }

      setMsg("✅ Publicado. Abriendo el anuncio...");
      await router.push(`/anuncio/${anuncioId}`);
      clearAll();
    } catch (e) {
      console.error(e);
      setMsg(`❌ Error: ${e?.message || "algo salió mal"}`);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    wrap: { maxWidth: 760, margin: "40px auto", padding: 16 },
    card: { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 18, background: "white" },
    row: { display: "flex", gap: 12, flexWrap: "wrap" },
    col: { display: "flex", flexDirection: "column", gap: 6, flex: "1 1 220px" },
    label: { fontWeight: 700 },
    input: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.2)", outline: "none", fontSize: 14 },
    select: { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.2)", outline: "none", fontSize: 14, background: "white" },
    btnRow: { display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" },
    btn: (primary) => ({
      padding: "10px 14px",
      borderRadius: 10,
      border: primary ? "none" : "1px solid rgba(0,0,0,0.2)",
      background: primary ? "black" : "white",
      color: primary ? "white" : "black",
      cursor: "pointer",
      opacity: loading ? 0.7 : 1,
    }),
    thumbs: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
    thumb: { width: 110, height: 80, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", overflow: "hidden", position: "relative", background: "rgba(0,0,0,0.03)" },
    x: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.75)", color: "white", fontWeight: 700, lineHeight: "24px", textAlign: "center" },
    help: { marginTop: 8, color: "rgba(0,0,0,0.65)", fontSize: 13 },
    msg: { marginTop: 12, fontWeight: 700 },
  };

  return (
    <div style={styles.wrap}>
      <h1 style={{ marginBottom: 6 }}>Publicar anuncio</h1>
      <div style={{ marginBottom: 12, color: "rgba(0,0,0,0.7)" }}>Publicá un anuncio con fotos (Supabase Storage + DB).</div>
      <Nav />

      <div style={styles.card}>
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>Título</label>
            <input style={styles.input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Depto 2 ambientes" />
          </div>

          <div style={styles.col}>
            <label style={styles.label}>Precio</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...styles.input, flex: 1 }} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 30000" />
              <select style={styles.select} value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="ARS">ARS (Pesos)</option>
                <option value="USD">USD (Dólares)</option>
                <option value="BRL">BRL (Reales)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ ...styles.row, marginTop: 12 }}>
          <div style={styles.col}>
            <label style={styles.label}>Descripción</label>
            <input style={styles.input} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: 2 pisos con patio, cochera y jardín" />
          </div>

          <div style={styles.col}>
            <label style={styles.label}>Ciudad</label>
            <input style={styles.input} value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej: Buenos Aires" />
          </div>
        </div>

        <div style={{ ...styles.row, marginTop: 12 }}>
          <div style={styles.col}>
            <label style={styles.label}>Tipo</label>
            <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="inmueble">inmueble</option>
              <option value="auto">auto</option>
            </select>
          </div>

          <div style={styles.col}>
            <label style={styles.label}>Operación</label>
            <select style={styles.select} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
              <option value="venta">venta</option>
              <option value="alquiler">alquiler</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={styles.label}>Fotos</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
            <input type="file" multiple accept="image/*" onChange={onPickFiles} />
            <button type="button" style={styles.btn(false)} onClick={() => setFiles([])} disabled={loading}>Quitar todas</button>
            <span style={{ color: "rgba(0,0,0,0.6)" }}>{files.length > 0 ? `${files.length} foto(s)` : "Sin fotos"}</span>
          </div>

          <div style={styles.help}>Tip: para sacar una, tocá la X en su miniatura.</div>

          {previewUrls.length > 0 && (
            <div style={styles.thumbs}>
              {previewUrls.map((u, i) => (
                <div key={u} style={styles.thumb}>
                  <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" style={styles.x} onClick={() => removeFile(i)} title="Quitar">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.btnRow}>
          <button type="button" style={styles.btn(true)} onClick={onPublish} disabled={loading || !canPublish}>
            {loading ? "Publicando..." : "Publicar"}
          </button>
          <button type="button" style={styles.btn(false)} onClick={clearAll} disabled={loading}>Limpiar formulario</button>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}
      </div>
    </div>
  );
}
