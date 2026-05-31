import { useEffect, useMemo, useState } from 'react';
import FavoriteButton from './FavoriteButton';
import { useLang } from '../context/LanguageContext';
import { fetchJsonCached } from '../lib/clientFetchCache';

function safeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
function normalizeArrayImageEntry(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') return entry.url || entry.src || entry.path || entry.secure_url || entry.publicUrl || '';
  return '';
}
function getImage(item) {
  const direct = [item?.image_url, item?.imageUrl, item?.image, item?.cover_image, item?.coverImage, item?.main_image, item?.mainImage, item?.thumbnail, item?.thumbnail_url, item?.photo_url, item?.photo].find(Boolean);
  if (direct) return direct;
  const arrays = [safeJsonArray(item?.images), safeJsonArray(item?.photos), safeJsonArray(item?.gallery), safeJsonArray(item?.media), safeJsonArray(item?.files)];
  for (const arr of arrays) if (Array.isArray(arr) && arr.length > 0) { const first = normalizeArrayImageEntry(arr[0]); if (first) return first; }
  return '/placeholder-property.jpg';
}
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim()); }
function formatPrice(item, t) {
  if (item?.price_on_request) return t('card_price_on_request', 'Consultar');
  if (item?.price === null || item?.price === undefined || item?.price === '') return t('card_price_on_request', 'Consultar');
  const num = Number(item.price);
  if (Number.isNaN(num)) return String(item.price);
  return `${item.currency || 'USD'} ${num.toLocaleString('es-AR')}`;
}

const demoTitles = {
  es: ['Retroexcavadora premium lista para trabajar','Camión de ruta con cabina renovada','Carro de golf eléctrico premium','Casa moderna en zona residencial','Lancha de recreo lista para navegar','PH urbano con amenities','Yate de lujo para charter','Servicio profesional para empresas'],
  en: ['Premium backhoe ready to work','Highway truck with renewed cabin','Premium electric golf cart','Modern house in residential area','Recreation boat ready to sail','Urban PH with amenities','Luxury yacht for charter','Professional service for companies'],
  pt: ['Retroescavadeira premium pronta para trabalhar','Caminhão rodoviário com cabine renovada','Carrinho de golfe elétrico premium','Casa moderna em área residencial','Lancha de lazer pronta para navegar','PH urbano com comodidades','Iate de luxo para charter','Serviço profissional para empresas'],
  zh: ['高端反铲挖掘机可直接作业','更新驾驶室的公路卡车','高端电动高尔夫车','住宅区现代住宅','可立即出航的休闲快艇','带配套设施的城市住宅','豪华包船游艇','企业专业服务'],
};

const EMPTY_ITEMS = [];

export default function MarketplaceHomeSections({ items = EMPTY_ITEMS }) {
  const { t, language } = useLang();
  const [remoteItems, setRemoteItems] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    if (Array.isArray(items) && items.length) return;
    let alive = true;
    async function load() {
      try {
        setLoadingRemote(true);
        const payload = await fetchJsonCached('/api/listings?page=1&pageSize=16&sort=recent', { ttlMs: 30000 });
        const rows = Array.isArray(payload) ? payload : payload?.items || [];
        const valid = rows.filter((item) => isUuid(item?.id));
        if (alive) setRemoteItems(valid);
      } catch {
        if (alive) setRemoteItems([]);
      } finally {
        if (alive) setLoadingRemote(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [items]);

  const normalized = useMemo(() => {
    if (Array.isArray(items) && items.length) return items;
    if (remoteItems.length) return remoteItems;
    const titles = demoTitles[language] || demoTitles.es;
    return baseDemoItems.map((item, idx) => ({ ...item, title: titles[idx] || item.title, is_demo: true }));
  }, [items, remoteItems, language]);

  const top = normalized.slice(0, 8);
  const fresh = normalized.slice(8, 16);

  return (
    <div>
      <Section kicker={t('featured_kicker', 'HOY')} title={t('featured_title', 'Anuncios con más potencial visual para la portada')} items={top} loading={loadingRemote && !top.length} />
      <Section kicker={t('latest_kicker', 'HOY')} title={t('latest_title', 'El marketplace se ve vivo cuando la home muestra actividad real')} items={fresh.length ? fresh : top} loading={loadingRemote && !fresh.length && !top.length} />
    </div>
  );
}

function Section({ kicker, title, items, loading = false }) {
  const { t } = useLang();
  const tLoading = t('loading_real_listings', 'Cargando anuncios reales...');
  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#4f46e5', letterSpacing: '.06em', marginBottom: 8 }}>{kicker}</div>
      <h2 className="cc-home-section-title" style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: '0 0 22px' }}>{title}</h2>
      {loading ? <div style={styles.notice}>{tLoading}</div> : null}
      <div className="cc-home-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 20 }}>
        {items.map((item, idx) => <Card key={item.id || idx} item={item} />)}
      </div>
      <style jsx>{`
        @media (max-width: 1180px) { .cc-home-cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; } }
        @media (max-width: 980px) {
          .cc-home-section-title { font-size: 26px !important; }
          .cc-home-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
        }
        @media (max-width: 640px) { .cc-home-cards-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function Card({ item }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const fallback = '/placeholder-property.jpg';
  const initialImage = getImage(item) || fallback;
  const [image, setImage] = useState(initialImage);
  const price = formatPrice(item, t);
  const title = item.title || t('card_no_title', 'Anuncio');
  const detailId = isUuid(item?.id) ? String(item.id) : '';
  const detailHref = detailId ? `/listing/${detailId}` : '#';
  const whatsappHref = item.whatsapp_url || (item.phone ? `https://wa.me/${item.phone}` : '#');

  return (
    <article onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, overflow:'hidden', boxShadow: hovered ? '0 20px 40px rgba(15,23,42,.12)' : '0 12px 28px rgba(15,23,42,.05)', transform: hovered ? 'translateY(-4px)' : 'translateY(0)', transition:'all .2s ease', cursor:'pointer' }}>
      <div style={{ position:'relative', background:'#f3f4f6' }}>
        <img src={image} alt={title} title={title} onError={() => setImage(fallback)} style={{ width:'100%', height:220, objectFit:'cover', objectPosition:'center center', display:'block', background:'#f3f4f6' }} />
        <div style={{ position:'absolute', top:10, right:10, zIndex:3 }}>{!item?.is_demo && detailId ? <FavoriteButton listingId={detailId} compact /> : null}</div>
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:8, zIndex:2 }}>
          {item.is_premium ? <span style={pill('#fbbf24')}>{t('card_premium', 'Premium')}</span> : null}
          <span style={pill('#22c55e')}>{String(item.listing_type || t('card_sale', 'Venta')).replace(/^./, (s) => s.toUpperCase())}</span>
        </div>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:28, fontWeight:900, color:'#111827', lineHeight:1.1, marginBottom:10 }}>{price}</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:6, lineHeight:1.2 }}>{title}</div>
        <div style={{ color:'#4338ca', fontWeight:700, marginBottom:6 }}>{[item.city, item.country].filter(Boolean).join(', ')}</div>
        <div style={{ color:'#6b7280', marginBottom:8 }}>{[item.category, item.subtype].filter(Boolean).join(' · ')}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#374151' }}>{item.views || 0} {t('card_views', 'visitas')}</span>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <a href={whatsappHref} style={btn('#22c55e')}>{t('card_whatsapp', 'WhatsApp')}</a>
            <a href={detailHref} style={btn('#1d4ed8')}>{t('card_detail', 'Detalle')}</a>
          </div>
        </div>
      </div>
    </article>
  );
}
function pill(bg) { return { background:bg, color:'#fff', padding:'6px 10px', borderRadius:999, fontWeight:900, fontSize:12 }; }
function btn(bg) { return { textDecoration:'none', background:bg, color:'#fff', padding:'10px 12px', borderRadius:10, fontWeight:800, fontSize:14 }; }
const styles = { notice: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 14, padding: '14px 16px', fontWeight: 700, marginBottom: 18 } };
const baseDemoItems = [
  {id:1,category:'Propiedades',subtype:'Departamento',listing_type:'venta',price:145000,currency:'USD',city:'Buenos Aires',country:'Argentina',views:34,is_premium:true,image:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop'},
  {id:2,category:'Autos',subtype:'Sedán',listing_type:'venta',price:21500,currency:'USD',city:'Miami',country:'Estados Unidos',views:57,is_premium:true,image:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1400&auto=format&fit=crop'},
  {id:3,category:'Náutica',subtype:'Lancha',listing_type:'venta',price:37000,currency:'USD',city:'Cancún',country:'México',views:18,image:'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=1400&auto=format&fit=crop'},
  {id:4,category:'Propiedades',subtype:'Casa',listing_type:'venta',price:189000,currency:'USD',city:'Rosario',country:'Argentina',views:41,image:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1400&auto=format&fit=crop'},
  {id:5,category:'Motos',subtype:'Urbana',listing_type:'venta',price:7800,currency:'USD',city:'Córdoba',country:'Argentina',views:22,image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1400&auto=format&fit=crop'},
  {id:6,category:'Autos',subtype:'SUV',listing_type:'venta',price:28900,currency:'USD',city:'Houston',country:'Estados Unidos',views:63,is_premium:true,image:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1400&auto=format&fit=crop'},
  {id:7,category:'Propiedades',subtype:'Oficina',listing_type:'alquiler',price:2400,currency:'USD',city:'São Paulo',country:'Brasil',views:15,image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1400&auto=format&fit=crop'},
  {id:8,category:'Servicios',subtype:'Logística',listing_type:'venta',price:0,currency:'USD',city:'Santa Fe',country:'Argentina',views:11,image:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1400&auto=format&fit=crop'}
];
