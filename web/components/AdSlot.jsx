import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../context/LanguageContext';

const slotStyles = {
  home_top: { minHeight: 210 },
  home_middle: { minHeight: 176 },
  search_sidebar: { minHeight: 360 },
  listing_inline: { minHeight: 190 },
  footer_strip: { minHeight: 132 },
};

const cardHeights = {
  home_top: 178,
  home_middle: 148,
  search_sidebar: 300,
  listing_inline: 156,
  footer_strip: 108,
};

const slotRatios = {
  home_top: 1200 / 220,
  home_middle: 1200 / 180,
  search_sidebar: 320 / 420,
  listing_inline: 1200 / 220,
  footer_strip: 1200 / 140,
};

const slotAspectRatios = {
  home_top: '1200 / 220',
  home_middle: '1200 / 180',
  search_sidebar: '320 / 420',
  listing_inline: '1200 / 220',
  footer_strip: '1200 / 140',
};

function normalizeId(value) {
  const id = String(value || '').trim();
  if (!id || id.startsWith('house-')) return '';
  return id;
}

function getTrackKey(adId, eventType, slot, page) {
  return ['ccad', eventType, adId, slot || 'slot', page || 'page'].join(':');
}

function localizedCta(value, t) {
  const raw = String(value || '').trim();
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!raw || normalized === 'ver mas' || normalized === 'see more') return t('ads_see_more', 'Ver más');
  return raw;
}

function localizedPlan(value, t) {
  const raw = String(value || '').trim();
  const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!raw) return '';
  if (normalized.includes('basico') || normalized.includes('basic')) return t('premium_plan_basic', 'Básico');
  if (normalized.includes('destacado') || normalized.includes('featured')) return t('plan_featured', 'Destacado');
  if (normalized.includes('premium')) return t('premium_plan_premium', 'Premium');
  return raw;
}

async function sendTrack(payload) {
  const raw = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([raw], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/ads/track', blob);
      if (ok) return true;
    }
  } catch {}

  try {
    const res = await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function trackAdEvent(ad, eventType, slot, page, oncePerSession = false) {
  const campaignId = normalizeId(ad?.id);
  if (!campaignId) return;

  const key = getTrackKey(campaignId, eventType, slot, page);
  if (oncePerSession && typeof sessionStorage !== 'undefined') {
    try {
      if (sessionStorage.getItem(key) === '1') return;
    } catch {}
  }

  const ok = await sendTrack({ campaignId, eventType, slot, page });

  if (ok && oncePerSession && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(key, '1');
    } catch {}
  }
}

export default function AdSlot({ slot = 'home_middle', page = '', title = 'Publicidad', compact = false }) {
  const { t } = useLang();
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const [fitMode, setFitMode] = useState('contain');
  const rootRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/ads?slot=${encodeURIComponent(slot)}${page ? `&page=${encodeURIComponent(page)}` : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setAds(Array.isArray(d) ? d : []);
        setIndex(0);
      })
      .catch(() => {
        if (!mounted) return;
        setAds([]);
        setIndex(0);
      });
    return () => {
      mounted = false;
    };
  }, [slot, page]);

  useEffect(() => {
    if (ads.length <= 1) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % ads.length), 4500);
    return () => clearInterval(timer);
  }, [ads.length]);

  const ad = useMemo(() => ads[index] || null, [ads, index]);

  useEffect(() => {
    const element = rootRef.current;
    const campaignId = normalizeId(ad?.id);
    if (!element || !campaignId) return undefined;

    let sent = false;
    const sendImpression = () => {
      if (sent) return;
      sent = true;
      trackAdEvent(ad, 'impression', slot, page, true);
    };

    if (typeof IntersectionObserver === 'undefined') {
      sendImpression();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          sendImpression();
          observer.disconnect();
        }
      },
      { threshold: [0.45] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ad, slot, page]);

  const safeTitle = title || t('ads_title_short', 'Publicidad');
  const isSidebar = slot === 'search_sidebar';
  const isWide = ['home_top', 'home_middle', 'listing_inline', 'footer_strip'].includes(slot);
  const cardHeight = compact
    ? Math.max(118, Math.round((cardHeights[slot] || 140) * 0.82))
    : cardHeights[slot] || 140;

  if (!ad) {
    return (
      <section ref={rootRef} className={`adslot ${compact ? 'compact' : ''} ${isSidebar ? 'sidebar' : ''} ${isWide ? 'wide' : ''}`} style={{ ...styles.wrap, ...slotStyles[slot], ...(compact ? styles.compact : null) }}>
        <div style={styles.headRow}>
          <div style={styles.label}>{safeTitle}</div>
          <Link href="/publicidad" style={styles.reserveLink}>{t('ads_reserve_space', 'Reservar este espacio')}</Link>
        </div>
        <Link href="/publicidad" style={{ ...styles.emptyCard, height: cardHeight }}>
          <strong>{t('ads_title_short', 'Publicidad')}</strong>
          <span>{t('ads_reserve_space', 'Reservar este espacio')}</span>
        </Link>
      </section>
    );
  }

  const showOverlay = false;
  const imageSrc = ad.banner_url || '/casa-car-logo.png';
  const cardStyle = {
    ...styles.card,
    ...(slotAspectRatios[slot] ? { aspectRatio: slotAspectRatios[slot], height: 'auto' } : { height: cardHeight }),
    ...(isSidebar ? styles.cardSidebar : null),
  };
  const handleImageLoad = (event) => {
    const expected = slotRatios[slot];
    const width = event.currentTarget?.naturalWidth || 0;
    const height = event.currentTarget?.naturalHeight || 0;
    if (!expected || !width || !height) {
      setFitMode('contain');
      return;
    }
    const ratio = width / height;
    const drift = Math.abs(ratio - expected) / expected;
    setFitMode(drift <= 0.08 ? 'cover' : 'contain');
  };

  return (
    <section ref={rootRef} className={`adslot ${compact ? 'compact' : ''} ${isSidebar ? 'sidebar' : ''} ${isWide ? 'wide' : ''}`} style={{ ...styles.wrap, ...slotStyles[slot], ...(compact ? styles.compact : null) }}>
      <div style={styles.headRow}>
        <div style={styles.label}>{safeTitle}</div>
        <Link href="/publicidad" style={styles.reserveLink}>{t('ads_reserve_space', 'Reservar este espacio')}</Link>
      </div>
      <a
        href={ad.destination_url || '/publicidad'}
        target="_blank"
        rel="noreferrer"
        style={cardStyle}
        onClick={() => trackAdEvent(ad, 'click', slot, page, false)}
      >
        <div
          style={{
            ...styles.mediaWrap,
            ...(isSidebar ? styles.mediaWrapSidebar : null),
            ...(isWide ? styles.mediaWrapWide : null),
          }}
        >
          <img src={imageSrc} alt="" aria-hidden="true" style={styles.imageBlur} />
          <img
            src={imageSrc}
            alt={ad.title || ad.company_name || t('ads_title_short', 'Publicidad')}
            style={{ ...styles.imageSmart, ...(isWide ? styles.imageSmartWide : null), ...(isSidebar ? styles.imageSmartSidebar : null), objectFit: fitMode }}
            onLoad={handleImageLoad}
          />
        </div>
        {showOverlay ? (
          <div className="adslot-overlay" style={{ ...styles.overlay, ...(isSidebar ? styles.overlaySidebar : null), ...(isWide ? styles.overlayWide : null) }}>
            <div>
              <div style={styles.plan}>{localizedPlan(ad.plan_name || ad.plan_key, t).toUpperCase()}</div>
              <h3 className="adslot-title" style={styles.adTitle}>{ad.title}</h3>
              <p style={styles.adText}>{ad.company_name}</p>
            </div>
            <span style={styles.cta}>{localizedCta(ad.cta_text, t)}</span>
          </div>
        ) : null}
      </a>

      <style jsx>{`
        @media (max-width: 768px) {
          .adslot.compact {
            min-height: auto !important;
          }
          .adslot-overlay {
            padding: 14px !important;
            gap: 10px !important;
          }
          .adslot-title {
            font-size: 18px !important;
          }
          .adslot.sidebar .adslot-overlay {
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  wrap: {
    background: '#fff',
    border: '1px solid #dbeafe',
    borderRadius: 22,
    padding: 14,
    boxShadow: '0 16px 36px rgba(15,23,42,.08)',
  },
  compact: { padding: 10, borderRadius: 18 },
  headRow: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  label: { fontSize: 12, fontWeight: 900, letterSpacing: '.08em', color: '#2563eb' },
  reserveLink: { fontSize: 12, fontWeight: 800, color: '#0f172a', textDecoration: 'none' },
  card: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr)',
    gap: 0,
    textDecoration: 'none',
    color: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 120,
    background: 'linear-gradient(135deg,#0f172a,#1d4ed8)',
  },
  mediaWrap: {
    position: 'absolute',
    inset: 0,
    opacity: 1,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    padding: 0,
    background: '#09111f',
  },
  mediaWrapWide: { background: 'linear-gradient(135deg,#07111f,#15306f)' },
  mediaWrapSidebar: { background: 'linear-gradient(180deg,#07111f,#15306f)' },
  imageBlur: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
    filter: 'blur(18px)',
    transform: 'scale(1.14)',
    opacity: 0.45,
  },
  imageSmart: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    boxSizing: 'border-box',
    background: 'transparent',
  },
  imageSmartWide: { objectFit: 'contain' },
  imageSmartSidebar: { objectFit: 'contain' },
  overlay: { position: 'relative', zIndex: 2, minHeight: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', gap: 12, padding: 18, alignItems: 'flex-end', background: 'linear-gradient(180deg,rgba(15,23,42,.10),rgba(15,23,42,.60))' },
  overlayWide: { alignItems: 'stretch', background: 'linear-gradient(90deg,rgba(6,18,38,.55),rgba(6,18,38,.18) 48%, rgba(6,18,38,.08) 72%, rgba(6,18,38,.08))' },
  overlaySidebar: { flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(180deg,rgba(6,18,38,.35),rgba(6,18,38,.50))' },
  plan: { display: 'inline-block', fontSize: 11, fontWeight: 900, padding: '6px 9px', borderRadius: 999, background: 'rgba(255,255,255,.15)', marginBottom: 8 },
  adTitle: { margin: 0, fontSize: 24, lineHeight: 1.05 },
  adText: { margin: '8px 0 0 0', color: 'rgba(255,255,255,.92)', fontWeight: 700 },
  cta: { whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 999, background: '#fff', color: '#0f172a', fontWeight: 900, alignSelf: 'flex-end', boxShadow: '0 8px 20px rgba(15,23,42,.18)' },
  emptyCard: { display: 'grid', placeItems: 'center', alignContent: 'center', gap: 8, textDecoration: 'none', color: '#334155', border: '1px dashed #bfdbfe', borderRadius: 18, background: 'linear-gradient(135deg,#f8fbff,#eff6ff)', fontWeight: 900, textAlign: 'center', padding: 16, boxSizing: 'border-box' },
  cardSidebar: { minHeight: 340 },
};
