import { useEffect, useState } from "react";
import Link from "next/link";
import { startPremiumCheckout } from "../lib/startPremiumCheckout";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import FooterBlueBar from "../components/FooterBlueBar";
import GlobalHeader from "../components/GlobalHeader";
import { useLang } from "../context/LanguageContext";
import { getImagePresentation } from "../lib/imagePresentation";
import { getListingDetailHref, getListingEditHref } from "../lib/listingRoutes";

export default function MisAnuncios() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [loadingPremiumId, setLoadingPremiumId] = useState("");
  const [featureActionId, setFeatureActionId] = useState("");

  async function load() {
    try {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      const user = auth?.user;
      setAuthUser(user || null);
      if (!user) { setLogged(false); setItems([]); setReady(true); return; }
      setLogged(true);
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;
      const r = await fetch('/api/secure/listings?mine=1&page=1&pageSize=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json();
      const nextItems = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      nextItems.sort((a, b) => {
        const score = (item) => (item?.highlighted ? 4 : 0) + (item?.is_premium ? 2 : 0) + (Number(item?.views || 0) > 0 ? 1 : 0);
        return score(b) - score(a);
      });
      setItems(nextItems);
    } catch { setItems([]); } finally { setReady(true); }
  }

  useEffect(() => { load(); }, []);

  async function removeItem(id) {
    if (!confirm(t("confirm_delete_listing", "¿Eliminar anuncio?"))) return;
    const { data: sessionData } = await supabaseBrowser.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch(`/api/secure/listings`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return alert(t("delete_listing_error", "No se pudo eliminar"));
    load();
  }

  async function activatePremium(item) {
    try {
      setLoadingPremiumId(item.id);
      await startPremiumCheckout(item.id);
    } catch (error) {
      alert(error.message || 'No se pudo iniciar Mercado Pago');
    } finally {
      setLoadingPremiumId("");
    }
  }


  async function syncFeatured(item) {
    try {
      setFeatureActionId(item.id);
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch('/api/secure/premium-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ listing_id: item.id, step: 'activate', plan: item.premium_plan || 'DESTACADO' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No se pudo sincronizar el destacado');
      await load();
    } catch (error) {
      alert(error.message || 'No se pudo sincronizar el destacado');
    } finally {
      setFeatureActionId('');
    }
  }

  const totals = items.reduce((acc, item) => {
    acc.views += Number(item.views || 0);
    acc.whatsapp += Number(item.clicks_whatsapp || 0);
    acc.mail += Number(item.clicks_mail || 0);
    acc.chat += Number(item.chat_messages || 0);
    acc.premium += item.is_premium || item.highlighted ? 1 : 0;
    acc.featured += item.highlighted ? 1 : 0;
    return acc;
  }, { views: 0, whatsapp: 0, mail: 0, chat: 0, premium: 0, featured: 0 });

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <div style={styles.wrap}>
        <h1 style={styles.title}>{t('my_ads_title', 'Mis anuncios')}</h1>
        {!ready ? <div style={styles.empty}>{t('my_ads_loading', 'Cargando anuncios…')}</div> : null}
        {ready && !logged ? (
          <div style={styles.emptyBox}>
            <strong>{t('my_ads_need_login', 'Necesitás iniciar sesión para ver tus anuncios.')}</strong>
            <div style={styles.actions}>
              <a href="/dashboard" style={styles.link}>{t('my_ads_go_login', 'Ingresar')}</a>
              <a href="/" style={styles.linkAlt}>{t('my_ads_back_home', 'Volver al inicio')}</a>
            </div>
          </div>
        ) : null}
        {logged ? (
          <>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>{t("stats_views", "Visitas")}</div><div style={styles.summaryValue}>{totals.views}</div></div>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>WhatsApp</div><div style={styles.summaryValue}>{totals.whatsapp}</div></div>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>{t("stats_mail", "Mail")}</div><div style={styles.summaryValue}>{totals.mail}</div></div>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>{t("stats_chats", "Chats")}</div><div style={styles.summaryValue}>{totals.chat}</div></div>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>{t("stats_premium", "Premium")}</div><div style={styles.summaryValue}>{totals.premium}</div></div>
              <div style={styles.summaryCard}><div style={styles.summaryLabel}>{t("stats_featured", "Destacados")}</div><div style={styles.summaryValue}>{totals.featured}</div></div>
            </div>
            {!items.length ? (
              <div style={styles.emptyBox}>
                <strong>{t('my_ads_empty', 'Todavía no tenés anuncios publicados en esta cuenta.')}</strong>
                <div style={styles.actions}>
                  <a href="/publicar" style={styles.link}>{t('my_ads_publish_first', 'Publicar mi primer anuncio')}</a>
                  <a href="/buscar" style={styles.linkAlt}>{t('my_ads_browse', 'Explorar anuncios')}</a>
                </div>
              </div>
            ) : null}
            <div style={styles.grid}>
              {items.map((item) => (
                <div key={item.id} style={styles.card}>
                  <img src={item.images?.[0] || "https://picsum.photos/seed/fallback/600/400"} alt={item.title} style={styles.img(getImagePresentation(item))} />
                  <div style={styles.body}>
                    <div style={styles.badges}>
                      {item.is_premium ? <span style={styles.premiumBadge}>{t("card_premium", "Premium")}</span> : <span style={styles.normalBadge}>{t("status_normal", "Normal")}</span>}
                      {item.highlighted ? <span style={styles.featuredBadge}>{t("stats_featured", "Destacados")}</span> : null}
                      {item.verified ? <span style={styles.verifiedBadge}>{t("status_verified", "Verificado")}</span> : null}
                    </div>
                    <h3 style={styles.h3}>{item.title}</h3>
                    <div style={styles.meta}>{item.city}, {item.country}</div>
                    <div style={styles.price}>{item.currency} {item.price}</div>
                    <div style={styles.metricsRow}>
                      <span>{item.views || 0} {t("card_views", "visitas")}</span>
                      <span>{item.clicks_whatsapp || 0} WA</span>
                      <span>{item.clicks_mail || 0} Mail</span>
                      <span>{item.chat_messages || 0} {t("stats_chats", "chats")}</span>
                    </div>
                    <div style={styles.actions}>
                      <Link href={getListingDetailHref(item)} style={styles.link}>{t("action_view", "Ver")}</Link>
                      <Link href={getListingEditHref(item)} style={styles.linkAlt}>{t("action_edit", "Editar")}</Link>
                      <Link href={`/publicar?republicar=${encodeURIComponent(item.id)}`} style={styles.linkAlt}>{t("action_republish", "Republicar")}</Link>
                      <button type="button" onClick={() => removeItem(item.id)} style={styles.danger}>{t("action_delete", "Eliminar")}</button>
                    </div>
                    {!item.is_premium ? (
                      <button type="button" onClick={() => activatePremium(item)} style={styles.premiumButton} disabled={loadingPremiumId === item.id}>
                        {loadingPremiumId === item.id ? t('premium_connecting', 'Conectando…') : t('premium_activate', 'Activar Premium con Mercado Pago')}
                      </button>
                    ) : (
                      <div style={styles.premiumBox}>{t('premium_active', 'Premium activo')} · {t('premium_plan_label', 'plan')} {item.premium_plan || t('stats_featured', 'Destacado')}</div>
                    )}
                    {item.is_premium && !item.highlighted ? (
                      <button type="button" onClick={() => syncFeatured(item)} style={styles.featureButton} disabled={featureActionId === item.id}>
                        {featureActionId === item.id ? t('premium_syncing', 'Sincronizando…') : t('premium_mark_real', 'Marcar como destacado real')}
                      </button>
                    ) : null}
                    {item.highlighted ? <div style={styles.featuredBox}>{t("featured_active", "Destacado activo")} · {t("featured_active_desc", "arriba en búsquedas y secciones premium")}</div> : null}
                    <a href={`/publicidad/panel?listingId=${item.id}&title=${encodeURIComponent(item.title || '')}`} style={styles.manageAdsLink}>{t("ads_route_listing", "Dirigir en publicidad")}</a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1200,margin:"0 auto",padding:"28px 16px"},
  title:{fontSize:42,margin:"0 0 18px 0"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"hidden",boxShadow:"0 10px 30px rgba(15,23,42,.05)"},
  img:(presentation)=>({width:"100%",height:180,objectFit:presentation?.fit || "cover",objectPosition:presentation?.position || "center center",background:presentation?.background || "#eef2f7",display:"block"}),
  body:{padding:14},
  badges:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8},
  premiumBadge:{display:"inline-block",background:"#7c3aed",color:"#fff",padding:"6px 10px",borderRadius:999,fontSize:12,fontWeight:800},
  normalBadge:{display:"inline-block",background:"#e5e7eb",color:"#111827",padding:"6px 10px",borderRadius:999,fontSize:12,fontWeight:800},
  verifiedBadge:{display:"inline-block",background:"#0ea5e9",color:"#fff",padding:"6px 10px",borderRadius:999,fontSize:12,fontWeight:800},
  featuredBadge:{display:"inline-block",background:"#111827",color:"#fff",padding:"6px 10px",borderRadius:999,fontSize:12,fontWeight:800},
  h3:{margin:"0 0 8px 0"},
  meta:{color:"#6b7280",marginBottom:6},
  price:{fontWeight:800,fontSize:22,marginBottom:8},
  metricsRow:{display:"flex",gap:10,flexWrap:"wrap",color:"#475569",fontWeight:700,fontSize:14,marginBottom:10},
  actions:{display:"flex",gap:10,flexWrap:"wrap",marginTop:10},
  link:{display:"inline-block",textDecoration:"none",background:"#1d4ed8",color:"#fff",padding:"10px 12px",borderRadius:10,fontWeight:700,border:"none"},
  linkAlt:{display:"inline-block",textDecoration:"none",background:"#fff",color:"#111827",padding:"10px 12px",borderRadius:10,fontWeight:700,border:"1px solid #d1d5db"},
  danger:{background:"#dc2626",color:"#fff",border:"none",padding:"10px 12px",borderRadius:10,fontWeight:700,cursor:"pointer"},
  premiumButton:{marginTop:12,width:"100%",background:"#f59e0b",color:"#fff",border:"none",padding:"12px 14px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  premiumBox:{marginTop:12,background:"#fff7ed",border:"1px solid #fdba74",color:"#9a3412",padding:"12px 14px",borderRadius:12,fontWeight:800},
  featureButton:{marginTop:10,width:"100%",background:"#111827",color:"#fff",border:"none",padding:"12px 14px",borderRadius:12,fontWeight:800,cursor:"pointer"},
  featuredBox:{marginTop:10,background:"#ecfeff",border:"1px solid #a5f3fc",color:"#155e75",padding:"12px 14px",borderRadius:12,fontWeight:800},
  manageAdsLink:{display:"inline-block",marginTop:10,textDecoration:"none",color:"#2563eb",fontWeight:800},
  empty:{padding:"20px 0",color:"#6b7280",fontWeight:700},
  actions:{display:"flex",gap:10,flexWrap:"wrap",marginTop:10},
  emptyBox:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:18,padding:20,display:"grid",gap:12},
  summaryGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20},
  summaryCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:16,boxShadow:"0 10px 24px rgba(15,23,42,.04)"},
  summaryLabel:{fontSize:13,color:"#64748b",fontWeight:700},
  summaryValue:{fontSize:28,fontWeight:900,color:"#0f172a",marginTop:6},
};
