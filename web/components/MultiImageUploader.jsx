import { useState } from "react";
import { useLang } from "../context/LanguageContext";

async function compressImage(file) {
  if (!file.type?.startsWith("image/")) return file;
  if (file.size < 900 * 1024) return file;
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") return file;

  const bitmap = await createImageBitmap(file);
  const maxSide = 1800;
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  if (typeof canvas.toBlob !== "function") return file;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) return file;
  const nextName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], nextName, { type: "image/webp", lastModified: Date.now() });
}

export default function MultiImageUploader({ images, setImages }) {
  const { t } = useLang();
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type?.startsWith("image/"));
    if (!files.length) return;
    setWorking(true);
    try {
      const previews = [];
      for (const original of files.slice(0, 24)) {
        const file = await compressImage(original);
        previews.push({
          file,
          name: `${file.name}-${Math.random().toString(36).slice(2, 7)}`,
          url: URL.createObjectURL(file),
          size: file.size,
        });
      }
      setImages((prev) => [...prev, ...previews].slice(0, 30));
    } finally {
      setWorking(false);
    }
  }

  function onFiles(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function removeImage(name) {
    setImages((prev) => prev.filter((img) => img.name !== name));
  }

  function setMain(name) {
    setImages((prev) => {
      const selected = prev.find((img) => img.name === name);
      if (!selected) return prev;
      return [selected, ...prev.filter((img) => img.name !== name)];
    });
  }

  return (
    <div
      style={{ ...styles.wrap, ...(dragging ? styles.dragging : null) }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <div style={styles.head}>
        <div>
          <label style={styles.label}>{t("images_label", "Fotos multiples")}</label>
          <div style={styles.help}>{t("images_help", "Arrastra fotos o elegilas. Se comprimen automaticamente si son pesadas.")}</div>
        </div>
        <label style={styles.pickButton}>
          {working ? t("images_processing", "Procesando...") : t("images_pick", "Elegir fotos")}
          <input type="file" accept="image/*" multiple onChange={onFiles} style={styles.hiddenInput} />
        </label>
      </div>

      <div style={styles.dropText}>{t("images_drop", "Solta las imagenes aca para sumarlas a la publicacion")}</div>

      {!!images.length && (
        <div style={styles.grid}>
          {images.map((img, idx) => (
            <div key={img.name} style={styles.card}>
              <img src={img.url} alt={img.name} style={styles.img} />
              <div style={styles.name}>{idx === 0 ? t("images_main", "Principal") : t("images_photo", "Foto")} · {img.file?.name || img.name}</div>
              <div style={styles.actions}>
                {idx !== 0 ? <button type="button" style={styles.secondary} onClick={() => setMain(img.name)}>{t("images_set_main", "Principal")}</button> : null}
                <button type="button" style={styles.remove} onClick={() => removeImage(img.name)}>{t("images_remove", "Quitar")}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { border: "1px dashed #94a3b8", borderRadius: 18, padding: 16, background: "#f8fafc", display: "grid", gap: 12, minWidth: 0, maxWidth: "100%", overflow: "hidden" },
  dragging: { borderColor: "#1d4ed8", background: "#eff6ff" },
  head: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", minWidth: 0 },
  label: { display: "block", fontWeight: 900, color: "#111827" },
  help: { marginTop: 6, color: "#64748b", fontSize: 13, maxWidth: 620, overflowWrap: "break-word" },
  pickButton: { display: "inline-grid", placeItems: "center", border: "none", background: "#111827", color: "#fff", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontWeight: 900, maxWidth: "100%" },
  hiddenInput: { display: "none" },
  dropText: { border: "1px dashed #cbd5e1", borderRadius: 14, padding: "16px 14px", textAlign: "center", color: "#475569", fontWeight: 800, background: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,150px),1fr))", gap: 12, minWidth: 0 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", display: "grid" },
  img: { width: "100%", height: 118, objectFit: "cover", display: "block" },
  name: { padding: 8, fontSize: 12, color: "#4b5563", wordBreak: "break-word" },
  actions: { display: "flex", gap: 6, padding: 8, paddingTop: 0, flexWrap: "wrap" },
  secondary: { flex: 1, border: "1px solid #d1d5db", background: "#fff", color: "#111827", borderRadius: 8, padding: "8px 6px", cursor: "pointer", fontWeight: 800, fontSize: 12 },
  remove: { flex: 1, border: "none", background: "#ef4444", color: "#fff", borderRadius: 8, padding: "8px 6px", cursor: "pointer", fontWeight: 800, fontSize: 12 },
};
