import { useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowser";

export default function CompanyBannerUploader({ onUploaded }) {
  const [uploading, setUploading] = useState(false);

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error("Tenes que iniciar sesion para subir un banner");
      const ext = file.name.split('.').pop();
      const path = `ads/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabaseBrowser.storage.from("listings").upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabaseBrowser.storage.from("listings").getPublicUrl(path);
      onUploaded?.(data.publicUrl);
    } catch (err) {
      alert(err.message || "No se pudo subir el banner");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #d1d5db", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
      <input type="file" accept="image/*" onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontWeight: 800 }}>{uploading ? "Subiendo..." : "Subir banner"}</span>
    </label>
  );
}
