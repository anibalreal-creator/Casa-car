import { useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowser";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export default function CompanyBannerUploader({ onUploaded }) {
  const [uploading, setUploading] = useState(false);

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Tenes que iniciar sesion para subir un banner");

      const dataBase64 = await fileToBase64(file);
      const res = await fetch("/api/secure/listing-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folder: "ads",
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo subir el banner");
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
