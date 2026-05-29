import { useEffect, useRef, useState } from "react";
import GlobalHeader from "../components/GlobalHeader";
import FooterBlueBar from "../components/FooterBlueBar";
import ListingCard from "../components/ListingCard";
import { subscribeFavorites } from "../lib/favorites";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { useLang } from "../context/LanguageContext";

export default function Favoritos() {
  const { t } = useLang();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);

  async function fetchFavoritesView() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setDetailsError("");

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const session = data?.session || null;
      const user = session?.user || null;

      setLogged(Boolean(user));

      if (!session?.access_token || !user) {
        setFavoriteIds([]);
        setItems([]);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      const response = await fetch("/api/secure/favorites", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      console.log("FAVORITOS API:", payload);

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudieron cargar favoritos");
      }

      const nextIds = Array.isArray(payload?.ids) ? payload.ids.map(String) : [];
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];

      setFavoriteIds(nextIds);
      setItems(nextItems);
      setDetailsError(payload?.details_error || "");

      if (nextIds.length && !nextItems.length && !payload?.details_error) {
        setDetailsError("Hay favoritos guardados pero todavía no llegaron los detalles para renderizar las cards.");
      }
    } catch (error) {
      console.error("Error cargando favoritos:", error);
      setFavoriteIds([]);
      setItems([]);
      setDetailsError(error?.message || "No se pudieron cargar favoritos.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    fetchFavoritesView();

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(() => {
      fetchFavoritesView();
    });

    const unsubscribe = subscribeFavorites(() => {
      fetchFavoritesView();
    });

    return () => {
      sub?.subscription?.unsubscribe();
      unsubscribe?.();
    };
  }, []);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <div style={styles.wrap}>
        <div style={styles.kicker}>{t("favorites_kicker", "GUARDADOS")}</div>
        <h1 style={styles.title}>{t("favorites_title", "Favoritos")}</h1>
        <p style={styles.text}>
          {t("favorites_text", "Tus anuncios guardados para volver rápido cuando quieras comparar opciones.")}
        </p>

        <div style={styles.summaryCard}>
          <div>
            <div style={styles.summaryLabel}>{t("favorites_now", "Guardados ahora")}</div>
            <div style={styles.summaryValue}>{logged ? favoriteIds.length : 0}</div>
          </div>
          <a href="/buscar" style={styles.explore}>
            {t("favorites_explore", "Explorar marketplace")}
          </a>
        </div>

        {loading ? <div style={styles.empty}>{t("favorites_loading", "Cargando favoritos...")}</div> : null}

        {!loading && !logged ? (
          <div style={styles.emptyBox}>
            <h2 style={styles.emptyTitle}>{t("favorites_need_login_title", "Necesitás iniciar sesión para ver tus favoritos")}</h2>
            <p style={styles.emptyText}>
              {t("favorites_user_private", "Tus favoritos quedan asociados a tu cuenta y no se muestran a otras personas al cerrar sesión.")}
            </p>
            <div style={styles.actionsRow}>
              <a href="/dashboard" style={styles.primary}>{t("nav_login", "Ingresar")}</a>
              <a href="/buscar" style={styles.secondary}>{t("favorites_go_search", "Ir a buscar anuncios")}</a>
            </div>
          </div>
        ) : null}

        {!loading && logged && detailsError ? (
          <div style={styles.warningBox}>
            <h2 style={styles.warningTitle}>{t("favorites_saved_title", "Tus favoritos están guardados")}</h2>
            <p style={styles.warningText}>{detailsError}</p>
          </div>
        ) : null}

        {!loading && logged && !favoriteIds.length ? (
          <div style={styles.emptyBox}>
            <h2 style={styles.emptyTitle}>{t("favorites_empty_title", "Todavía no guardaste anuncios")}</h2>
            <p style={styles.emptyText}>
              {t("favorites_empty_text", "Entrá a cualquier publicación y usá el botón de favoritos para armar tu shortlist.")}
            </p>
            <div style={styles.actionsRow}>
              <a href="/buscar" style={styles.primary}>{t("favorites_go_search", "Ir a buscar anuncios")}</a>
            </div>
          </div>
        ) : null}

        {!loading && logged && items.length > 0 ? (
          <div style={styles.grid}>
            {items.map((item, index) => (
              <ListingCard
                key={String(item?.id || item?.listing_id || index)}
                item={item}
              />
            ))}
          </div>
        ) : null}
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { background: "#f8fafc", minHeight: "100vh" },
  wrap: { maxWidth: 1200, margin: "0 auto", padding: "28px 20px 56px" },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#7c3aed", textTransform: "uppercase", marginBottom: 10 },
  title: { fontSize: 54, lineHeight: 1.02, margin: "0 0 10px", color: "#111827", fontWeight: 900 },
  text: { fontSize: 18, color: "#6b7280", maxWidth: 760, margin: "0 0 24px" },
  summaryCard: {
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20,
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "22px 24px",
    marginBottom: 28, boxShadow: "0 8px 22px rgba(15,23,42,.05)",
  },
  summaryLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "#6b7280", fontWeight: 900, marginBottom: 8 },
  summaryValue: { fontSize: 54, fontWeight: 900, color: "#111827", lineHeight: 1 },
  explore: { textDecoration: "none", background: "#1d4ed8", color: "#fff", padding: "12px 18px", borderRadius: 12, fontWeight: 800 },
  empty: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 24, color: "#374151" },
  emptyBox: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 28, boxShadow: "0 8px 22px rgba(15,23,42,.05)" },
  emptyTitle: { fontSize: 30, margin: "0 0 12px", fontWeight: 900, color: "#111827" },
  emptyText: { fontSize: 17, color: "#6b7280", margin: "0 0 18px", maxWidth: 700 },
  warningBox: { background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 20, padding: 28, marginBottom: 20 },
  warningTitle: { fontSize: 30, margin: "0 0 12px", fontWeight: 900, color: "#9a3412" },
  warningText: { fontSize: 17, color: "#9a3412", margin: 0, maxWidth: 760 },
  actionsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  primary: { textDecoration: "none", background: "#111827", color: "#fff", padding: "12px 16px", borderRadius: 12, fontWeight: 800 },
  secondary: { textDecoration: "none", background: "#fff", color: "#111827", padding: "12px 16px", borderRadius: 12, fontWeight: 800, border: "1px solid #d1d5db" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 },
};
