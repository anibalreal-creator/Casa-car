import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function formatMoney(valor, moneda) {
  const n = Number(valor);
  const m = String(moneda || "").toUpperCase();
  const symbol = m === "USD" ? "US$" : m === "ARS" ? "$" : m === "BRL" ? "R$" : m;

  if (!Number.isFinite(n)) return `${symbol} ${valor}`;

  const parts = n.toFixed(n % 1 === 0 ? 0 : 2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = parts[1] ? "," + parts[1] : "";
  return `${symbol} ${int}${dec}`;
}

export default function AnuncioDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .eq("id", id)
        .single();

      setLoading(false);

      if (error) {
        setErrorMsg(error.message);
        setAnuncio(null);
        return;
      }

      setAnuncio(data);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
        <p>Cargando anuncio…</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
        <button onClick={() => router.push("/")}>← Volver</button>
        <p style={{ color: "crimson", marginTop: 10 }}>Error: {errorMsg}</p>
      </main>
    );
  }

  if (!anuncio) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
        <button onClick={() => router.push("/")}>← Volver</button>
        <p style={{ marginTop: 10 }}>No se encontró el anuncio.</p>
      </main>
    );
  }

  const isAlquiler = anuncio.operacion === "alquiler";

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <button onClick={() => router.push("/")}>← Volver</button>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginTop: 12 }}>
        <h1 style={{ marginTop: 0 }}>{anuncio.titulo}</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 14,
              color: "#fff",
              background: isAlquiler ? "#1976d2" : "#2e7d32",
              fontSize: 12,
            }}
          >
            {isAlquiler ? "ALQUILER" : "VENTA"}
          </span>

          <span style={{ padding: "2px 10px", borderRadius: 14, border: "1px solid #ccc", fontSize: 12 }}>
            {anuncio.tipo}
          </span>

          <span style={{ padding: "2px 10px", borderRadius: 14, border: "1px solid #ccc", fontSize: 12 }}>
            {anuncio.ciudad}
          </span>
        </div>

        <h2 style={{ margin: "0 0 8px 0" }}>
          {formatMoney(anuncio.precio, anuncio.moneda)}
          {isAlquiler ? " / mes" : ""}
        </h2>

        {anuncio.descripcion && (
          <p style={{ opacity: 0.9, lineHeight: 1.4 }}>{anuncio.descripcion}</p>
        )}

        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 12 }}>
          ID: {anuncio.id} <br />
          Publicado: {anuncio.created_at ? new Date(anuncio.created_at).toLocaleString() : "—"}
        </div>
      </div>
    </main>
  );
}
