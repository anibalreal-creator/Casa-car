import { useRouter } from 'next/router';
import GlobalHeader from '../../../components/GlobalHeader';
import FooterBlueBar from '../../../components/FooterBlueBar';
import AdSlot from '../../../components/AdSlot';
import { getAdSlot } from '../../../data/adPlans';

const surroundingCopy = {
  home_top: 'Así se ve el banner en la parte superior del sitio, antes del contenido principal.',
  home_middle: 'Así se ve el banner dentro del home, en una zona media de alto alcance.',
  search_sidebar: 'Así se ve el banner de búsqueda en un formato lateral para captar leads.',
  listing_inline: 'Así se ve el banner dentro de la ficha de un anuncio, entre contenido comercial.',
  footer_strip: 'Así se ve el banner en el pie global del sitio, presente en múltiples páginas.',
};

export default function SlotLocationPreviewPage() {
  const router = useRouter();
  const slotKey = String(router.query.slot || 'home_middle');
  const slot = getAdSlot(slotKey);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.kicker}>UBICACIÓN REAL DEL SLOT</div>
        <h1 style={styles.title}>{slot.label}</h1>
        <p style={styles.subtitle}>{surroundingCopy[slotKey] || 'Vista de referencia para el espacio publicitario seleccionado.'}</p>

        <section style={styles.mockPage}>
          <div style={styles.mockHeader}>Contenido del sitio</div>
          {(slotKey === 'home_top' || slotKey === 'home_middle') ? (
            <>
              {slotKey === 'home_top' ? <AdSlot slot='home_top' page='home' title='Ubicación ejemplo' /> : null}
              <div style={styles.contentBlock}>Sección principal del home</div>
              {slotKey === 'home_middle' ? <AdSlot slot='home_middle' page='home' title='Ubicación ejemplo' /> : null}
              <div style={styles.cardsRow}><div style={styles.card} /><div style={styles.card} /><div style={styles.card} /></div>
            </>
          ) : null}

          {slotKey === 'search_sidebar' ? (
            <div style={styles.searchLayout}>
              <aside style={styles.sidebar}><AdSlot slot='search_sidebar' page='buscar' title='Ubicación ejemplo' compact /></aside>
              <div style={styles.results}><div style={styles.resultCard} /><div style={styles.resultCard} /><div style={styles.resultCard} /></div>
            </div>
          ) : null}

          {slotKey === 'listing_inline' ? (
            <>
              <div style={styles.contentBlock}>Galería del anuncio</div>
              <div style={styles.contentBlock}>Descripción y características</div>
              <AdSlot slot='listing_inline' page='listing' title='Ubicación ejemplo' />
              <div style={styles.contentBlock}>Contacto y mapas</div>
            </>
          ) : null}

          {slotKey === 'footer_strip' ? (
            <>
              <div style={styles.contentBlock}>Contenido general de la página</div>
              <AdSlot slot='footer_strip' page='global' title='Ubicación ejemplo' />
            </>
          ) : null}
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page:{minHeight:'100vh',background:'#f5f7fb',fontFamily:'Arial, sans-serif'},
  wrap:{maxWidth:1320,margin:'0 auto',padding:'24px 16px 48px',display:'grid',gap:18},
  kicker:{display:'inline-block',width:'fit-content',padding:'6px 10px',borderRadius:999,background:'#dbeafe',color:'#1d4ed8',fontWeight:900,fontSize:12},
  title:{fontSize:'clamp(34px,4vw,52px)',margin:'8px 0 0 0'},
  subtitle:{margin:0,color:'#64748b',fontSize:18,lineHeight:1.6},
  mockPage:{display:'grid',gap:18,background:'#fff',border:'1px solid #e5e7eb',borderRadius:24,padding:20},
  mockHeader:{height:68,borderRadius:18,background:'linear-gradient(90deg,#e2e8f0,#f8fafc)',display:'grid',placeItems:'center',fontWeight:900,color:'#0f172a'},
  contentBlock:{height:120,borderRadius:18,background:'linear-gradient(90deg,#eef2ff,#f8fafc)',border:'1px solid #e5e7eb',display:'grid',placeItems:'center',fontWeight:800,color:'#475569'},
  cardsRow:{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:14},
  card:{height:160,borderRadius:18,background:'linear-gradient(180deg,#eff6ff,#fff)',border:'1px solid #e5e7eb'},
  searchLayout:{display:'grid',gridTemplateColumns:'320px minmax(0,1fr)',gap:16},
  sidebar:{display:'grid',alignContent:'start'},
  results:{display:'grid',gap:14},
  resultCard:{height:140,borderRadius:18,background:'linear-gradient(180deg,#f8fafc,#fff)',border:'1px solid #e5e7eb'},
};
