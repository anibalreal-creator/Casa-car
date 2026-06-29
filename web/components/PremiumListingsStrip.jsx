import { useEffect, useMemo, useState } from "react";
import { getImagePresentation } from "../lib/imagePresentation";
import { categoryLabel } from "../lib/category";
import { useLang } from "../context/LanguageContext";
import { fetchJsonCached } from "../lib/clientFetchCache";
import { getListingDetailHref } from "../lib/listingRoutes";
import { getCommercialStatus, isExampleListing } from "../lib/listingBadges";

const FALLBACK_CARDS = {
  es: [
    { id: "fallback-premium-home-1", title: "Departamento premium con vista abierta", category: "Propiedad", subtype: "Departamento", listing_type: "venta", price: 165000, currency: "USD", city: "Buenos Aires", country: "Argentina", is_premium: true, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-2", title: "SUV full equipada lista para transferir", category: "Auto", subtype: "SUV", listing_type: "venta", price: 28900, currency: "USD", city: "Miami", country: "Estados Unidos", is_premium: true, images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-3", title: "Lancha deportiva con motor actualizado", category: "Náutica", subtype: "Lancha", listing_type: "venta", price: 41500, currency: "USD", city: "Cancún", country: "México", is_premium: true, images: ["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1400&auto=format&fit=crop"] },
  ],
  en: [
    { id: "fallback-premium-home-1", title: "Premium apartment with open view", category: "Property", subtype: "Apartment", listing_type: "sale", price: 165000, currency: "USD", city: "Buenos Aires", country: "Argentina", is_premium: true, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-2", title: "Fully equipped SUV ready to transfer", category: "Car", subtype: "SUV", listing_type: "sale", price: 28900, currency: "USD", city: "Miami", country: "United States", is_premium: true, images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-3", title: "Sport boat with updated engine", category: "Nautical", subtype: "Boat", listing_type: "sale", price: 41500, currency: "USD", city: "Cancún", country: "Mexico", is_premium: true, images: ["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1400&auto=format&fit=crop"] },
  ],
  pt: [
    { id: "fallback-premium-home-1", title: "Apartamento premium com vista aberta", category: "Imóvel", subtype: "Apartamento", listing_type: "venda", price: 165000, currency: "USD", city: "Buenos Aires", country: "Argentina", is_premium: true, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-2", title: "SUV completa pronta para transferir", category: "Auto", subtype: "SUV", listing_type: "venda", price: 28900, currency: "USD", city: "Miami", country: "Estados Unidos", is_premium: true, images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-3", title: "Lancha esportiva com motor atualizado", category: "Náutica", subtype: "Lancha", listing_type: "venda", price: 41500, currency: "USD", city: "Cancún", country: "México", is_premium: true, images: ["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1400&auto=format&fit=crop"] },
  ],
  zh: [
    { id: "fallback-premium-home-1", title: "开放景观高端公寓", category: "房产", subtype: "公寓", listing_type: "sale", price: 165000, currency: "USD", city: "布宜诺斯艾利斯", country: "阿根廷", is_premium: true, images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-2", title: "高配 SUV 可立即过户", category: "汽车", subtype: "SUV", listing_type: "sale", price: 28900, currency: "USD", city: "迈阿密", country: "美国", is_premium: true, images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop"] },
    { id: "fallback-premium-home-3", title: "升级发动机运动快艇", category: "船艇", subtype: "快艇", listing_type: "sale", price: 41500, currency: "USD", city: "坎昆", country: "墨西哥", is_premium: true, images: ["https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1400&auto=format&fit=crop"] },
  ],
};

function formatPrice(item, t) {
  if (item?.price_on_request) return t('card_price_on_request', 'Consultar precio');
  return `${item?.currency || "USD"} ${Number(item?.price || 0).toLocaleString("es-AR")}`;
}

function getHref(item) {
  if (item?.id && !String(item.id).startsWith("fallback-")) return getListingDetailHref(item);
  return "/buscar";
}

export default function PremiumListingsStrip() {
  const { t, language } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchJsonCached("/api/listings?page=1&pageSize=12&sort=recent", { ttlMs: 30000 });
        const rows = Array.isArray(data) ? data : data?.items || [];
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const cards = useMemo(() => {
    const premium = items
      .filter((item) => item?.status !== "paused")
      .filter((item) => item?.is_premium || item?.highlighted)
      .sort((a, b) => Number(b?.views || 0) - Number(a?.views || 0))
      .slice(0, 3);

    const fallback = (FALLBACK_CARDS[language] || FALLBACK_CARDS.es).map((item) => ({
      ...item,
      is_example: true,
      specs_json: { ...(item.specs_json || {}), is_example: true },
    }));
    return premium.length ? premium : fallback;
  }, [items, language]);

  return (
    <section style={styles.wrap}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.kicker}>{t('premium_kicker', 'PREMIUM')}</div>
          <h2 style={styles.title}>{t('premium_title', 'Sección de avisos premium')}</h2>
          <p style={styles.subtitle}>{t('premium_subtitle', 'Publicaciones destacadas con acceso directo al detalle para generar más consultas y más facturación.')}</p>
        </div>
        <a href="/buscar" style={styles.secondaryCta}>{t('premium_view_all', 'Ver todos los destacados')}</a>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => {
          const image = card?.images?.[0] || card?.image || "https://picsum.photos/seed/casacar-premium/900/600";
          const presentation = getImagePresentation(card);
          const href = getHref(card);
          const commercialStatus = getCommercialStatus(card);
          const exampleListing = isExampleListing(card);
          return (
            <a key={String(card.id)} href={href} style={styles.cardLink}>
              <article style={styles.card}>
                <div style={styles.imageWrap}>
                  <img src={image} alt={card?.title || t('premium_card_alt', 'premium')} style={styles.image(presentation)} />
                  <span style={styles.badge}>{t('premium_badge', 'Destacado premium')}</span>
                  {exampleListing ? <span style={styles.exampleBadge}>Ejemplo</span> : null}
                  {commercialStatus ? (
                    <>
                      <span style={{ ...styles.statusRibbon, background: commercialStatus.color }}>{commercialStatus.label}</span>
                      <span style={styles.statusWatermark}>{commercialStatus.label}</span>
                    </>
                  ) : null}
                </div>
                <div style={styles.body}>
                  <div style={styles.category}>{categoryLabel(card?.category) || card?.category || t('card_general', 'General')}</div>
                  <h3 style={styles.cardTitle}>{card?.title || t('premium_card_title', 'Publicación premium')}</h3>
                  <div style={styles.location}>{[card?.city, card?.country].filter(Boolean).join(', ')}</div>
                  <div style={styles.bottomRow}>
                    <div style={styles.price}>{formatPrice(card, t)}</div>
                    <span style={styles.cta}>{loading ? t('loading', 'Cargando…') : t('view_listing', 'Ver publicación')}</span>
                  </div>
                </div>
              </article>
            </a>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  wrap:{marginTop:32,background:"linear-gradient(135deg,#111827 0%,#1d4ed8 100%)",borderRadius:30,padding:24,color:"#fff",boxShadow:"0 20px 44px rgba(15,23,42,.16)"},
  topRow:{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,flexWrap:"wrap",marginBottom:18},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:".08em",color:"rgba(255,255,255,.78)",marginBottom:8},
  title:{fontSize:32,fontWeight:900,margin:"0 0 8px"}, subtitle:{margin:0,color:"rgba(255,255,255,.82)",maxWidth:760,lineHeight:1.5},
  secondaryCta:{textDecoration:"none",background:"rgba(255,255,255,.12)",color:"#fff",padding:"12px 16px",borderRadius:14,fontWeight:900,border:"1px solid rgba(255,255,255,.18)"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}, cardLink:{textDecoration:"none",color:"inherit",display:"block"},
  card:{background:"rgba(255,255,255,.10)",border:"1px solid rgba(255,255,255,.18)",borderRadius:24,overflow:"hidden",display:"grid",height:"100%",transition:"transform .18s ease, box-shadow .18s ease",boxShadow:"0 10px 26px rgba(15,23,42,.12)"},
  imageWrap:{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.06)",minHeight:240},
  image:(presentation)=>({width:"100%",height:240,objectFit:presentation?.fit || "cover",objectPosition:presentation?.position || "center center",display:"block",background:presentation?.background || "#e5eefb"}),
  badge:{position:"absolute",top:14,left:14,display:"inline-block",padding:"7px 11px",borderRadius:999,background:"#f59e0b",color:"#111827",fontWeight:900,fontSize:12},
  exampleBadge:{position:"absolute",top:14,right:14,zIndex:4,display:"inline-block",padding:"7px 11px",borderRadius:999,background:"#fef3c7",color:"#92400e",fontWeight:900,fontSize:12,border:"1px solid rgba(146,64,14,.18)"},
  statusRibbon:{position:"absolute",top:20,right:-46,zIndex:5,width:170,padding:"9px 0",color:"#fff",textAlign:"center",textTransform:"uppercase",fontWeight:900,fontSize:12,letterSpacing:".08em",transform:"rotate(35deg)",boxShadow:"0 8px 18px rgba(15,23,42,.22)"},
  statusWatermark:{position:"absolute",inset:0,zIndex:2,display:"grid",placeItems:"center",color:"rgba(255,255,255,.36)",fontSize:44,fontWeight:900,textTransform:"uppercase",letterSpacing:".06em",transform:"rotate(-14deg)",textShadow:"0 3px 16px rgba(15,23,42,.32)",pointerEvents:"none"},
  body:{padding:18,display:"grid",gap:10,alignContent:"space-between"}, category:{color:"rgba(255,255,255,.78)",fontWeight:800,fontSize:13},
  cardTitle:{fontSize:24,lineHeight:1.1,margin:0}, location:{color:"rgba(255,255,255,.78)",fontWeight:700},
  bottomRow:{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap",marginTop:6}, price:{fontSize:28,fontWeight:900},
  cta:{display:"inline-flex",padding:"10px 12px",borderRadius:12,background:"#fff",color:"#111827",fontWeight:900}
};
