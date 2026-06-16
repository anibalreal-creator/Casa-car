import { useEffect, useState } from "react";
import GlobalHeader from "../components/GlobalHeader";
import FooterBlueBar from "../components/FooterBlueBar";
import RouteGuard from "../components/RouteGuard";
import { secureFetch } from "../lib/secureClient";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { isOwnerEmail } from "../lib/owner";
import { useLang } from "../context/LanguageContext";

const initialCampaign = { name:'', plan:'BASICO', budget:'', slot:'home_top', target_url:'', banner_url:'', notes:'' };
const initialVerify = { company_name:'', contact_name:'', phone:'', website:'', notes:'' };

function EmpresaInner() {
  const { t } = useLang();
  const [dashboard, setDashboard] = useState(null);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [verify, setVerify] = useState(initialVerify);
  const [ownerMode, setOwnerMode] = useState(false);

  async function load() {
    const res = await secureFetch('/api/secure/company/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('dashboard_load_error', 'No se pudo cargar el panel'));
    setDashboard(data);
  }

  useEffect(() => {
    load().catch(() => setDashboard({ metrics:{ campaigns:0, activeAds:0, premiumListings:0, totalViews:0, impressions:0, clicks:0, ctr:0 }, campaigns:[], membership:{plan:'FREE'}, verification:{ verified:false, pending:true } }));
    supabaseBrowser.auth.getUser().then(({ data }) => setOwnerMode(isOwnerEmail(data?.user?.email)));
  }, []);

  async function createCampaign(e) {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/secure/company/campaign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(campaign) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('campaign_save_error', 'No se pudo guardar'));
      setCampaign(initialCampaign);
      await load();
      alert(t('campaign_saved', 'Campaña guardada'));
    } catch (error) {
      alert(error.message || t('campaign_save_error', 'No se pudo guardar'));
    }
  }

  async function requestVerify(e) {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/secure/verify-request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(verify) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('verification_send_error', 'No se pudo enviar'));
      setVerify(initialVerify);
      alert(t('verification_sent', 'Solicitud enviada'));
    } catch (error) {
      alert(error.message || t('verification_send_error', 'No se pudo enviar'));
    }
  }

  const metrics = dashboard?.metrics || { campaigns:0, activeAds:0, premiumListings:0, totalViews:0, impressions:0, clicks:0, ctr:0 };
  const campaigns = Array.isArray(dashboard?.campaigns) ? dashboard.campaigns : [];

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        {ownerMode ? (
          <div style={styles.ownerBox}>
            <strong>{t('owner_mode_active', 'Modo dueño gratis activo.')}</strong>{' '}
            {t('empresa_owner_box_copy', 'Tus campañas y destacados pueden activarse sin cobro y este aviso solo se muestra para anibalreal@hotmail.com.')}
          </div>
        ) : null}

        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>{t('empresa_kicker', 'MODO NEGOCIO')}</div>
            <h1 style={styles.title}>{t('empresa_title', 'Panel empresa BUSINESS')}</h1>
            <p style={styles.subtitle}>{t('empresa_subtitle', 'Administrá campañas, verificá tu marca, medí impresiones y prepará Casa-Car para vender espacios publicitarios en serio.')}</p>
          </div>
          <a href="/planes" style={styles.heroButton}>{t('ads_see_plans', 'Ver planes')}</a>
        </section>

        <section style={styles.metricsGrid}>
          <div style={styles.metric}><strong>{dashboard?.verification?.verified ? t('yes', 'Sí') : t('pending', 'Pendiente')}</strong><span>{t('verified_brand', 'Marca verificada')}</span></div>
          {[
            [t('campaigns', 'Campañas'), metrics.campaigns],
            [t('active_ads', 'Anuncios activos'), metrics.activeAds],
            [t('premium', 'Premium'), metrics.premiumListings],
            [t('views', 'Vistas'), metrics.totalViews],
            [t('impressions', 'Impresiones'), metrics.impressions],
            [t('ctr', 'CTR %'), metrics.ctr],
          ].map(([label, value]) => (
            <div key={label} style={styles.metric}><strong>{value}</strong><span>{label}</span></div>
          ))}
        </section>

        <section style={styles.columns}>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>{t('new_campaign', 'Nueva campaña')}</h2>
            <form onSubmit={createCampaign} style={styles.form}>
              <input style={styles.input} placeholder={t('campaign_name', 'Nombre de campaña')} value={campaign.name} onChange={(e)=>setCampaign((p)=>({...p,name:e.target.value}))} required />
              <div style={styles.row}>
                <select style={styles.input} value={campaign.plan} onChange={(e)=>setCampaign((p)=>({...p,plan:e.target.value}))}>
                  <option>BASICO</option><option>DESTACADO</option><option>PREMIUM</option>
                </select>
                <input style={styles.input} placeholder={t('budget', 'Presupuesto')} value={campaign.budget} onChange={(e)=>setCampaign((p)=>({...p,budget:e.target.value}))} />
              </div>
              <div style={styles.row}>
                <select style={styles.input} value={campaign.slot} onChange={(e)=>setCampaign((p)=>({...p,slot:e.target.value}))}>
                  <option value="home_hero">{t('home_hero', 'Home hero')}</option>
                  <option value="search_sidebar">{t('search_sidebar_slot', 'Buscar sidebar')}</option>
                  <option value="listing_inline">{t('listing_detail_slot', 'Ficha anuncio')}</option>
                </select>
                <input style={styles.input} placeholder={t('destination_url', 'URL destino')} value={campaign.target_url} onChange={(e)=>setCampaign((p)=>({...p,target_url:e.target.value}))} />
              </div>
              <input style={styles.input} placeholder={t('banner_url', 'URL banner')} value={campaign.banner_url} onChange={(e)=>setCampaign((p)=>({...p,banner_url:e.target.value}))} />
              <textarea style={styles.textarea} placeholder={t('notes', 'Notas')} value={campaign.notes} onChange={(e)=>setCampaign((p)=>({...p,notes:e.target.value}))} />
              <button type="submit" style={styles.button}>{t('save_campaign', 'Guardar campaña')}</button>
            </form>
          </article>

          <article style={styles.card}>
            <h2 style={styles.cardTitle}>{t('verification_request', 'Solicitud de verificación')}</h2>
            <form onSubmit={requestVerify} style={styles.form}>
              <input style={styles.input} placeholder={t('company', 'Empresa')} value={verify.company_name} onChange={(e)=>setVerify((p)=>({...p,company_name:e.target.value}))} required />
              <input style={styles.input} placeholder={t('contact', 'Contacto')} value={verify.contact_name} onChange={(e)=>setVerify((p)=>({...p,contact_name:e.target.value}))} />
              <div style={styles.row}>
                <input style={styles.input} placeholder={t('phone', 'Teléfono')} value={verify.phone} onChange={(e)=>setVerify((p)=>({...p,phone:e.target.value}))} />
                <input style={styles.input} placeholder={t('website', 'Sitio web')} value={verify.website} onChange={(e)=>setVerify((p)=>({...p,website:e.target.value}))} />
              </div>
              <textarea style={styles.textarea} placeholder={t('notes_team', 'Notas para el equipo')} value={verify.notes} onChange={(e)=>setVerify((p)=>({...p,notes:e.target.value}))} />
              <button type="submit" style={styles.buttonAlt}>{t('send_request', 'Enviar solicitud')}</button>
            </form>
          </article>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>{t('loaded_campaigns', 'Campañas cargadas')}</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>{t('name', 'Nombre')}</th>
                  <th>{t('plan', 'Plan')}</th>
                  <th>{t('slot', 'Slot')}</th>
                  <th>{t('status', 'Estado')}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length ? campaigns.map((item) => (
                  <tr key={item.id || `${item.campaign_name || item.title || 'campaign'}-${item.slot_key || item.slot || ''}`}>
                    <td>{item.name || item.title || item.campaign_name || t('untitled', 'Sin título')}</td>
                    <td>{item.plan || item.plan_name || item.plan_key || item.membership_plan || '-'}</td>
                    <td>{item.slot || item.slot_label || item.slot_key || item.location || '-'}</td>
                    <td>{item.status || (item.active ? t('active_female', 'activa') : '-')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4">{t('no_campaigns_yet', 'Todavía no hay campañas registradas.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

export default function EmpresaPage() {
  return <RouteGuard><EmpresaInner /></RouteGuard>;
}

const styles = {
  page:{background:'#f5f7fb',minHeight:'100vh',fontFamily:'Arial, sans-serif'},
  wrap:{maxWidth:1280,margin:'0 auto',padding:'28px 16px 48px'},
  hero:{display:'flex',justifyContent:'space-between',alignItems:'end',gap:20,flexWrap:'wrap',marginBottom:22},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:'.14em',color:'#1d4ed8'},
  title:{fontSize:50,margin:'8px 0 10px 0'},
  subtitle:{maxWidth:760,fontSize:18,lineHeight:1.7,color:'#6b7280',margin:0},
  heroButton:{textDecoration:'none',background:'#0f172a',color:'#fff',padding:'14px 18px',borderRadius:12,fontWeight:900},
  metricsGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:18},
  metric:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:18,display:'grid',gap:8},
  columns:{display:'grid',gridTemplateColumns:'1.15fr .85fr',gap:18,alignItems:'start',marginBottom:18},
  card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:18,boxShadow:'0 16px 32px rgba(15,23,42,.04)'},
  cardTitle:{margin:'0 0 12px 0',fontSize:24},
  form:{display:'grid',gap:12},
  row:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12},
  input:{padding:'14px 16px',border:'1px solid #d1d5db',borderRadius:12,fontSize:15},
  textarea:{padding:'14px 16px',border:'1px solid #d1d5db',borderRadius:12,fontSize:15,minHeight:110},
  button:{background:'#1d4ed8',color:'#fff',border:'none',borderRadius:12,padding:'14px 16px',fontWeight:900,cursor:'pointer'},
  buttonAlt:{background:'#0f172a',color:'#fff',border:'none',borderRadius:12,padding:'14px 16px',fontWeight:900,cursor:'pointer'},
  tableWrap:{overflowX:'auto'},
  table:{width:'100%',borderCollapse:'collapse'},
  ownerBox:{background:'#ecfeff',border:'1px solid #67e8f9',color:'#155e75',padding:'12px 14px',borderRadius:12,marginBottom:16,fontWeight:700},
};
