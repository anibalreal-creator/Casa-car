import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import GlobalHeader from '../../components/GlobalHeader';
import FavoriteButton from '../../components/FavoriteButton';
import LocationMap from '../../components/LocationMap';
import FooterBlueBar from '../../components/FooterBlueBar';
import ShareButtons from '../../components/ShareButtons';
import PrintButton from '../../components/PrintButton';
import ImageGallery from '../../components/ImageGallery';
import SeoHead from '../../components/SeoHead';
import SeoJsonLd from '../../components/SeoJsonLd';
import VerifiedBadge from '../../components/VerifiedBadge';
import PremiumButton from '../../components/PremiumButton';
import AdSlot from '../../components/AdSlot';
import SellerTrustPanel from '../../components/SellerTrustPanel';
import ReviewsSection from '../../components/ReviewsSection';
import TourismBookingPanel from '../../components/TourismBookingPanel';
import TourismProfileSection from '../../components/TourismProfileSection';
import StarRating from '../../components/StarRating';
import Breadcrumbs from '../../components/Breadcrumbs';
import EmptyState from '../../components/EmptyState';
import { secureFetch } from '../../lib/secureClient';
import { getSupabaseServer } from '../../lib/supabaseServer';
import {
  buildBreadcrumbJsonLd,
  buildListingDescription,
  buildListingJsonLd,
  buildOrganizationJsonLd,
  getListingCanonicalUrl,
  getListingSeoSlug,
  getListingSeoPath,
  normalizeListingForSeo,
} from '../../lib/seo';
import { slugify } from '../../lib/slugify';
import { fetchJsonCached } from '../../lib/clientFetchCache';
import { isTourismListing } from '../../lib/tourism';

const SPEC_LABELS = {
  brand: 'Marca', model: 'Modelo', year: 'Año', km: 'Kilómetros', fuel: 'Combustible', transmission: 'Transmisión',
  doors: 'Puertas', engine: 'Motor', color: 'Color', owner_condition: 'Titularidad / origen', plan_ahorro: 'Plan de ahorro',
  condition: 'Estado general', cc: 'Cilindrada', type: 'Tipo', length: 'Eslora', beam: 'Manga', cabins: 'Cabinas',
  passengers: 'Pasajeros / capacidad', max_speed: 'Velocidad máx.', range: 'Autonomía'
};

function buildSpecs(item) {
  const specs = item?.specs_json || {};
  const base = [
    ['Categoría', item?.category],
    ['Subtipo', item?.subtype],
    ['Operación', item?.listing_type],
    ['Precio', item?.price ? `${item.currency || 'USD'} ${Number(item.price || 0).toLocaleString('es-AR')}` : ''],
    ['País', item?.country],
    ['Provincia / estado', item?.state],
    ['Ciudad', item?.city],
    ['Zona / barrio', item?.zone],
  ];
  const dynamic = Object.entries(specs).map(([key, value]) => [SPEC_LABELS[key] || key, value]);
  return [...base, ...dynamic].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
}

export async function getListingServerSideProps(context, lookup = {}) {
  const { params, res } = context;
  const supabase = getSupabaseServer();
  const id = lookup.id || params?.id;
  const seoSlug = lookup.slug || params?.slug;

  try {
    let result;
    if (seoSlug) {
      result = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('seo_slug', seoSlug)
        .maybeSingle();

      if (!result.data) {
        result = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .eq('slug', seoSlug)
          .maybeSingle();
      }

      if (!result.data) {
        const { data: candidates } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .limit(2000);
        const match = (candidates || []).find((row) => slugify(getListingSeoSlug(row)) === seoSlug);
        result = { data: match || null, error: null };
      }
    } else {
      result = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('id', id)
        .maybeSingle();
    }

    if (result?.error || !result?.data) return { notFound: true };
    res?.setHeader?.('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return { props: { initialItem: normalizeListingForSeo(result.data) } };
  } catch {
    return { notFound: true };
  }
}

export async function getServerSideProps(context) {
  return getListingServerSideProps(context, { id: context.params?.id });
}

export default function ListingDetail({ initialItem = null }) {
  const router = useRouter();
  const { id } = router.query;
  const routeId = id || initialItem?.id;
  const [item, setItem] = useState(initialItem);
  const [reviewsState, setReviewsState] = useState({ summary:{ rating_avg:0, reviews_count:0 }, reviews:[] });
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [similarItems, setSimilarItems] = useState([]);

  async function loadReviews(listingId) {
    const response = await fetch(`/api/reviews?listing_id=${listingId}`);
    const data = await response.json();
    if (response.ok) setReviewsState(data);
  }

  useEffect(() => {
    if (!routeId) return;
    let alive = true;
    async function hydrate() {
      const loaded = initialItem || await fetchJsonCached(`/api/listings?id=${routeId}`, { ttlMs: 30000 });
      if (!alive) return;
      setItem(loaded || null);
      if (loaded?.category) {
        fetchJsonCached(`/api/listings?category=${encodeURIComponent(loaded.category)}&pageSize=4`, { ttlMs: 30000 }).then((payload) => {
          const items = Array.isArray(payload) ? payload : payload?.items || [];
          if (alive) setSimilarItems(items.filter((entry) => entry.id !== loaded.id).slice(0, 3));
        }).catch(() => setSimilarItems([]));
      }
    }
    hydrate().catch(() => {
      if (alive) setItem(initialItem || null);
    });
    loadReviews(routeId).catch(() => setReviewsState({ summary:{ rating_avg:0, reviews_count:0 }, reviews:[] }));
    fetch('/api/listing-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: routeId }) });
    return () => { alive = false; };
  }, [routeId, initialItem]);

  async function sendMessage(e) {
    e.preventDefault();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: routeId, sender_name: senderName, sender_email: senderEmail, body })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'No se pudo enviar');
    setBody('');
    alert('Consulta enviada');
  }

  async function reportListing() {
    setReportMessage('');
    try {
      const response = await secureFetch('/api/secure/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: routeId, reason: 'otro', details: reportText || 'Reporte enviado desde la ficha del anuncio.' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'No se pudo reportar');
      setReportText('');
      setReportMessage('Reporte enviado correctamente.');
    } catch (error) {
      setReportMessage(error.message || 'Necesitás iniciar sesión para reportar.');
    }
  }

  function track(type) {
    fetch('/api/listing-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: routeId, type }),
    }).catch(() => {});
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: type, entity_type: 'listing', entity_id: routeId, meta: { category: item?.category || '' } }),
    }).catch(() => {});
  }

  const breadcrumbs = useMemo(() => [
    { label: 'Inicio', href: '/' },
    item?.category ? { label: item.category, href: '/buscar?category=' + encodeURIComponent(item.category) } : null,
    { label: item?.title || 'Detalle' },
  ].filter(Boolean), [item]);

  if (!item) return <div style={{padding:40,fontFamily:'Arial'}}>Cargando...</div>;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const specs = item.specs_json || {};
  const contactEmail = item.contact_email || specs.contact_email || '';
  const contactStats = `${Number(item.clicks_whatsapp || 0)} clics WA · ${Number(item.clicks_mail || 0)} clics Mail · ${Number(item.chat_messages || 0)} chats`;
  const seoUrl = getListingCanonicalUrl(item);
  const seoLocation = [item.city, item.country].filter(Boolean).join(', ');
  const seoTitle = `${item.title || 'Anuncio'}${seoLocation ? ` en ${seoLocation}` : ''} | Casa-Car`;
  const seoDescription = buildListingDescription(item);
  const seoImage = item.images?.[0] || '/casa-car-logo.png';
  const seller = {
    display_name: item.seller_name,
    verified: item.seller_verified || item.verified,
    rating_avg: item.seller_rating_avg ?? reviewsState?.summary?.rating_avg ?? 0,
    reviews_count: item.seller_reviews_count ?? reviewsState?.summary?.reviews_count ?? 0,
    active_listings: item.seller_active_listings || 0,
    created_at: item.seller_created_at,
  };
  const detailRows = buildSpecs(item);
  const tourism = isTourismListing(item);

  return (
    <div style={{background:'#f5f7fb',minHeight:'100vh',fontFamily:'Arial, sans-serif'}}>
      <SeoHead title={seoTitle} description={seoDescription} image={seoImage} url={seoUrl} type="product" />
      <SeoJsonLd data={buildOrganizationJsonLd()} />
      <SeoJsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <SeoJsonLd data={buildListingJsonLd(item)} />
      <GlobalHeader />

      <div style={{maxWidth:1200,margin:'0 auto',padding:20,display:'grid',gap:24}}>
        <Breadcrumbs items={breadcrumbs} />
        <ImageGallery images={item.images || []} item={item} />

        <section className="cc-detail-hero" style={styles.heroCard}>
          <div>
            <h1 style={{margin:'0 0 10px'}}>{item.title}</h1>
            <div style={styles.badges}>
              <FavoriteButton listingId={item.id} />
              <VerifiedBadge verified={item.seller_verified || item.verified} />
              {(item.seller_reviews_count || reviewsState?.summary?.reviews_count) ? <StarRating value={item.seller_rating_avg || reviewsState.summary.rating_avg} count={item.seller_reviews_count || reviewsState.summary.reviews_count} /> : null}
            </div>
            <p style={styles.description}>{item.description}</p>
          </div>

          <div style={styles.contactBox}>
            <div style={styles.contactLabel}>Rendimiento del anuncio</div>
            <strong style={styles.contactStats}>{contactStats}</strong>
            <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
              <a href={`https://wa.me/${item.phone || ''}`} target="_blank" rel="noreferrer" onClick={() => track('whatsapp_click')} style={{background:'#22c55e',color:'#fff',padding:'12px 16px',borderRadius:8,textDecoration:'none',fontWeight:800}}>WhatsApp</a>
              {contactEmail ? <a href={`mailto:${contactEmail}`} onClick={() => track('mail_click')} style={{background:'#475569',color:'#fff',padding:'12px 16px',borderRadius:8,textDecoration:'none',fontWeight:800}}>Email</a> : null}
            </div>
            <div style={{marginTop:18}}><PremiumButton listing={item} /></div>
            <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid #e2e8f0'}}>
              <div style={styles.contactLabel}>Confianza</div>
              <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Reportar publicación" style={styles.reportInput} />
              <button onClick={reportListing} style={styles.reportBtn}>Reportar</button>
              {reportMessage ? <div style={styles.reportMessage}>{reportMessage}</div> : null}
            </div>
          </div>
        </section>

        {tourism ? (
          <section className="cc-detail-cols" style={styles.twoCols}>
            <TourismProfileSection listing={item} />
            <TourismBookingPanel listing={item} />
          </section>
        ) : null}

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Ficha del anuncio</h2>
          <div style={styles.specGrid}>
            {detailRows.map(([label, value]) => (
              <div key={`${label}-${value}`} style={styles.specItem}>
                <span style={styles.specLabel}>{label}</span>
                <strong style={styles.specValue}>{String(value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <SellerTrustPanel seller={seller} />
        <div><AdSlot slot="listing_inline" page="listing" title="Publicidad en esta ficha" /></div>

        <section className="cc-detail-cols" style={styles.twoCols}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ubicación</h2>
            <LocationMap city={item.city} country={item.country} />
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Compartir</h2>
            <ShareButtons title={item.title} url={currentUrl} />
            <div style={{marginTop:10}}><PrintButton /></div>
          </div>
        </section>

        <ReviewsSection listingId={item.id} sellerName={seller.display_name} summary={reviewsState.summary} reviews={reviewsState.reviews} onCreated={() => loadReviews(item.id)} />

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Enviar consulta</h2>
          <form onSubmit={sendMessage} style={styles.form}>
            <input style={styles.input} value={senderName} onChange={(e)=>setSenderName(e.target.value)} placeholder="Tu nombre" required />
            <input style={styles.input} value={senderEmail} onChange={(e)=>setSenderEmail(e.target.value)} placeholder="Tu email" type="email" required />
            <textarea style={{...styles.input,minHeight:120,resize:'vertical'}} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Escribí tu consulta" required />
            <button type="submit" style={styles.submit}>Enviar mensaje</button>
          </form>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Publicaciones similares</h2>
          {similarItems.length ? (
            <div style={styles.similarGrid}>
              {similarItems.map((similar) => (
                <a key={similar.id} href={getListingSeoPath(similar)} style={styles.similarCard}>
                  <img src={similar.images?.[0] || 'https://picsum.photos/seed/casacar/900/600'} alt={similar.title} style={styles.similarImg} />
                  <strong>{similar.title}</strong>
                  <span>{similar.currency || 'USD'} {Number(similar.price || 0).toLocaleString('es-AR')}</span>
                </a>
              ))}
            </div>
          ) : <EmptyState title="Sin similares por ahora" text="Cuando entren más avisos de la categoría, van a aparecer acá." />}
        </section>
      </div>

      <FooterBlueBar />

      <style jsx>{`
        @media (max-width: 980px) {
          .cc-detail-hero,
          .cc-detail-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  heroCard:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:20,boxShadow:'0 12px 28px rgba(15,23,42,.06)',display:'grid',gridTemplateColumns:'1.3fr .9fr',gap:20},
  badges:{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14},
  description:{margin:0,color:'#334155',lineHeight:1.7,fontSize:16},
  contactBox:{background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:16,padding:18,alignSelf:'start'},
  contactLabel:{fontSize:12,fontWeight:900,letterSpacing:.6,color:'#2563eb',textTransform:'uppercase'},
  contactStats:{display:'block',marginTop:8,fontSize:20,color:'#111827'},
  reportInput:{width:'100%',marginTop:10,border:'1px solid #cbd5e1',borderRadius:10,padding:'10px 12px',minHeight:90,resize:'vertical'},
  reportBtn:{marginTop:10,background:'#0f172a',color:'#fff',border:'none',padding:'10px 14px',borderRadius:10,fontWeight:800,cursor:'pointer'},
  reportMessage:{marginTop:8,color:'#2563eb',fontWeight:700},
  twoCols:{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:18},
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:20,boxShadow:'0 12px 28px rgba(15,23,42,.06)'},
  cardTitle:{margin:'0 0 14px',fontSize:24,color:'#111827'},
  specGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12},
  specItem:{padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:14,background:'#f8fafc',display:'grid',gap:4},
  specLabel:{fontSize:12,fontWeight:900,color:'#64748b',textTransform:'uppercase',letterSpacing:'.04em'},
  specValue:{fontSize:15,color:'#111827'},
  form:{display:'grid',gap:10},
  input:{width:'100%',border:'1px solid #cbd5e1',borderRadius:12,padding:'12px 14px',fontSize:14,outline:'none'},
  submit:{background:'#2563eb',color:'#fff',border:'none',borderRadius:12,padding:'12px 14px',fontWeight:900,cursor:'pointer'},
  similarGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14},
  similarCard:{display:'grid',gap:10,textDecoration:'none',color:'#111827',border:'1px solid #e5e7eb',borderRadius:14,padding:12},
  similarImg:{width:'100%',height:160,objectFit:'cover',borderRadius:12,background:'#eef2f7'}
};
