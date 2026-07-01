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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',').pop() : value);
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

function normalizeListingImages(images) {
  if (Array.isArray(images)) return images.filter(Boolean).map(String);
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return images ? [images] : [];
    }
  }
  return [];
}

function imageUrlsToPreviewItems(urls = []) {
  return normalizeListingImages(urls).map((url, index) => ({
    name: `republicar-${index}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    existing: true,
  }));
}

function cleanSpecsForRepublish(specs = {}) {
  const next = { ...(specs || {}) };
  delete next.client_request_id;
  return next;
}

function buildRepublishForm(item = {}, fallback = {}, fallbackEmail = '') {
  const specs = item.specs_json || {};
  return {
    ...fallback,
    title: item.title || '',
    category: item.category || fallback.category || 'Propiedad',
    subtype: item.subtype || fallback.subtype || 'Casa',
    listing_type: item.listing_type || fallback.listing_type || 'venta',
    price: item.price ?? '',
    currency: item.currency || fallback.currency || 'USD',
    country: item.country || fallback.country || 'Argentina',
    language: item.language || fallback.language || 'es',
    city: item.city || '',
    state: item.state || '',
    zone: item.zone || '',
    address: item.address || '',
    lat: item.lat ?? '',
    lng: item.lng ?? '',
    description: item.description || '',
    phone: item.phone || '',
    contact_email: item.contact_email || specs.contact_email || fallbackEmail || '',
    rooms: item.rooms ?? '',
    bathrooms: item.bathrooms ?? '',
    surface: item.surface ?? '',
    total_surface: item.total_surface ?? specs.total_surface ?? '',
    garages_count: item.garages_count ?? specs.garages_count ?? '',
    antiquity: item.antiquity ?? specs.antiquity ?? '',
    floor: item.floor ?? specs.floor ?? '',
    toilets: item.toilets ?? specs.toilets ?? '',
    orientation: item.orientation || specs.orientation || '',
    construction_status: item.construction_status || specs.construction_status || '',
    advertiser_type: item.advertiser_type || specs.advertiser_type || '',
    commission_share: item.commission_share || specs.commission_share || '',
    pool: Boolean(item.pool || specs.pool),
    garage: Boolean(item.garage || specs.garage),
    furnished: Boolean(item.furnished || specs.furnished),
    patio: Boolean(item.patio || specs.patio),
    balcony: Boolean(item.balcony || specs.balcony),
    terrace: Boolean(item.terrace || specs.terrace),
    sum: Boolean(item.sum || specs.sum),
    security24h: Boolean(item.security24h || specs.security24h),
    pet_friendly: Boolean(item.pet_friendly || specs.pet_friendly),
    professional_use: Boolean(item.professional_use || specs.professional_use),
    availability_status: specs.availability_status || specs.deal_status || specs.commercial_status || '',
    is_premium: false,
    premium_plan: fallback.premium_plan || 'Destacado 7 días',
    specs_json: cleanSpecsForRepublish(specs),
  };
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
    availability_status:"",
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
  const [republishingId, setRepublishingId] = useState("");
  const [republishing, setRepublishing] = useState(false);
  const [republishNotice, setRepublishNotice] = useState("");
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
  const isRepublishing = Boolean(republishingId);
  const publishTitle = isRepublishing ? 'Republicar anuncio' : t("publish_title", "Publicar anuncio");
  const publishSubmitLabel = isRepublishing ? 'Republicar anuncio' : t("publish_submit", "Publicar");
  const publishSuccessMessage = isRepublishing ? 'Anuncio republicado correctamente' : t("publish_success", "Anuncio publicado correctamente");

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
      if (!currentUser) router.replace(`/login?next=${encodeURIComponent(router.asPath || "/publicar")}`);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      setOwnerMode(isOwnerEmail(currentUser?.email));
      setAuthChecked(true);
      if (!currentUser) router.replace(`/login?next=${encodeURIComponent(router.asPath || "/publicar")}`);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    const id = String(router.query.republicar || '').trim();
    setRepublishingId(id);
    if (!id || !user?.id) {
      if (!id) setRepublishNotice('');
      return;
    }

    let cancelled = false;
    async function loadListingForRepublish() {
      setRepublishing(true);
      setRepublishNotice('');
      try {
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        const token = sessionData?.session?.access_token;
        const { data } = await fetchJsonWithRetry(`/api/secure/listings?id=${encodeURIComponent(id)}&mine=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }, 2);
        if (cancelled) return;
        if (String(data?.user_id || '') !== String(user.id)) {
          throw new Error('No se puede republicar un anuncio de otra cuenta.');
        }
        setFormData(buildRepublishForm(data, initial, user.email || ''));
        setImages(imageUrlsToPreviewItems(data.images));
        setRepublishNotice('Datos copiados. Revisalos y publicalo de nuevo cuando quieras.');
      } catch (error) {
        if (!cancelled) setRepublishNotice(error.message || 'No se pudo cargar el anuncio para republicar.');
      } finally {
        if (!cancelled) setRepublishing(false);
      }
    }

    loadListingForRepublish();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.republicar, user?.id, user?.email]);

  async function uploadImages(userId, token) {
    const urls = [];
    for (const item of images) {
      const file = item.file;
      if (!file) {
        if (item.url) urls.push(item.url);
        continue;
      }
      const dataBase64 = await fileToBase64(file);
      const { data } = await fetchJsonWithRetry("/api/secure/listing-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64,
        }),
      }, 3);
      if (!data?.publicUrl) throw new Error('No se pudo subir la imagen');
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

      const uploaded = await uploadImages(nextUser.id, token);
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
            availability_status: formData.availability_status || "",
            specs_json: { ...(formData.specs_json || {}), client_request_id: clientRequestId, availability_status: formData.availability_status || "", deal_status: formData.availability_status || "", commercial_status: formData.availability_status || "" },
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
      alert(publishSuccessMessage);
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

        <main className="cc-publish-main" style={styles.mainCol}>
          <h1 style={styles.title}>{publishTitle}</h1>
          <p style={styles.subtitle}>{t("publish_subtitle", "Ahora con ubicación inteligente, venta/alquiler y ficha técnica.")}</p>
          {republishNotice ? <div style={styles.republishNotice}>{republishNotice}</div> : null}
          {republishing ? <div style={styles.infoBox}>Cargando datos del anuncio anterior...</div> : null}
          <section className="cc-publish-pro-panel" style={styles.proPanel}>
            <div style={styles.stepHeader}>
              {[t("publish_step_basic", "Datos"), t("publish_step_location", "Ubicacion"), t("publish_step_media", "Fotos"), t("publish_step_preview", "Preview")].map((label, index) => (
                <span key={label} style={{ ...styles.stepPill, ...(completion >= (index + 1) * 25 ? styles.stepPillDone : null) }}>{label}</span>
              ))}
            </div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${completion}%` }} /></div>
            <div className="cc-publish-pro-grid" style={styles.proGrid}>
              <div style={styles.validationBox}>
                <strong>{t("publish_readiness", "Estado de publicacion")}</strong>
                {requiredMissing.length ? (
                  <div style={styles.missingList}>{t("publish_missing_hint", "Faltan")}: {requiredMissing.join(", ")}</div>
                ) : (
                  <div style={styles.readyText}>{t("publish_ready", "Listo para publicar con ficha completa.")}</div>
                )}
              </div>
              <div className="cc-publish-preview-card" style={styles.previewCard}>
                <div className="cc-publish-preview-image" style={styles.previewImage}>{images[0]?.url ? <img src={images[0].url} alt={formData.title || "preview"} style={styles.previewImg} /> : t("publish_preview_image", "Preview")}</div>
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
          <form className="cc-publish-form" onSubmit={submit} style={{ ...styles.form, opacity: user ? 1 : 0.55, pointerEvents: user ? "auto" : "none" }} autoComplete="off">
            <input style={styles.input} placeholder={t("publish_title_placeholder", "Título")} value={formData.title} onChange={(e)=>setFormData((p)=>({ ...p, title:e.target.value }))} required />
            <div className="cc-publish-row" style={styles.row}>
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
            <div className="cc-publish-row" style={styles.row}>
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
            <div style={styles.statusBox}>
              <strong>Faja de estado comercial</strong>
              <select style={styles.input} value={formData.availability_status || ""} onChange={(e)=>setFormData((p)=>({ ...p, availability_status:e.target.value }))}>
                <option value="">Disponible - sin faja</option>
                <option value="vendido">Vendido - mostrar faja</option>
                <option value="alquilado">Alquilado - mostrar faja</option>
                <option value="reservado">Reservado - mostrar faja</option>
              </select>
              <span style={styles.helperText}>Usalo cuando quieras dejar visible que ya se vendio, alquilo o reservo sin borrar el anuncio.</span>
            </div>
            <div className="cc-publish-row" style={styles.row}>
              <select style={styles.input} value={formData.country} onChange={(e)=>setFormData((p)=>({ ...p, country:e.target.value }))}>
                {COUNTRIES.map((c)=><option key={c}>{c}</option>)}
              </select>
              <select style={styles.input} value={formData.language} onChange={(e)=>setFormData((p)=>({ ...p, language:e.target.value }))}>
                {LANGUAGES.map((l)=><option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <SmartLocationPicker setFormData={setFormData} />
            <div className="cc-publish-row" style={styles.row}>
              <input style={styles.input} placeholder={t("publish_address", "Dirección")} value={formData.address} onChange={(e)=>setFormData((p)=>({ ...p, address:e.target.value }))} />
              <input style={styles.input} placeholder={t("publish_zone", "Zona / barrio")} value={formData.zone} onChange={(e)=>setFormData((p)=>({ ...p, zone:e.target.value }))} />
            </div>
            <div className="cc-publish-row" style={styles.row}>
              <input style={styles.input} placeholder={t("publish_city", "Ciudad")} value={formData.city} onChange={(e)=>setFormData((p)=>({ ...p, city:e.target.value }))} required />
              <input style={styles.input} placeholder={t("publish_state", "Provincia / estado")} value={formData.state} onChange={(e)=>setFormData((p)=>({ ...p, state:e.target.value }))} />
            </div>
            <div className="cc-publish-row" style={styles.row}>
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
              <div className="cc-publish-row" style={styles.row}>
                <label style={styles.check}><input type="checkbox" checked={!!formData.is_premium} onChange={(e)=>setFormData((p)=>({ ...p, is_premium:e.target.checked }))} /> {t("publish_premium_listing", "Publicación premium")}</label>
                <select style={styles.input} value={formData.premium_plan} onChange={(e)=>setFormData((p)=>({ ...p, premium_plan:e.target.value }))}>
                  <option>{t("premium_plan_basic", "Destacado 7 días")}</option>
                  <option>{t("premium_plan_premium", "Premium 30 días")}</option>
                </select>
              </div>
            </div>
            <MultiImageUploader images={images} setImages={setImages} />
            <LocationMap city={formData.city} country={formData.country} address={formData.address || formData.zone} lat={formData.lat} lng={formData.lng} />
            <button className="cc-publish-submit" type="submit" style={styles.submit} disabled={submitting || republishing}>{submitting ? t("publish_submitting", "Publicando...") : publishSubmitLabel}</button>
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
        .cc-publish-wrap,
        .cc-publish-main,
        .cc-publish-pro-panel,
        .cc-publish-form,
        .cc-publish-preview-card {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }
        .cc-publish-form :global(input),
        .cc-publish-form :global(select),
        .cc-publish-form :global(textarea),
        .cc-publish-form :global(button),
        .cc-publish-form :global(label),
        .cc-publish-pro-panel :global(input),
        .cc-publish-pro-panel :global(select),
        .cc-publish-pro-panel :global(textarea),
        .cc-publish-pro-panel :global(button),
        .cc-publish-pro-panel :global(label) {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: break-word;
        }
        @media (max-width: 1780px) {
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
            width: 100% !important;
            max-width: 100% !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
            padding-bottom: 96px !important;
            gap: 14px !important;
          }
          .cc-publish-main > h1 {
            font-size: 34px !important;
            line-height: 1.08 !important;
            overflow-wrap: break-word;
          }
          .cc-publish-main > p {
            font-size: 16px !important;
            line-height: 1.4 !important;
          }
          .cc-publish-pro-panel,
          .cc-publish-form {
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .cc-publish-row,
          .cc-publish-pro-grid,
          .cc-publish-inline-ads {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-publish-preview-card {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-publish-preview-image {
            min-height: 110px;
          }
          .cc-publish-submit {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page:{background:"#f5f7fb",minHeight:"100vh",fontFamily:"Arial, sans-serif",overflowX:"hidden"},
  wrap:{maxWidth:1660,boxSizing:'border-box',margin:"0 auto",padding:"26px 16px 48px",display:'grid',gridTemplateColumns:'320px minmax(0,948px) 320px',gap:20,alignItems:'start',justifyContent:'center'},
  sideCol:{display:'grid',gap:16,position:'sticky',top:110,width:'100%',maxWidth:320,minWidth:0,overflow:'hidden'},
  mainCol:{minWidth:0,maxWidth:'100%',overflow:'hidden'},
  title:{fontSize:42,margin:'0 0 8px 0',color:'#111827',overflowWrap:'break-word'},
  subtitle:{margin:'0 0 20px 0',color:'#64748b',fontSize:18},
  proPanel:{display:'grid',gap:14,background:'#fff',border:'1px solid #e5e7eb',borderRadius:22,padding:18,boxShadow:'0 14px 28px rgba(15,23,42,.05)',marginBottom:16,minWidth:0,maxWidth:'100%',overflow:'hidden'},
  stepHeader:{display:'flex',gap:8,flexWrap:'wrap'},
  stepPill:{padding:'8px 11px',borderRadius:999,background:'#f1f5f9',color:'#475569',fontSize:12,fontWeight:900},
  stepPillDone:{background:'#dbeafe',color:'#1d4ed8'},
  progressTrack:{height:8,background:'#e5e7eb',borderRadius:999,overflow:'hidden'},
  progressFill:{height:'100%',background:'linear-gradient(90deg,#1d4ed8,#22c55e)',borderRadius:999,transition:'width .2s ease'},
  proGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:14,alignItems:'stretch',minWidth:0},
  validationBox:{border:'1px solid #e5e7eb',borderRadius:16,padding:14,background:'#f8fafc',display:'grid',gap:8},
  missingList:{color:'#92400e',fontWeight:800,lineHeight:1.5},
  readyText:{color:'#166534',fontWeight:900},
  previewCard:{border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',background:'#fff',display:'grid',gridTemplateColumns:'minmax(90px,110px) minmax(0,1fr)',minHeight:110,minWidth:0},
  previewImage:{display:'grid',placeItems:'center',background:'#eef2ff',color:'#1d4ed8',fontWeight:900,fontSize:12},
  previewImg:{width:'100%',height:'100%',objectFit:'cover'},
  previewBody:{display:'grid',alignContent:'center',gap:6,padding:12,color:'#334155',minWidth:0,overflowWrap:'break-word'},
  inlineAds:{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:14,margin:'0 0 16px 0'},
  infoBox:{background:'#fff',border:'1px solid #e5e7eb',padding:16,borderRadius:16,marginBottom:16},
  republishNotice:{background:'#ecfeff',border:'1px solid #a5f3fc',color:'#155e75',padding:14,borderRadius:16,marginBottom:16,fontWeight:800,lineHeight:1.45},
  infoActions:{display:'flex',gap:10,flexWrap:'wrap',marginTop:12},
  secondaryLink:{textDecoration:'none',background:'#fff',color:'#111827',padding:'10px 14px',borderRadius:12,border:'1px solid #d1d5db',fontWeight:800},
  form:{display:'grid',gap:14,background:'#fff',border:'1px solid #e5e7eb',borderRadius:24,padding:22,boxShadow:'0 14px 28px rgba(15,23,42,.06)',minWidth:0,maxWidth:'100%',overflow:'hidden',boxSizing:'border-box'},
  row:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12,minWidth:0},
  input:{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',padding:'13px 14px',border:'1px solid #d1d5db',borderRadius:14,background:'#fff'},
  textarea:{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',minHeight:140,padding:'13px 14px',border:'1px solid #d1d5db',borderRadius:14,background:'#fff',resize:'vertical'},
  premiumBox:{display:'grid',gap:10,padding:18,border:'1px solid #e5e7eb',borderRadius:18,background:'#f8fafc'},
  statusBox:{display:'grid',gap:10,padding:16,border:'1px solid #dbeafe',borderRadius:16,background:'#eff6ff'},
  helperText:{fontSize:13,color:'#475569',lineHeight:1.45},
  ownerHint:{color:'#1d4ed8',fontWeight:800},
  check:{display:'flex',alignItems:'center',gap:8,fontWeight:800,minWidth:0,overflowWrap:'break-word'},
  submit:{background:'linear-gradient(135deg,#0f172a,#1d4ed8)',color:'#fff',border:'none',borderRadius:14,padding:'14px 18px',fontWeight:900,cursor:'pointer'},
  modalOverlay:{position:'fixed',inset:0,background:'rgba(15,23,42,.42)',zIndex:9999,display:'grid',placeItems:'center',padding:20},
  modal:{width:'min(460px,100%)',background:'#fff',borderRadius:18,border:'1px solid #e5e7eb',boxShadow:'0 24px 80px rgba(15,23,42,.28)',padding:22,display:'grid',gap:14},
  modalTitle:{fontSize:20,color:'#111827',lineHeight:1.25},
  modalText:{margin:0,color:'#475569',fontSize:16,lineHeight:1.45},
  modalActions:{display:'flex',gap:10,justifyContent:'flex-end',flexWrap:'wrap'},
  modalSecondary:{border:'1px solid #cbd5e1',background:'#fff',color:'#111827',borderRadius:12,padding:'11px 18px',fontWeight:900,cursor:'pointer'},
  modalPrimary:{border:'none',background:'linear-gradient(135deg,#0f172a,#1d4ed8)',color:'#fff',borderRadius:12,padding:'11px 20px',fontWeight:900,cursor:'pointer'}
};
