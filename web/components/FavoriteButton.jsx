import { useEffect, useState } from "react";
import { isFavorite, subscribeFavorites, toggleFavorite } from "../lib/favorites";
import { useLang } from "../context/LanguageContext";

export default function FavoriteButton({ listingId, compact = false }) {
  const { t } = useLang();
  const id = String(listingId || "");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!id) return;
    setSaved(isFavorite(id));
    setReady(true);
    return subscribeFavorites((ids) => setSaved(ids.includes(id)));
  }, [id]);

  async function onToggle(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!id || pending) return;
    try {
      setPending(true);
      const next = await toggleFavorite(id);
      setSaved(next.includes(id));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-busy={pending}
      title={saved ? t("favorite_title_remove", "Quitar de favoritos") : t("favorite_title_add", "Guardar en favoritos")}
      style={compact ? (saved ? styles.compactActive : styles.compact) : (saved ? styles.active : styles.button)}
    >
      {compact ? (saved ? "♥" : "♡") : (ready ? (saved ? `★ ${t("favorite_saved", "Favorito guardado")}` : `☆ ${t("favorite_add", "Agregar a favoritos")}`) : t("favorite_short", "Favoritos"))}
    </button>
  );
}

const base = { padding: "10px 12px", borderRadius: 10, fontWeight: 700, cursor: "pointer", transition: "all .2s ease" };
const styles = {
  button:{...base,border:"1px solid #d1d5db",background:"#fff",color:"#111827"},
  active:{...base,border:"1px solid #8b5cf6",background:"#ede9fe",color:"#5b21b6"},
  compact:{width:42,height:42,display:"grid",placeItems:"center",borderRadius:"999px",border:"1px solid #f9a8d4",background:"rgba(255,255,255,.98)",color:"#db2777",fontSize:24,fontWeight:900,cursor:"pointer",boxShadow:"0 10px 24px rgba(15,23,42,.18)",position:"relative",zIndex:30},
  compactActive:{width:42,height:42,display:"grid",placeItems:"center",borderRadius:"999px",border:"1px solid #f472b6",background:"rgba(253,242,248,.99)",color:"#db2777",fontSize:24,fontWeight:900,cursor:"pointer",boxShadow:"0 10px 24px rgba(15,23,42,.18)",position:"relative",zIndex:30}
};
