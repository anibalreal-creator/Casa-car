import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { formatMoney } from "../../lib/formatMoney";

export async function getServerSideProps(ctx) {
  const { id } = ctx.params;

  const { data, error } = await supabase
    .from("listings")
    .select("id,titulo,descripcion,precio,moneda,created_at")
    .eq("id", id)
    .single();

  return {
    props: {
      anuncio: data || null,
      errorMsg: error ? error.message : null,
    },
  };
}

export default function Anuncio({ anuncio, errorMsg }) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <div style={{ marginBottom: 10 }}>
        <Link href="/">← Volver</Link>
      </div>

      {errorMsg ? <p style={{ color: "crimson" }}>Error: {errorMsg}</p> : null}
      {!anuncio ? <p>No existe el anuncio.</p> : null}

      {anuncio ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            overflow: "hidden",
            maxWidth: 820,
            background: "white",
          }}
        >
          <div
            style={{
              height: 220,
              background: "#f3f3f3",
              display: "grid",
              placeItems: "center",
              color: "#777",
            }}
          >
            Sin foto
          </div>

          <div style={{ padding: 16 }}>
            <h1 style={{ margin: 0, textTransform: "uppercase" }}>{anuncio.titulo}</h1>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900 }}>
              {formatMoney(anuncio.moneda, anuncio.precio)}
            </div>
            <p style={{ marginTop: 12, color: "#444" }}>{anuncio.descripcion}</p>
            <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
              Publicado: {new Date(anuncio.created_at).toLocaleString("es-AR")}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
