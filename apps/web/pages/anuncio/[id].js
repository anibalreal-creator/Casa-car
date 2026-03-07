import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { formatMoney, isUuidLike } from "@casa-car/shared";

export default function Detalle() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!isUuidLike(id)) {
      setLoading(false);
      setErrorMsg(`ID inválido: ${id}`);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorMsg("");
      const { data, error } = await supabase.from("anuncios").select("*").eq("id", id).single();
      if (error) setErrorMsg(error.message);
      else setItem(data);
      setLoading(false);
    })();
  }, [router.isReady, id]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <Link href="/">← Volver</Link>

      {loading ? <p>Cargando...</p> : null}
      {errorMsg ? <p style={{ color: "crimson" }}>Error: {errorMsg}</p> : null}

      {item ? (
        <div style={{ marginTop: 12 }}>
          <h1 style={{ marginBottom: 6 }}>{item.titulo}</h1>
          <div style={{ opacity: 0.8 }}>{item.ciudad} · {item.tipo} · {item.operacion}</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 12 }}>{formatMoney(item.moneda, item.precio)}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginTop: 16 }}>
            {(item.images || []).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`foto ${i+1}`} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12, border: "1px solid #eee" }} />
            ))}
          </div>

          <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{item.descripcion || "Sin descripción"}</p>

          {item.contact_whatsapp ? (
            <a
              href={`https://wa.me/${item.contact_whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <button>Contactar por WhatsApp</button>
            </a>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
