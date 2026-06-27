import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

export default function EditarAnuncio() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          specs_json: {},
          images: [],
          main_image_index: 0,
          ...d,
          specs_json: d?.specs_json || {},
          images: Array.isArray(d?.images) ? d.images : [],
          main_image_index: Number(d?.main_image_index || 0),
        });
      });
  }, [id]);

  const isProperty = useMemo(() => form?.category === "Propiedad", [form]);
  const isAuto = useMemo(() => form?.category === "Auto", [form]);
  const isMoto = useMemo(() => form?.category === "Moto", [form]);
  const isTruck = useMemo(() => form?.category === "Camión", [form]);
  const isBoat = useMemo(() => form?.category === "Náutica", [form]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSpec(key, value) {
    setForm((prev) => ({
      ...prev,
      specs_json: { ...(prev?.specs_json || {}), [key]: value },
    }));
  }

  function removeExistingImage(idx) {
    setForm((prev) => {
      const next = [...(prev.images || [])];
      next.splice(idx, 1);
      let main = Number(prev.main_image_index || 0);
      if (main >= next.length) main = Math.max(0, next.length - 1);
      return { ...prev, images: next, main_image_index: Math.max(0, main) };
    });
  }

  function moveExistingImage(idx, direction) {
    setForm((prev) => {
      const arr = [...(prev.images || [])];
      const target = direction === "left" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      const tmp = arr[idx];
      arr[idx] = arr[target];
      arr[target] = tmp;

      let main = Number(prev.main_image_index || 0);
      if (main === idx) main = target;
      else if (main === target) main = idx;

      return { ...prev, images: arr, main_image_index: main };
    });
  }

  function onNewFiles(e) {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setNewFiles((prev) => [...prev, ...previews]);
    e.target.value = "";
  }

  function removeNewFile(idx) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadNewFiles(userId) {
    const urls = [];
    for (const item of newFiles) {
      const file = item.file;
      if (!file) continue;
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `editar/${userId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from("listings").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabaseBrowser.storage.from("listings").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) throw new Error("Tenes que iniciar sesion para editar el anuncio.");

      let finalImages = [...(form.images || [])];
      if (newFiles.length) {
        const uploaded = await uploadNewFiles(currentUserId);
        finalImages = [...finalImages, ...uploaded];
      }

      let safeMain = Number(form.main_image_index || 0);
      if (safeMain >= finalImages.length) safeMain = Math.max(0, finalImages.length - 1);

      const payload = {
        ...form,
        images: finalImages,
        main_image_index: safeMain,
      };

      const res = await fetch(`/api/secure/listings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...payload, id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo guardar");
        return;
      }

      alert("Guardado correctamente");
      router.replace("/mis-anuncios");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div style={styles.loading}>Cargando...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <a href="/mis-anuncios" style={styles.back}>← Mis anuncios</a>

        <div style={styles.card}>
          <h1 style={styles.title}>Editar anuncio</h1>

          <form onSubmit={save} style={styles.form}>
            <input value={form.title || ""} onChange={(e) => setField("title", e.target.value)} style={styles.input} placeholder="Título" />

            <div style={styles.row}>
              <input value={form.category || ""} onChange={(e) => setField("category", e.target.value)} style={styles.input} placeholder="Categoría" />
              <input value={form.subtype || ""} onChange={(e) => setField("subtype", e.target.value)} style={styles.input} placeholder="Subtipo" />
            </div>

            <div style={styles.row}>
              <input value={form.listing_type || ""} onChange={(e) => setField("listing_type", e.target.value)} style={styles.input} placeholder="Venta / alquiler / temporal" />
              <input value={form.currency || ""} onChange={(e) => setField("currency", e.target.value)} style={styles.input} placeholder="Moneda" />
            </div>

            <input value={form.price || ""} onChange={(e) => setField("price", e.target.value)} style={styles.input} placeholder="Precio" />

            <div style={styles.row}>
              <input value={form.country || ""} onChange={(e) => setField("country", e.target.value)} style={styles.input} placeholder="País" />
              <input value={form.state || ""} onChange={(e) => setField("state", e.target.value)} style={styles.input} placeholder="Provincia / Estado" />
            </div>

            <div style={styles.row}>
              <input value={form.city || ""} onChange={(e) => setField("city", e.target.value)} style={styles.input} placeholder="Ciudad" />
              <input value={form.zone || ""} onChange={(e) => setField("zone", e.target.value)} style={styles.input} placeholder="Zona / Barrio" />
            </div>

            <input value={form.address || ""} onChange={(e) => setField("address", e.target.value)} style={styles.input} placeholder="Dirección" />
            <input value={form.phone || ""} onChange={(e) => setField("phone", e.target.value)} style={styles.input} placeholder="WhatsApp" />

            <textarea value={form.description || ""} onChange={(e) => setField("description", e.target.value)} style={styles.textarea} placeholder="Descripción" />

            {isProperty ? (
              <section style={styles.box}>
                <h3 style={styles.boxTitle}>Datos de la propiedad</h3>
                <div style={styles.row3}>
                  <input value={form.rooms || ""} onChange={(e) => setField("rooms", e.target.value)} style={styles.input} placeholder="Ambientes" />
                  <input value={form.bathrooms || ""} onChange={(e) => setField("bathrooms", e.target.value)} style={styles.input} placeholder="Baños" />
                  <input value={form.surface || ""} onChange={(e) => setField("surface", e.target.value)} style={styles.input} placeholder="m²" />
                </div>
                <div style={styles.checks}>
                  <label><input type="checkbox" checked={!!form.pool} onChange={(e) => setField("pool", e.target.checked)} /> Pileta</label>
                  <label><input type="checkbox" checked={!!form.garage} onChange={(e) => setField("garage", e.target.checked)} /> Cochera</label>
                </div>
              </section>
            ) : null}

            {isAuto ? (
              <section style={styles.box}>
                <h3 style={styles.boxTitle}>Ficha técnica · Auto</h3>
                <div style={styles.row3}>
                  <input value={form.specs_json?.brand || ""} onChange={(e) => setSpec("brand", e.target.value)} style={styles.input} placeholder="Marca" />
                  <input value={form.specs_json?.model || ""} onChange={(e) => setSpec("model", e.target.value)} style={styles.input} placeholder="Modelo" />
                  <input value={form.specs_json?.year || ""} onChange={(e) => setSpec("year", e.target.value)} style={styles.input} placeholder="Año" />
                  <input value={form.specs_json?.km || ""} onChange={(e) => setSpec("km", e.target.value)} style={styles.input} placeholder="Km" />
                  <input value={form.specs_json?.fuel || ""} onChange={(e) => setSpec("fuel", e.target.value)} style={styles.input} placeholder="Combustible" />
                </div>
              </section>
            ) : null}

            {isMoto ? (
              <section style={styles.box}>
                <h3 style={styles.boxTitle}>Ficha técnica · Moto</h3>
                <div style={styles.row3}>
                  <input value={form.specs_json?.brand || ""} onChange={(e) => setSpec("brand", e.target.value)} style={styles.input} placeholder="Marca" />
                  <input value={form.specs_json?.model || ""} onChange={(e) => setSpec("model", e.target.value)} style={styles.input} placeholder="Modelo" />
                  <input value={form.specs_json?.year || ""} onChange={(e) => setSpec("year", e.target.value)} style={styles.input} placeholder="Año" />
                  <input value={form.specs_json?.cc || ""} onChange={(e) => setSpec("cc", e.target.value)} style={styles.input} placeholder="Cilindrada" />
                  <input value={form.specs_json?.km || ""} onChange={(e) => setSpec("km", e.target.value)} style={styles.input} placeholder="Km" />
                </div>
              </section>
            ) : null}

            {isTruck ? (
              <section style={styles.box}>
                <h3 style={styles.boxTitle}>Ficha técnica · Camión</h3>
                <div style={styles.row3}>
                  <input value={form.specs_json?.brand || ""} onChange={(e) => setSpec("brand", e.target.value)} style={styles.input} placeholder="Marca" />
                  <input value={form.specs_json?.model || ""} onChange={(e) => setSpec("model", e.target.value)} style={styles.input} placeholder="Modelo" />
                  <input value={form.specs_json?.power || ""} onChange={(e) => setSpec("power", e.target.value)} style={styles.input} placeholder="Potencia" />
                  <input value={form.specs_json?.load || ""} onChange={(e) => setSpec("load", e.target.value)} style={styles.input} placeholder="Carga" />
                  <input value={form.specs_json?.km || ""} onChange={(e) => setSpec("km", e.target.value)} style={styles.input} placeholder="Km" />
                </div>
              </section>
            ) : null}

            {isBoat ? (
              <section style={styles.box}>
                <h3 style={styles.boxTitle}>Ficha técnica · Náutica</h3>
                <div style={styles.row3}>
                  <input value={form.specs_json?.length || ""} onChange={(e) => setSpec("length", e.target.value)} style={styles.input} placeholder="Eslora" />
                  <input value={form.specs_json?.beam || ""} onChange={(e) => setSpec("beam", e.target.value)} style={styles.input} placeholder="Manga" />
                  <input value={form.specs_json?.engine || ""} onChange={(e) => setSpec("engine", e.target.value)} style={styles.input} placeholder="Motor" />
                  <input value={form.specs_json?.cabins || ""} onChange={(e) => setSpec("cabins", e.target.value)} style={styles.input} placeholder="Cabinas" />
                  <input value={form.specs_json?.engine_hours || ""} onChange={(e) => setSpec("engine_hours", e.target.value)} style={styles.input} placeholder="Horas motor" />
                </div>
              </section>
            ) : null}

            <section style={styles.box}>
              <h3 style={styles.boxTitle}>Fotos actuales</h3>
              {form.images?.length ? (
                <div style={styles.photos}>
                  {form.images.map((img, idx) => (
                    <div key={img + idx} style={styles.photoCard}>
                      <img src={img} alt={"foto-" + idx} style={styles.photo} />
                      <div style={styles.photoActions}>
                        <button type="button" style={Number(form.main_image_index || 0) === idx ? styles.mainActive : styles.smallBtn} onClick={() => setField("main_image_index", idx)}>
                          {Number(form.main_image_index || 0) === idx ? "Principal" : "Hacer principal"}
                        </button>
                        <button type="button" style={styles.smallBtn} onClick={() => moveExistingImage(idx, "left")}>←</button>
                        <button type="button" style={styles.smallBtn} onClick={() => moveExistingImage(idx, "right")}>→</button>
                        <button type="button" style={styles.deleteBtn} onClick={() => removeExistingImage(idx)}>Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.empty}>Este anuncio no tiene fotos guardadas.</div>
              )}
            </section>

            <section style={styles.box}>
              <h3 style={styles.boxTitle}>Agregar fotos nuevas</h3>
              <input type="file" accept="image/*" multiple onChange={onNewFiles} />
              {newFiles.length ? (
                <div style={styles.photos}>
                  {newFiles.map((img, idx) => (
                    <div key={img.name + idx} style={styles.photoCard}>
                      <img src={img.url} alt={img.name} style={styles.photo} />
                      <div style={styles.photoActionsSimple}>
                        <button type="button" style={styles.deleteBtn} onClick={() => removeNewFile(idx)}>Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={styles.note}>Las fotos nuevas se suben cuando tocás Guardar cambios.</div>
            </section>

            <button type="submit" style={styles.button} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif",padding:"28px 16px"},
  wrap:{maxWidth:980,margin:"0 auto"},
  back:{display:"inline-block",marginBottom:14,textDecoration:"none",color:"#111827",fontWeight:700},
  card:{background:"#fff",padding:18,borderRadius:16,border:"1px solid #e5e7eb"},
  title:{margin:"0 0 16px 0",fontSize:24},
  form:{display:"grid",gap:12},
  row:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  row3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12},
  input:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16},
  textarea:{padding:"14px 16px",border:"1px solid #d1d5db",borderRadius:12,fontSize:16,minHeight:140},
  button:{background:"#0f172a",color:"#fff",border:"none",padding:"14px 18px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  loading:{padding:40,fontFamily:"Arial"},
  box:{display:"grid",gap:12,background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:14,padding:14},
  boxTitle:{margin:0,fontSize:18},
  checks:{display:"flex",gap:16,flexWrap:"wrap"},
  photos:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12},
  photoCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden"},
  photo:{width:"100%",height:130,objectFit:"cover",display:"block"},
  photoActions:{display:"grid",gridTemplateColumns:"1fr 44px 44px 1fr",gap:8,padding:8},
  photoActionsSimple:{display:"grid",padding:8},
  mainActive:{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 10px",fontWeight:700,cursor:"pointer"},
  smallBtn:{background:"#fff",color:"#111827",border:"1px solid #d1d5db",borderRadius:8,padding:"8px 10px",fontWeight:700,cursor:"pointer"},
  deleteBtn:{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 10px",fontWeight:700,cursor:"pointer"},
  empty:{color:"#6b7280"},
  note:{fontSize:13,color:"#6b7280"}
};
