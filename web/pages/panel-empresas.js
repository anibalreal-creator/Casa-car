import { useEffect, useMemo, useState } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import FooterBlueBar from '../components/FooterBlueBar';
import AdsBanner from '../components/AdsBanner';
import { useLang } from '../context/LanguageContext';

const fallbackAds = [
  { id:'house-home-top', title:'Tu empresa puede aparecer acá', company_name:'Casa-Car Ads', slot:'Home superior', image:'/ads/banner_empresas_hero.jpg', destination_url:'/publicidad' },
  { id:'house-footer', title:'Reservá tu espacio publicitario automático', company_name:'Casa-Car Ads', slot:'Pie global', image:'/banner_horizontal_secondary.png', destination_url:'/publicidad/panel' },
  { id:'house-home-middle', title:'Banners para inmobiliarias, concesionarias y servicios', company_name:'Casa-Car Ads', slot:'Home media', image:'/banner_horizontal_secondary.png', destination_url:'/publicidad#planes' },
  { id:'house-listing', title:'Sponsor destacado dentro de cada anuncio', company_name:'Casa-Car Ads', slot:'Ficha de anuncio', image:'/banner_horizontal_secondary.png', destination_url:'/publicidad/panel' },
  { id:'house-sidebar', title:'Impulsá tu marca con Mercado Pago integrado', company_name:'Casa-Car Ads', slot:'Buscar sidebar', image:'/banner_vertical_mobile.png', destination_url:'/publicidad/panel' },
];

export default function PanelEmpresasPage() {
  const { t } = useLang();
  const [ads, setAds] = useState(fallbackAds);

  useEffect(() => {
    let alive = true;
    fetch('/api/ads/active')
      .then((r) => r.json())
      .then((payload) => {
        if (!alive) return;
        const nextAds = Array.isArray(payload?.ads) && payload.ads.length ? payload.ads.map((item) => ({
          id: item.id,
          title: item.title,
          company_name: item.company_name || 'Casa-Car Ads',
          slot: item.slot_label || item.slot_key,
          image: item.image || item.banner_url || '/ads/banner_empresas_hero.jpg',
          destination_url: item.destination_url || '/publicidad',
        })) : fallbackAds;
        setAds(nextAds.slice(0, 5));
      })
      .catch(() => { if (alive) setAds(fallbackAds); });
    return () => { alive = false; };
  }, []);

  const localizedAds = useMemo(() => ads.map((ad) => {
    if (!String(ad.id || '').startsWith('house-')) return ad;
    const map = {
      'house-home-top': { title: t('ads_visual_title', 'Tu empresa puede aparecer acá'), slot: t('slot_home_top', 'Home superior') },
      'house-footer': { title: t('house_footer_title', 'Reservá tu espacio publicitario automático'), slot: t('slot_footer', 'Pie global') },
      'house-home-middle': { title: t('house_middle_title', 'Banners para inmobiliarias, concesionarias y servicios'), slot: t('slot_home_middle', 'Home media') },
      'house-listing': { title: t('house_listing_title', 'Sponsor destacado dentro de cada anuncio'), slot: t('slot_listing_inline', 'Ficha de anuncio') },
      'house-sidebar': { title: t('house_sidebar_title', 'Impulsá tu marca con Mercado Pago integrado'), slot: t('slot_search_sidebar', 'Buscar sidebar') },
    };
    return { ...ad, ...(map[ad.id] || {}) };
  }), [ads, t]);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>{t('company_panel_kicker', 'PANEL EMPRESAS')}</div>
            <h1 style={styles.title}>{t('company_panel_title', 'Panel empresas completo + banners automáticos')}</h1>
            <p style={styles.subtitle}>{t('company_panel_subtitle', 'Reservá espacios, subí tu creatividad, cobrá con Mercado Pago y dejá que Casa-Car active y expire los banners por fecha.')}</p>
          </div>
          <div style={styles.heroActions}>
            <a href='/publicidad/panel' style={styles.ctaPrimary}>{t('ads_create_campaign', 'Crear campaña')}</a>
            <a href='/dashboard/company' style={styles.ctaSecondary}>{t('nav_company_dashboard', 'Dashboard empresa')}</a>
            <a href='/publicidad' style={styles.ctaSecondary}>{t('ads_see_plans', 'Ver planes')}</a>
          </div>
        </section>

        <AdsBanner slot='home_top' title={t('slot_home_top', 'Home superior')} />

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>{t('company_panel_how_money', 'Cómo gana plata este módulo')}</h2>
            <ol style={styles.list}>
              <li>{t('company_step_1', 'La empresa elige un plan (Básico / Destacado / Premium).')}</li>
              <li>{t('company_step_2', 'Sube el banner y define el link destino.')}</li>
              <li>{t('company_step_3', 'Casa-Car crea la campaña y genera el checkout.')}</li>
              <li>{t('company_step_4', 'Mercado Pago aprueba y el webhook activa la campaña.')}</li>
              <li>{t('company_step_5', 'La campaña se muestra sola mientras está dentro de la fecha.')}</li>
            </ol>
          </article>

          <article style={styles.card}>
            <h2 style={styles.cardTitle}>{t('company_panel_active_now', 'Espacios activos ahora')}</h2>
            <div style={styles.adsGrid}>
              {localizedAds.length ? localizedAds.map((ad) => (
                <a key={ad.id} href={ad.destination_url || '/publicidad'} style={styles.adItem} target='_blank' rel='noreferrer'>
                  <img src={ad.image} alt={ad.title} style={styles.adImage} />
                  <div style={styles.adMeta}>
                    <strong>{ad.title}</strong>
                    <span>{ad.company_name}</span>
                    <small>{ad.slot}</small>
                  </div>
                </a>
              )) : <p style={styles.empty}>{t('company_panel_empty', 'Todavía no hay campañas activas. Se mostrarán campañas house hasta que entre la primera empresa.')}</p>}
            </div>
          </article>
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{background:'#f5f7fb',minHeight:'100vh',fontFamily:'Arial, sans-serif'},
  wrap:{maxWidth:1320,margin:'0 auto',padding:'24px 16px 48px',display:'grid',gap:22},
  hero:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',justifyContent:'space-between',alignItems:'end',gap:16,background:'#fff',border:'1px solid #e5e7eb',borderRadius:24,padding:24,flexWrap:'wrap'},
  heroActions:{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'},
  kicker:{display:'inline-block',padding:'6px 10px',borderRadius:999,background:'#dbeafe',color:'#1d4ed8',fontWeight:800,fontSize:12,letterSpacing:'.08em',marginBottom:10},
  title:{fontSize:'clamp(34px,4vw,56px)',margin:'0 0 10px',lineHeight:1.05,color:'#111827'},
  subtitle:{fontSize:18,color:'#6b7280',maxWidth:800,margin:0,lineHeight:1.7},
  ctaPrimary:{textDecoration:'none',background:'#111827',color:'#fff',padding:'14px 18px',borderRadius:14,fontWeight:800,whiteSpace:'nowrap'},
  ctaSecondary:{textDecoration:'none',background:'#fff',border:'1px solid #d1d5db',color:'#111827',padding:'14px 18px',borderRadius:14,fontWeight:800,whiteSpace:'nowrap'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16},
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:20,padding:20,minHeight:260},
  cardTitle:{fontSize:24,marginTop:0,color:'#111827'},
  list:{margin:0,paddingLeft:18,color:'#374151',lineHeight:1.9},
  adsGrid:{display:'grid',gap:12},
  adItem:{display:'grid',gridTemplateColumns:'120px 1fr',gap:12,alignItems:'center',border:'1px solid #e5e7eb',borderRadius:16,padding:10,textDecoration:'none',color:'inherit',background:'#fff'},
  adImage:{width:'100%',height:64,objectFit:'contain',borderRadius:12,background:'#0f172a',padding:0},
  adMeta:{display:'grid',gap:6,color:'#374151'},
  empty:{margin:0,color:'#6b7280'}
};
