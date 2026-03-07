import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data: anuncios, error: e1 } = await supabase
          .from("anuncios")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(24);

        if (e1) throw e1;

        const ids = (anuncios || []).map((a) => a.id);
        let fotos = [];
        let fotosErr = null;

        if (ids.length > 0) {
          const { data: f, error: e2 } = await supabase
            .from("anuncio_fotos")
            .select("*")
            .in("anuncio_id", ids)
            .order("orden", { ascending: true });

          if (e2) fotosErr = e2.message;
          fotos = f || [];
        }

        const bucket = "listings";
        const firstPhotoByAnuncio = new Map();
        for (const row of fotos) {
          if (!firstPhotoByAnuncio.has(row.anuncio_id)) {
            firstPhotoByAnuncio.set(row.anuncio_id, row.path);
          }
        }

        const withPhoto = (anuncios || []).map((a) => {
          const path = firstPhotoByAnuncio.get(a.id) || null;
          let url = null;
          if (path) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            url = data?.publicUrl || null;
          }
          return { ...a, foto_path: path, foto_url: url };
        });

        setItems(withPhoto);

        setDebug({
          anunciosCount: (anuncios || []).length,
          ids,
          fotosCount: fotos.length,
          fotosErr,
          sample: withPhoto.slice(0, 5).map((x) => ({
            id: x.id,
            titulo: x.titulo,
            path: x.foto_path,
            url: x.foto_url,
          })),
        });
      } catch (e) {
        console.error(e);
        setErr(e?.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const styles = {
    wrap: { maxWidth: 1100, margin: "30px auto", padding: 16 },
    title: { fontSize: 34, margin: 0, fontWeight: 900 },
    sub: { marginTop: 6, color: "rgba(0,0,0,0.65)" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginTop: 14 },
    card: {
      border: "1px solid rgba(0,0,0,0.12)",
      borderRadius: 14,
      overflow: "hidden",
      background: "white",
      cursor: "pointer",
    },
    img: { width: "100%", height: 150, objectFit: "cover", display: "block", background: "#eee" },
    body: { padding: 12 },
    h: { margin: 0, fontWeight: 900 },
    price: { marginTop: 6, fontWeight: 800 },
    muted: { color: "rgba(0,0,0,0.6)", fontSize: 12, marginTop: 6 },
    debugBox: {
      marginTop: 16,
      background: "rgba(0,0,0,0.85)",
      color: "white",
      borderRadius: 10,
      padding: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      overflowX: "auto",
      whiteSpace: "pre",
    },
    err: { color: "crimson", fontWeight: 800, marginTop: 10 },
  };

  const fmt = (a) => {
    const m = a.moneda || "ARS";
    const val = a.precio ?? 0;
    const formatted = new Intl.NumberFormat("es-AR").format(val);
    return `${m} $${formatted}`;
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Casa-Car</h1>
      <div style={styles.sub}>Últimos anuncios publicados</div>
      <Nav />

      {loading && <div>Cargando...</div>}
      {err && <div style={styles.err}>Error: {err}</div>}

      {!loading && !err && (
        <div style={styles.grid}>
          {items.map((a) => (
            <div key={a.id} style={styles.card} onClick={() => (window.location.href = `/anuncio/${a.id}`)}>
              {a.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.foto_url} alt="" style={styles.img} />
              ) : (
                <div style={{ ...styles.img, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
                  Sin foto
                </div>
              )}
              <div style={styles.body}>
                <div style={styles.h}>{a.titulo}</div>
                <div style={styles.price}>{fmt(a)}</div>
                <div style={styles.muted}>
                  {a.created_at ? new Date(a.created_at).toLocaleString("es-AR") : "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {debug && <div style={styles.debugBox}>{JSON.stringify(debug, null, 2)}</div>}
    </div>
  );
}
