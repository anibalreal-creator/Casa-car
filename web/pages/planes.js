import { useEffect, useState } from "react";
import GlobalHeader from "../components/GlobalHeader";
import FooterBlueBar from "../components/FooterBlueBar";
import RouteGuard from "../components/RouteGuard";
import { secureFetch } from "../lib/secureClient";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { useLang } from "../context/LanguageContext";

const fallbackPlans = {
  FREE: { price: 0, publications: 3, premiumSlots: 0, analytics: false },
  PRO: { price: 1, publications: 25, premiumSlots: 3, analytics: true },
  BUSINESS: { price: 2, publications: 200, premiumSlots: 30, analytics: true },
};

function PlansInner() {
  const { t } = useLang();
  const [plans, setPlans] = useState(fallbackPlans);
  const [current, setCurrent] = useState({ plan: "FREE", active: false });
  const [saving, setSaving] = useState("");
  const [ownerMode, setOwnerMode] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setOwnerMode(String(data?.user?.email || '').toLowerCase() === 'anibalreal@hotmail.com'));
    secureFetch('/api/secure/subscriptions')
      .then((r) => r.json())
      .then((data) => {
        if (data?.plans) setPlans(data.plans);
        if (data?.current) setCurrent(data.current);
      })
      .catch(() => {});
  }, []);

  async function choosePlan(plan) {
    setSaving(plan);
    try {
      const res = await secureFetch('/api/secure/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('plan_activate_error', 'No se pudo activar'));
      setCurrent(data.subscription || { plan, active: plan !== 'FREE' });
      alert(t('plan_saved', 'Plan guardado correctamente') + `: ${plan}`);
    } catch (error) {
      alert(error.message || t('plan_save_error', 'No se pudo guardar el plan'));
    } finally {
      setSaving('');
    }
  }

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <div style={styles.hero}>
          <div>
            <div style={styles.kicker}>{t('plans_kicker', 'MONETIZACIÓN')}</div>
            <h1 style={styles.title}>{t('plans_title', 'Planes para escalar Casa-Car como negocio real')}</h1>
            <p style={styles.subtitle}>{t('plans_subtitle', 'Activá publicaciones premium, analytics, panel empresa y paquetes de visibilidad.')}</p>
          </div>
          <div style={styles.currentBox}>{t('current_plan', 'Plan actual')}: <strong>{current?.plan || 'FREE'}</strong></div>
        </div>
        {ownerMode ? <div style={styles.ownerBox}><strong>{t('owner_free_mode', 'Modo dueño gratis')}:</strong> {t('owner_free_copy', 'el plan oculto OWNER_FREE te habilita destacados, campañas y métricas sin cobro y solo lo ve tu cuenta.')}</div> : null}
        <section style={styles.grid}>
          {Object.entries(plans).filter(([plan]) => ownerMode || plan !== 'OWNER_FREE').map(([plan, info]) => (
            <article key={plan} style={{ ...styles.card, borderColor: current?.plan === plan ? '#1d4ed8' : '#e5e7eb' }}>
              <div style={styles.plan}>{plan}</div>
              <div style={styles.price}>USD {info.price}<span style={styles.month}>/mes</span></div>
              <ul style={styles.list}>
                <li>{info.publications} {t('included_publications', 'publicaciones incluidas')}</li>
                <li>{info.premiumSlots} {t('premium_spots', 'destacados premium')}</li>
                <li>{info.analytics ? t('analytics_metrics', 'Analytics y métricas') : t('no_advanced_analytics', 'Sin analytics avanzadas')}</li>
                <li>{plan === 'BUSINESS' ? t('company_panel_campaigns', 'Panel empresa + campañas') : t('standard_operation', 'Operación estándar')}</li>
              </ul>
              <button onClick={() => choosePlan(plan)} disabled={saving === plan} style={styles.button}>
                {saving === plan ? t('saving', 'Guardando...') : current?.plan === plan ? t('active_plan', 'Plan activo') : t('choose_plan', 'Elegir plan')}
              </button>
            </article>
          ))}
        </section>
      </main>
      <FooterBlueBar />
    </div>
  );
}

export default function PlanesPage() {
  return <RouteGuard><PlansInner /></RouteGuard>;
}

const styles = {
  page:{background:'#f5f7fb',minHeight:'100vh',fontFamily:'Arial, sans-serif'},
  wrap:{maxWidth:1260,margin:'0 auto',padding:'28px 16px 48px'},
  hero:{display:'flex',justifyContent:'space-between',gap:20,alignItems:'end',marginBottom:24,flexWrap:'wrap'},
  kicker:{fontSize:12,fontWeight:900,letterSpacing:'.14em',color:'#1d4ed8'},
  title:{fontSize:48,margin:'8px 0 10px 0',maxWidth:760},
  subtitle:{margin:0,maxWidth:760,fontSize:18,color:'#6b7280',lineHeight:1.6},
  currentBox:{background:'#fff',border:'1px solid #dbeafe',borderRadius:14,padding:'14px 16px',fontWeight:800},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18},
  card:{background:'#fff',border:'2px solid #e5e7eb',borderRadius:20,padding:22,boxShadow:'0 16px 32px rgba(15,23,42,.05)'},
  plan:{fontSize:13,fontWeight:900,color:'#1d4ed8',letterSpacing:'.12em'},
  price:{fontSize:38,fontWeight:900,margin:'8px 0 14px 0'},
  month:{fontSize:15,color:'#6b7280',fontWeight:700},
  list:{paddingLeft:18,color:'#374151',lineHeight:1.8,minHeight:120},
  button:{width:'100%',padding:'14px 16px',borderRadius:12,border:'none',background:'#0f172a',color:'#fff',fontWeight:900,cursor:'pointer'},
  ownerBox:{background:'#ecfeff',border:'1px solid #67e8f9',color:'#155e75',padding:'12px 14px',borderRadius:14,marginBottom:18,fontWeight:700},
};
