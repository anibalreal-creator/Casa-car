import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Nav from "../../components/Nav";
import { supabase } from "../../lib/supabaseClient";

export default function AnuncioDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anuncio, setAnuncio] = useState(null);
  const [fotoUrls, setFotoUrls] = useState([]);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data: a, error: e1 } = await supabase
          .from("anuncios")
          .select("*")
          .eq("id", id)
          .single();

        if (e1) throw e1;
        setAnuncio(a);

        const { data: f, error: e2 } = await supabase
          .from("anuncio_fotos")
          .select("*")
          .eq("anuncio_id", id)
          .order("orden", { ascending: true });

        if (e2) throw e2;

        const bucket = "listings";
        const urls = (f || [])
          .map((row) => {
            const { data } = supabase.storage.from(bucket).getPublicUrl(row.path);
            return data?.publicUrl || null;
          })
          .filter(Boolean);

        setFotoUrls(urls);

        setDebug({
          id,
          cantidad_fotos: (f || []).length,
          bucket,
          paths: (f || []).map((x) => x.path),
          urls_generadas: urls,
        });
      } catch (e) {
        console.error(e);
        setError(e?.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const precioFmt = useMemo(() => {
    if (!anuncio) return "";
    const m = anuncio.moneda || "ARS";
    const val = anuncio.precio ?? 0;
    const formatted = new Intl.NumberFormat("es-AR").format(val);
    return `${m} $${formatted}`;
  }, [anuncio]);

  const styles = {
    wrap: { maxWidth: 1000, margin: "30px auto", padding: 16 },
    card: { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 18, background: "white" },
    gallery: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 },
    imgBox: { width: 360, maxWidth: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)" },
    img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    muted: { color: "rgba(0,0,0,0.65)" },
    debugBox: { marginTop: 16, background: "rgba(0,0,0,0.85)", color: "white", borderRadius: 10, padding: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, overflowX: "auto", whiteSpace: "pre" },
    err: { color: "crimson", fontWeight: 800, marginTop: 10 },
  };

  if (loading) {
    return (
      <div style={styles.wrap}>
        <Nav />
        <div>Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrap}>
        <Nav />
        <div style={styles.err}>Error: {error}</div>
      </div>
    );
  }

  if (!anuncio) {
    return (
      <div style={styles.wrap}>
        <Nav />
        <div>No se encontró el anuncio.</div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <Nav />

      <div style={styles.card}>
        <h1 style={{ marginTop: 0 }}>{anuncio.titulo}</h1>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>{precioFmt}</div>

        <div style={styles.muted}>Publicado: {anuncio.created_at ? new Date(anuncio.created_at).toLocaleString("es-AR") : "-"}</div>

        {anuncio.ciudad && <div style={{ marginTop: 6 }}>{anuncio.ciudad}</div>}
        {anuncio.descripcion && <p style={{ marginTop: 10, marginBottom: 0 }}>{anuncio.descripcion}</p>}

        <div style={styles.gallery}>
          {fotoUrls.length > 0 ? (
            fotoUrls.map((u) => (
              <div key={u} style={styles.imgBox}>
                <img src={u} alt="" style={styles.img} />
              </div>
            ))
          ) : (
            <div style={{ marginTop: 10 }}>
              <b>No hay fotos para mostrar</b> (o no se pudieron convertir a URL)
              <div style={styles.muted}>Tip: mirá abajo el “DEBUG” para ver paths y urls generadas.</div>
            </div>
          )}
        </div>

        {debug && <div style={styles.debugBox}>{JSON.stringify(debug, null, 2)}</div>}
      </div>
    </div>
  );
}
