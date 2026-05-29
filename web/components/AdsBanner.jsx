import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';

export default function AdsBanner({ slot = 'home_middle', title = '' }) {
  const { t } = useLang();
  const [ad, setAd] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ads/active?slot=${encodeURIComponent(slot)}`)
      .then((r) => r.json())
      .then((payload) => {
        if (!alive) return;
        const first = Array.isArray(payload?.ads) ? payload.ads[0] : null;
        setAd(first || null);
      })
      .catch(() => { if (alive) setAd(null); });
    return () => { alive = false; };
  }, [slot]);

  if (!ad) return null;

  async function handleClick(event) {
    if (!ad?.id || String(ad.id).startsWith('house-')) return;
    try {
      navigator.sendBeacon?.('/api/ads/track-click', new Blob([JSON.stringify({ campaignId: ad.id })], { type: 'application/json' }));
    } catch (_) {
      try {
        fetch('/api/ads/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: ad.id }),
          keepalive: true,
        });
      } catch (_) {}
    }
  }

  const isSidebar = slot === 'search_sidebar';
  const isWide = ['home_top','home_middle','listing_inline','footer_strip'].includes(slot);

  return (
    <a href={ad.destination_url || '/publicidad'} onClick={handleClick} style={styles.wrap} target="_blank" rel="noreferrer">
      <div style={{ ...styles.media, ...(isSidebar ? styles.mediaSidebar : null), ...(isWide ? styles.mediaWide : null) }}>
        <img src={ad.image} alt={ad.title || title || t('ads_title_short', 'Publicidad Casa-Car')} style={{ ...styles.image, ...(isWide ? styles.imageContain : null), ...(isSidebar ? styles.imageContain : null) }} />
      </div>
      <div style={styles.meta}>
        <div style={styles.row}>
          <span style={styles.badge}>{t('nav_ads', 'Publicidad')}</span>
          {ad.plan_key ? <span style={styles.plan}>{String(ad.plan_key).toUpperCase()}</span> : null}
        </div>
        <strong style={styles.headline}>{ad.title}</strong>
        <span style={styles.company}>{ad.company_name || 'Casa-Car Ads'}</span>
      </div>
    </a>
  );
}

const styles = {
  wrap: { display:'grid', gridTemplateColumns:'1fr', gap:10, margin:'20px 0', textAlign:'left', textDecoration:'none', background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', boxShadow:'0 12px 24px rgba(15,23,42,.06)' },
  media: { background:'linear-gradient(135deg,#0f172a,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', padding:0, borderBottom:'1px solid rgba(255,255,255,.05)' },
  mediaWide:{ minHeight:170 },
  mediaSidebar:{ minHeight:260 },
  image: { width:'100%', maxHeight:240, objectFit:'cover', objectPosition:'center', display:'block', background:'transparent' },
  imageContain:{ objectFit:'contain', maxHeight:'none', height:'100%' },
  meta: { padding:'12px 14px', display:'grid', gap:6 },
  row: { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  badge: { display:'inline-block', width:'fit-content', padding:'4px 8px', borderRadius:999, background:'#ede9fe', color:'#6d28d9', fontWeight:800, fontSize:12 },
  plan: { display:'inline-block', width:'fit-content', padding:'4px 8px', borderRadius:999, background:'#111827', color:'#fff', fontWeight:800, fontSize:12 },
  headline: { color:'#111827' },
  company: { color:'#6b7280', fontSize:13 },
};
