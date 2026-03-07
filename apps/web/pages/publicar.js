import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { MONEDAS, OPERACIONES, TIPOS, parseMoney, formatMoney } from "@casa-car/shared";

export default function Publicar() {
  const [session, setSession] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // form
  const [tipo, setTipo] = useState("inmueble");
  const [operacion, setOperacion] = useState("venta");
  const [moneda, setMoneda] = useState("USD");
  const [ciudad, setCiudad] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioTxt, setPrecioTxt] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const precio = useMemo(() => parseMoney(precioTxt), [precioTxt]);

  async function ensureLogin() {
    if (session) return true;
    const email = prompt("Ingresá tu email para recibir link de acceso:");
    if (!email) return false;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/publicar` },
    });
    if (error) alert(error.message);
    else alert("Te envié un link al email. Abrilo y volvé acá.");
    return false;
  }

  async function uploadImages(ownerId, anuncioId) {
    const urls = [];
    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ownerId}/${anuncioId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("listing-images").upload(path, f, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function crearBorrador(e) {
    e.preventDefault();
    setMsg("");

    const ok = await ensureLogin();
    if (!ok) return;

    if (!titulo.trim() || !ciudad.trim()) return setMsg("Falta título o ciudad");
    if (!Number.isFinite(precio) || precio <= 0) return setMsg("Precio inválido");
    if (files.length > 6) return setMsg("Máximo 6 fotos");

    setLoading(true);

    try {
      const ownerId = session.user.id;

      // 1) crear draft
      const { data: inserted, error: insErr } = await supabase
        .from("anuncios")
        .insert({
          status: "draft",
          owner_id: ownerId,
          tipo,
          operacion,
          moneda,
          ciudad: ciudad.trim(),
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          precio,
          contact_whatsapp: whatsapp.trim() || null,
          images: [],
        })
        .select("*")
        .single();

      if (insErr) throw insErr;

      // 2) subir fotos
      const urls = files.length ? await uploadImages(ownerId, inserted.id) : [];

      // 3) guardar urls en anuncio
      const { error: upErr } = await supabase
        .from("anuncios")
        .update({ images: urls })
        .eq("id", inserted.id);

      if (upErr) throw upErr;

      // 4) pagar -> checkout
      const skip = String(process.env.NEXT_PUBLIC_SKIP_PAYMENT).toLowerCase() === "true";
      if (skip) {
        // publicar directo
        await supabase.from("anuncios").update({ status: "published" }).eq("id", inserted.id);
        window.location.href = `/anuncio/${inserted.id}`;
        return;
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncioId: inserted.id }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Error creando checkout");

      window.location.href = out.url;
    } catch (err) {
      setMsg(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 780, margin: "0 auto" }}>
      <Link href="/">← Volver</Link>
      <h1>Publicar (pago)</h1>

      <form onSubmit={crearBorrador} style={{ border: "1px solid #ddd", padding: 14, borderRadius: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label>
            Tipo<br />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Operación<br />
            <select value={operacion} onChange={(e) => setOperacion(e.target.value)}>
              {OPERACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label>
            Moneda<br />
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Ciudad<br />
            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Título<br />
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Descripción<br />
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <label>Precio<br />
            <input value={precioTxt} onChange={(e) => setPrecioTxt(e.target.value)} placeholder="ej: 2500,50 o 2500.50" />
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              Vista previa: {Number.isFinite(precio) ? formatMoney(moneda, precio) : "—"}
            </div>
          </label>
          <label>WhatsApp (opcional, con código país)<br />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="549351..." />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Fotos (hasta 6)<br />
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
        </div>

        <button disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Procesando..." : "Continuar a pago"}
        </button>

        {msg ? <div style={{ marginTop: 10, color: "crimson" }}>{msg}</div> : null}

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
          Si activás <b>NEXT_PUBLIC_SKIP_PAYMENT=true</b> en .env.local, publica sin pagar (solo test).
        </div>
      </form>
    </main>
  );
}
