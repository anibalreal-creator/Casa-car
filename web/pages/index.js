import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      const r = await fetch("/api/listings", { cache: "no-store" });

      // Si el server devuelve HTML o error, lo mostramos claro
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`HTTP ${r.status}: ${t.slice(0, 120)}`);
      }

      const j = await r.json();
      setItems(Array.isArray(j) ? j : []);
    } catch (e) {
      setErr(String(e?.message || e));
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Casa-Car</h1>

      <a href="/publicar">+ Publicar anuncio</a>
      <button onClick={load} style={{ marginLeft: 10 }}>
        Recargar
      </button>

      {err ? <div style={{ color: "crimson", marginTop: 10 }}>{err}</div> : null}

      {items.length === 0 && !err ? (
        <p style={{ marginTop: 16 }}>No hay anuncios todavía.</p>
      ) : null}

      <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
        {items.map((it) => (
          <div key={it.id} style={{ border: "1px solid #ccc", padding: 12, width: 240 }}>
            <div style={{ height: 90, background: "#eee", display: "grid", placeItems: "center" }}>
              Sin foto
            </div>

            <strong>{it.title || "Sin título"}</strong>

            <div>
              {(it.currency || "USD") + " " + (it.price != null ? Number(it.price).toLocaleString() : "0")}
            </div>

            <div style={{ opacity: 0.8 }}>{it.description || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
