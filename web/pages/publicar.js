import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useLang } from "../context/LanguageContext";
import { CATEGORIES, SUBTYPES, CURRENCIES, COUNTRIES } from "../data/options";
import { LANGUAGES } from "../data/globalConfig";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { isOwnerEmail } from "../lib/owner";
import { createSeoSlug } from "../lib/formatters";
import PropertyFields from "../components/PropertyFields";
import VehicleSpecsFields from "../components/VehicleSpecsFields";
import TourismFields from "../components/TourismFields";
import MultiImageUploader from "../components/MultiImageUploader";
import SmartLocationPicker from "../components/SmartLocationPicker";
import LocationMap from "../components/LocationMap";
import FooterBlueBar from "../components/FooterBlueBar";
import GlobalHeader from "../components/GlobalHeader";
import AdSlot from "../components/AdSlot";

const CATEGORY_LABEL_KEYS = {
  Propiedad: "cat_properties",
  Auto: "cat_cars",
  "Carros de golf / seguridad": "cat_golf_security",
  Moto: "cat_motorcycles",
  "Camión": "cat_trucks",
  "Náutica": "cat_nautical",
  Maquinaria: "cat_machinery",
  Servicio: "cat_services",
  Turismo: "cat_tourism",
};

function localizedCategoryLabel(category, t) {
  return CATEGORY_LABEL_KEYS[category] ? t(CATEGORY_LABEL_KEYS[category], category) : category;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error) {
  const direct = Number(error?.status || error?.statusCode);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = String(error?.message || '').match(/\b(408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : 0;
}

function isRetryableError(error) {
  const status = getErrorStatus(error);
  return [408, 429, 500, 502, 503, 504].includes(status) || /network|timeout|fetch/i.test(String(error?.message || ''));
}

async function withTransientRetry(operation, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableError(error)) throw error;
      await sleep(500 * attempt);
    }
  }
  throw lastError;
}

async function fetchJsonWithRetry(url, options = {}, attempts = 3) {
  return withTransientRetry(async () => {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }
    if (!res.ok) {
      const error = new Error(data?.error || `HTTP ${res.status} error`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return { res, data };
  }, attempts);
}

function createClientRequestId(userId) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${userId || 'user'}:${Date.now()}:${random}`;
}

export default function Publicar() {
  const router = useRouter();
  const initial = {
    title:"", category:"Propiedad", subtype:"Casa", listing_type:"venta",
    price:"", currency:"USD", country:"Argentina", language:"es",
    city:"", state:"", zone:"", address:"", lat:"", lng:"",
    description:"", phone:"", contact_email:"",
    rooms:"", bathrooms:"", surface:"",
    pool:false, garage:false, furnished:false, patio:false,
    is_premium:false, premium_plan:"Destacado 7 días",
    specs_json:{}
  };
  const [formData, setFormData] = useState(initial);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [ownerMode, setOwnerMode] = useState(false);
  const [paymentPrompt, setPaymentPrompt] = useState(null);
  const subtypeOptions = useMemo(() => SUBTYPES?.[formData.category] || [], [formData.category]);
  const { t, language } = useLang();
  const requiredMissing = useMemo(() => {
    const missing = [];
    if (!formData.title.trim()) missing.push(t("publish_title_placeholder", "Titulo"));
    if (!formData.price) missing.push(t("publish_price_placeholder", "Precio"));
    if (!formData.city.trim()) missing.push(t("publish_city", "Ciudad"));
    if (!formData.country.trim()) missing.push(t("filter_country", "Pais"));
    if (!formData.phone.trim()) missing.push(t("publish_phone", "WhatsApp"));
    if (!formData.contact_email.trim()) missing.push(t("publish_contact_email", "Email de contacto"));
    if (!formData.description.trim()) missing.push(t("publish_description", "Descripcion"));
    if (!images.length) missing.push(t("images_label", "Fotos multiples"));
    return missing;
  }, [formData, images.length, t]);
  const completion = Math.max(12, Math.round(((8 - requiredMissing.length) / 8) * 100));

  useEffect(() => {
    setFormData((prev) => ({ ...prev, language: language || prev.language || "es" }));
  }, [language]);

  useEffect(() => {
    let mounted = true;
    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const currentUser = data?.user || null;
      setUser(currentUser);
      setOwnerMode(isOwnerEmail(currentUser?.email));
      setAuthChecked(true);
      if (!currentUser) router.replace("/login?next=/publicar");
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      setOwnerMode(isOwnerEmail(currentUser?.email));
      setAuthChecked(true);
      if (!currentUser) router.replace("/login?next=/publicar");
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  async function uploadImages() {
    const urls = [];
    for (const item of images) {
      const file = item.file;
      if (!file) continue;
      const ext = file.name.split(".").pop();
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `public/${safeName}`;
      await withTransientRetry(async () => {
        const { error } = await supabaseBrowser.storage.from("listings").upload(path, file, { cacheControl: "3600", upsert: true });
        if (error) throw error;
      });
      const { data } = supabaseBrowser.storage.from("listings").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  function askPaidPlan(data = {}) {
    setPaymentPrompt({
      upgradeUrl: data?.upgradeUrl || "/planes?limit=listings",
      maxListings: data?.limits?.maxListings || 3,
    });
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: auth } = await supabaseBrowser.auth.getUser();
      const nextUser = auth.user;
      if (!nextUser) throw new Error(t("publish_error_login", "Tenés que iniciar sesión para publicar."));
      if (requiredMissing.length) throw new Error(`${t("publish_missing_fields", "Completa los campos pendientes")}: ${requiredMissing.join(", ")}`);
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      try {
        const { data: limitData } = await fetchJsonWithRetry("/api/secure/company/limits", { headers }, 2);
        if (limitData?.canCreateListing === false) {
          askPaidPlan(limitData);
          return;
        }
      } catch {
        // El backend vuelve a validar el cupo al guardar. Si esta consulta falla transitoriamente, seguimos.
      }

      const uploaded = await uploadImages();
      const seoSlug = createSeoSlug(`${formData.category}-${formData.title}-${formData.city}-${formData.country}`);
      const clientRequestId = createClientRequestId(nextUser.id);
      let data;
      try {
        ({ data } = await fetchJsonWithRetry("/api/secure/listings", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...formData,
            images: uploaded,
            seo_slug: seoSlug,
            client_request_id: clientRequestId,
            specs_json: { ...(formData.specs_json || {}), client_request_id: clientRequestId },
          })
        }));
      } catch (error) {
        if (error.status === 402 && error.data?.requiresPayment) {
          askPaidPlan(error.data);
          return;
        }
        throw error;
      }
      if (data?.requiresPayment) {
        askPaidPlan(data);
        return;
      }
      setImages([]);
      setFormData(initial);
      alert(t("publish_success", "Anuncio publicado correctamente"));
      window.location.replace("/mis-anuncios");
    } catch (err) {
      alert(err.message || "Error publicando");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <GlobalHeader />
      {paymentPrompt ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="paid-plan-title">
          <div style={styles.modal}>
            <strong id="paid-plan-title" style={styles.modalTitle}>Ya usaste tus {paymentPrompt.maxListings} publicaciones gratis</strong>
            <p style={styles.modalText}>Queres seguir con la publicacion? Te redireccionaremos a planes de pago.</p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.modalSecondary}
                onClick={() => setPaymentPrompt(null)}
              >
                No
              </button>
              <button
                type="button"
                style={styles.modalPrimary}
                onClick={() => {
                  window.location.href = paymentPrompt.upgradeUrl || "/planes?limit=listings";
                }}
              >
                Si
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="cc-publish-wrap" style={styles.wrap}>
        <aside className="cc-publish-side cc-publish-left" style={styles.sideCol}>
          <AdSlot slot="search_sidebar" page="publicar_left" title={t("ads_sidebar_title", "Publicidad lateral")} compact />
          <AdSlot slot="listing_inline" page="publicar_left_bottom" title={t("ads_premium_space", "Espacio premium")} compact />
        </aside>

        <main style={styles.mainCol}>
          <h1 style={styles.title}>{t("publish_title", "Publicar anuncio")}</h1>
          <p style={styles.subtitle}>{t("publish_subtitle", "Ahora con ubicación inteligente, venta/alquiler y ficha técnica.")}</p>
          <section style={styles.proPanel}>
            <div style={styles.stepHeader}>
              {[t("publish_step_basic", "Datos"), t("publish_step_location", "Ubicacion"), t("publish_step_media", "Fotos"), t("publish_step_preview", "Preview")].map((label, index) => (
                <span key={label} style={{ ...styles.stepPill, ...(completion >= (index + 1) * 25 ? styles.stepPillDone : null) }}>{label}</span>
              ))}
            </div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${completion}%` }} /></div>
            <div style={styles.proGrid}>
              <div style={styles.validationBox}>
                <strong>{t("publish_readiness", "Estado de publicacion")}</strong>
                {requiredMissing.length ? (
                  <div style={styles.missingList}>{t("publish_missing_hint", "Faltan")}: {requiredMissing.join(", ")}</div>
                ) : (
                  <div style={styles.readyText}>{t("publish_ready", "Listo para publicar con ficha completa.")}</div>
                )}
              </div>
              <div style={styles.previewCard}>
                <div style={styles.previewImage}>{images[0]?.url ? <img src={images[0].url} alt={formData.title || "preview"} style={styles.previewImg} /> : t("publish_preview_image", "Preview")}</div>
                <div style={styles.previewBody}>
                  <strong>{formData.title || t("card_no_title", "Sin titulo")}</strong>
                  <span>{formData.currency} {formData.price || "--"} · {localizedCategoryLabel(formData.category, t)}</span>
                  <span>{[formData.city, formData.state, formData.country].filter(Boolean).join(", ") || t("card_location_unknown", "Ubicacion no informada")}</span>
                </div>
              </div>
            </div>
          </section>
          <section className="cc-publish-inline-ads" style={styles.inlineAds}>
            <AdSlot slot="listing_inline" page="publicar_inline_primary" title={t("ads_premium_space", "Espacio premium")} compact />
            <AdSlot slot="home_top" page="publicar_inline_secondary" title={t("ads_featured_banner", "Banner destacado")} compact />
          </section>
          {!authChecked ? <div style={styles.infoBox}>{t("publish_checking", "Verificando sesión…")}</div> : null}
          {authChecked && !user ? (
            <div style={styles.infoBox}>
              <strong>{t("publish_need_login", "Necesitás iniciar sesión para publicar.")}</strong>
              <div style={styles.infoActions}>
                <a href="/dashboard" style={styles.secondaryLink}>{t("publish_go_login", "Ir a ingresar / crear cuenta")}</a>
                <a href="/" style={styles.secondaryLink}>{t("my_ads_back_home", "Volver al inicio")}</a>
              </div>
            </div>
          ) : null}
          <form onSubmit={submit} style={{ ...styles.form, opacity: user ? 1 : 0.55, pointerEvents: user ? "auto" : "none" }} autoComplete="off">
            <input style={styles.input} placeholder={t("publish_title_placeholder", "Título")} value={formData.title} onChange={(e)=>setFormData((p)=>({ ...p, title:e.target.value }))} required />
            <div style={styles.row}>
              <select style={styles.input} value={formData.category} onChange={(e)=>{
                const category = e.target.value;
                setFormData((p)=>({
                  ...p,
                  category,
                  subtype:(SUBTYPES?.[category] || [])[0] || "",
                  listing_type: category === "Turismo" ? "temporal" : p.listing_type,
                  specs_json: category === "Turismo" ? { tourism_type: "stay", instant_book: false } : {}
                }));
              }}>
                {CATEGORIES.map((c)=><option key={c} value={c}>{localizedCategoryLabel(c, t)}</option>)}
              </select>
              <select style={styles.input} value={formData.subtype} onChange={(e)=>setFormData((p)=>({ ...p, subtype:e.target.value }))}>
                {subtypeOptions.map((s)=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={styles.row}>
              <select style={styles.input} value={formData.listing_type} onChange={(e)=>setFormData((p)=>({ ...p, listing_type:e.target.value }))}>
                <option value="venta">{t("search_sale", "Venta")}</option>
                <option value="alquiler">{t("search_rent", "Alquiler")}</option>
                <option value="temporal">{t("search_temporary", "Alquiler temporal")}</option>
              </select>
              <select style={styles.input} value={formData.currency} onChange={(e)=>setFormData((p)=>({ ...p, currency:e.target.value }))}>
                {CURRENCIES.map((c)=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input style={styles.input} placeholder={t("publish_price_placeholder", "Precio")} value={formData.price} onChange={(e)=>setFormData((p)=>({ ...p, price:e.target.value }))} required />
            <div style={styles.row}>
              <select style={styles.input} value={formData.country} onChange={(e)=>setFormData((p)=>({ ...p, country:e.target.value }))}>
                {COUNTRIES.map((c)=><option key={c}>{c}</option>)}
              </select>
              <select style={styles.input} value={formData.language} onChange={(e)=>setFormData((p)=>({ ...p, language:e.target.value }))}>
                {LANGUAGES.map((l)=><option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <SmartLocationPicker setFormData={setFormData} />
            <div style={styles.row}>
              <input style={styles.input} placeholder={t("publish_address", "Dirección")} value={formData.address} onChange={(e)=>setFormData((p)=>({ ...p, address:e.target.value }))} />
              <input style={styles.input} placeholder={t("publish_zone", "Zona / barrio")} value={formData.zone} onChange={(e)=>setFormData((p)=>({ ...p, zone:e.target.value }))} />
            </div>
            <div style={styles.row}>
              <input style={styles.input} placeholder={t("publish_city", "Ciudad")} value={formData.city} onChange={(e)=>setFormData((p)=>({ ...p, city:e.target.value }))} required />
              <input style={styles.input} placeholder={t("publish_state", "Provincia / estado")} value={formData.state} onChange={(e)=>setFormData((p)=>({ ...p, state:e.target.value }))} />
            </div>
            <div style={styles.row}>
              <input style={styles.input} placeholder={t("publish_phone", "WhatsApp")} value={formData.phone} onChange={(e)=>setFormData((p)=>({ ...p, phone:e.target.value }))} required />
              <input type="email" style={styles.input} placeholder={t("publish_contact_email", "Email de contacto")} value={formData.contact_email} onChange={(e)=>setFormData((p)=>({ ...p, contact_email:e.target.value }))} required />
            </div>
            <textarea style={styles.textarea} placeholder={t("publish_description", "Descripción")} value={formData.description} onChange={(e)=>setFormData((p)=>({ ...p, description:e.target.value }))} required />
            {formData.category === "Propiedad" ? <PropertyFields formData={formData} setFormData={setFormData} /> : null}
            {formData.category === "Turismo" ? <TourismFields formData={formData} setFormData={setFormData} /> : null}
            <VehicleSpecsFields category={formData.category} formData={formData} setFormData={setFormData} />
            <div style={styles.premiumBox}>
              <strong>{t("publish_premium", "Premium / pagos")}</strong>
              {ownerMode ? <div style={styles.ownerHint}>Modo dueño gratis activo para esta cuenta. Podés destacar sin pasar por Mercado Pago y este mensaje solo lo ves vos.</div> : null}
              <div style={styles.row}>
                <label style={styles.check}><input type="checkbox" checked={!!formData.is_premium} onChange={(e)=>setFormData((p)=>({ ...p, is_premium:e.target.checked }))} /> {t("publish_premium_listing", "Publicación premium")}</label>
                <select style={styles.input} value={formData.premium_plan} onChange={(e)=>setFormData((p)=>({ ...p, premium_plan:e.target.value }))}>
                  <option>{t("premium_plan_basic", "Destacado 7 días")}</option>
                  <option>{t("premium_plan_premium", "Premium 30 días")}</option>
                </select>
              </div>
            </div>
            <MultiImageUploader images={images} setImages={setImages} />
            <LocationMap city={formData.city} country={formData.country} address={formData.address || formData.zone} lat={formData.lat} lng={formData.lng} />
            <button type="submit" style={styles.submit} disabled={submitting}>{submitting ? t("publish_submitting", "Publicando...") : t("publish_submit", "Publicar")}</button>
          </form>
        </main>

        <aside className="cc-publish-side cc-publish-right" style={styles.sideCol}>
          <AdSlot slot="search_sidebar" page="publicar_right" title={t("ads_sidebar_title", "Publicidad lateral")} compact />
          <AdSlot slot="home_top" page="publicar_right_bottom" title={t("ads_featured_banner", "Banner destacado")} compact />
        </aside>
      </div>
      <FooterBlueBar />

      <style jsx>{`
        .cc-publish-side :global(.adslot) {
          width: 100%;
          max-width: 320px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .cc-publish-inline-ads {
          display: none;
        }
        @media (max-width: 1640px) {
          .cc-publish-wrap {
            max-width: 980px !important;
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-publish-side {
            display: none !important;
          }
          .cc-publish-inline-ads {
            display: grid !important;
          }
        }
        @media (max-width: 760px) {
          .cc-publish-wrap {
            padding-bottom: 96px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif"},
  wrap:{maxWidth:1660,boxSizing:'border-box',margin:"0 auto",padding:"26px 16px 48px",display:'grid',gridTemplateColumns:'320px minmax(0,948px) 320px',gap:20,alignItems:'start',justifyContent:'center'},
  sideCol:{display:'grid',gap:16,position:'sticky',top:110,width:'100%',maxWidth:320,minWidth:0,overflow:'hidden'},
  mainCol:{minWidth:0},
  title:{fontSize:42,margin:'0 0 8px 0',color:'#111827'},
  subtitle:{margin:'0 0 20px 0',color:'#64748b',fontSize:18},
  proPanel:{display:'grid',gap:14,background:'#fff',border:'1px solid #e5e7eb',borderRadius:22,padding:18,boxShadow:'0 14px 28px rgba(15,23,42,.05)',marginBottom:16},
  stepHeader:{display:'flex',gap:8,flexWrap:'wrap'},
  stepPill:{padding:'8px 11px',borderRadius:999,background:'#f1f5f9',color:'#475569',fontSize:12,fontWeight:900},
  stepPillDone:{background:'#dbeafe',color:'#1d4ed8'},
  progressTrack:{height:8,background:'#e5e7eb',borderRadius:999,overflow:'hidden'},
  progressFill:{height:'100%',background:'linear-gradient(90deg,#1d4ed8,#22c55e)',borderRadius:999,transition:'width .2s ease'},
  proGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14,alignItems:'stretch'},
  validationBox:{border:'1px solid #e5e7eb',borderRadius:16,padding:14,background:'#f8fafc',display:'grid',gap:8},
  missingList:{color:'#92400e',fontWeight:800,lineHeight:1.5},
  readyText:{color:'#166534',fontWeight:900},
  previewCard:{border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',background:'#fff',display:'grid',gridTemplateColumns:'110px 1fr',minHeight:110},
  previewImage:{display:'grid',placeItems:'center',background:'#eef2ff',color:'#1d4ed8',fontWeight:900,fontSize:12},
  previewImg:{width:'100%',height:'100%',objectFit:'cover'},
  previewBody:{display:'grid',alignContent:'center',gap:6,padding:12,color:'#334155'},
  inlineAds:{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,margin:'0 0 16px 0'},
  infoBox:{background:'#fff',border:'1px solid #e5e7eb',padding:16,borderRadius:16,marginBottom:16},
  infoActions:{display:'flex',gap:10,flexWrap:'wrap',marginTop:12},
  secondaryLink:{textDecoration:'none',background:'#fff',color:'#111827',padding:'10px 14px',borderRadius:12,border:'1px solid #d1d5db',fontWeight:800},
  form:{display:'grid',gap:14,background:'#fff',border:'1px solid #e5e7eb',borderRadius:24,padding:22,boxShadow:'0 14px 28px rgba(15,23,42,.06)'},
  row:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12},
  input:{width:'100%',padding:'13px 14px',border:'1px solid #d1d5db',borderRadius:14,background:'#fff'},
  textarea:{width:'100%',minHeight:140,padding:'13px 14px',border:'1px solid #d1d5db',borderRadius:14,background:'#fff',resize:'vertical'},
  premiumBox:{display:'grid',gap:10,padding:18,border:'1px solid #e5e7eb',borderRadius:18,background:'#f8fafc'},
  ownerHint:{color:'#1d4ed8',fontWeight:800},
  check:{display:'flex',alignItems:'center',gap:8,fontWeight:800},
  submit:{background:'linear-gradient(135deg,#0f172a,#1d4ed8)',color:'#fff',border:'none',borderRadius:14,padding:'14px 18px',fontWeight:900,cursor:'pointer'},
  modalOverlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9999,display:'grid',placeItems:'center',padding:20},
  modal:{width:'min(460px,100%)',background:'#fff',borderRadius:18,border:'1px solid #e5e7eb',boxShadow:'0 24px 80px rgba(15,23,42,.28)',padding:22,display:'grid',gap:14},
  modalTitle:{fontSize:20,color:'#111827',lineHeight:1.25},
  modalText:{margin:0,color:'#475569',fontSize:16,lineHeight:1.45},
  modalActions:{display:'flex',gap:10,justifyContent:'flex-end',flexWrap:'wrap'},
  modalSecondary:{border:'1px solid #cbd5e1',background:'#fff',color:'#111827',borderRadius:12,padding:'11px 18px',fontWeight:900,cursor:'pointer'},
  modalPrimary:{border:'none',background:'linear-gradient(135deg,#0f172a,#1d4ed8)',color:'#fff',borderRadius:12,padding:'11px 20px',fontWeight:900,cursor:'pointer'}
};
