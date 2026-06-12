import { useMemo, useState } from 'react';

const VARIANTS = [
  { key: 'impact', label: 'Impacto', tone: 'Azul profundo', align: 'left' },
  { key: 'clean', label: 'Claro', tone: 'Blanco premium', align: 'center' },
  { key: 'lux', label: 'Premium', tone: 'Negro editorial', align: 'right' },
];

function parseDimensions(value = '') {
  const match = String(value || '').match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return { width: 1200, height: 220 };
  return {
    width: Math.max(320, Number(match[1]) || 1200),
    height: Math.max(120, Number(match[2]) || 220),
  };
}

function getInitials(value = '') {
  const parts = String(value || 'Casa-Car').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0] || '').join('').toUpperCase() || 'CC';
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    const suffix = lines.length > maxLines && index === maxLines - 1 ? '...' : '';
    ctx.fillText(`${item}${suffix}`, x, y + index * lineHeight);
  });
}

function fitFont(ctx, text, maxWidth, start, min) {
  let size = start;
  while (size > min) {
    ctx.font = `900 ${size}px Arial, sans-serif`;
    if (ctx.measureText(String(text || '')).width <= maxWidth) return size;
    size -= 2;
  }
  return min;
}

function makeGradient(ctx, width, height, variant) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (variant === 'clean') {
    gradient.addColorStop(0, '#eff6ff');
    gradient.addColorStop(0.55, '#ffffff');
    gradient.addColorStop(1, '#dbeafe');
    return gradient;
  }
  if (variant === 'lux') {
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.55, '#111827');
    gradient.addColorStop(1, '#334155');
    return gradient;
  }
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1d4ed8');
  gradient.addColorStop(1, '#38bdf8');
  return gradient;
}

async function renderCreative({ form, selectedSlot, sourceImage, variantKey }) {
  const { width, height } = parseDimensions(selectedSlot?.dimensions);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const image = await loadImage(sourceImage);
  const isClean = variantKey === 'clean';
  const isLux = variantKey === 'lux';
  const padding = Math.round(Math.max(28, width * 0.045));
  const title = form?.title || form?.company_name || 'Tu marca en Casa-Car';
  const company = form?.company_name || 'Casa-Car Ads';
  const cta = form?.cta_text || 'Ver mas';
  const text = form?.description || 'Publicidad destacada para compradores reales.';

  ctx.fillStyle = makeGradient(ctx, width, height, variantKey);
  ctx.fillRect(0, 0, width, height);

  if (image) {
    drawCover(ctx, image, 0, 0, width, height);
    ctx.fillStyle = isClean ? 'rgba(255,255,255,.72)' : isLux ? 'rgba(2,6,23,.58)' : 'rgba(15,23,42,.50)';
    ctx.fillRect(0, 0, width, height);
  }

  if (!image) {
    ctx.fillStyle = isClean ? '#1d4ed8' : '#ffffff';
    ctx.globalAlpha = isClean ? 0.1 : 0.14;
    ctx.beginPath();
    ctx.arc(width - height * 0.2, height * 0.35, height * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const contentWidth = variantKey === 'clean' ? width - padding * 2 : Math.round(width * 0.58);
  const contentX = variantKey === 'lux' ? width - contentWidth - padding : padding;
  const brandY = padding + 16;
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = isClean ? '#1d4ed8' : 'rgba(255,255,255,.92)';
  ctx.font = `900 ${Math.max(18, Math.round(height * 0.09))}px Arial, sans-serif`;
  ctx.fillText(company.toUpperCase(), contentX, brandY);

  const titleSize = fitFont(ctx, title, contentWidth, Math.max(38, Math.round(height * 0.28)), 24);
  ctx.font = `900 ${titleSize}px Arial, sans-serif`;
  ctx.fillStyle = isClean ? '#0f172a' : '#ffffff';
  drawWrappedText(ctx, title, contentX, brandY + titleSize + 14, contentWidth, Math.round(titleSize * 1.08), 2);

  ctx.font = `700 ${Math.max(17, Math.round(height * 0.09))}px Arial, sans-serif`;
  ctx.fillStyle = isClean ? '#334155' : 'rgba(255,255,255,.88)';
  drawWrappedText(ctx, text, contentX, height - padding - 18, contentWidth, Math.max(22, Math.round(height * 0.11)), 2);

  const chipText = cta.toUpperCase();
  ctx.font = `900 ${Math.max(16, Math.round(height * 0.09))}px Arial, sans-serif`;
  const chipWidth = Math.min(width - padding * 2, Math.max(150, ctx.measureText(chipText).width + 48));
  const chipHeight = Math.max(42, Math.round(height * 0.22));
  const chipX = variantKey === 'lux' ? width - padding - chipWidth : padding;
  const chipY = height - padding - chipHeight;
  ctx.fillStyle = isClean ? '#0f172a' : '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(chipX, chipY, chipWidth, chipHeight, chipHeight / 2);
  else ctx.rect(chipX, chipY, chipWidth, chipHeight);
  ctx.fill();
  ctx.fillStyle = isClean ? '#ffffff' : '#0f172a';
  ctx.fillText(chipText, chipX + 24, chipY + chipHeight / 2 + Math.max(6, Math.round(height * 0.03)));

  if (!image) {
    const badgeSize = Math.max(72, Math.round(height * 0.42));
    const badgeX = variantKey === 'lux' ? padding : width - padding - badgeSize;
    const badgeY = Math.round((height - badgeSize) / 2);
    ctx.fillStyle = isClean ? '#dbeafe' : 'rgba(255,255,255,.18)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 22);
    else ctx.rect(badgeX, badgeY, badgeSize, badgeSize);
    ctx.fill();
    ctx.fillStyle = isClean ? '#1d4ed8' : '#ffffff';
    ctx.font = `900 ${Math.round(badgeSize * 0.38)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(getInitials(company), badgeX + badgeSize / 2, badgeY + badgeSize / 2 + Math.round(badgeSize * 0.13));
    ctx.textAlign = 'left';
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('No se pudo generar el banner'));
      const file = new File([blob], `casa-car-banner-ia-${Date.now()}.png`, { type: 'image/png' });
      resolve({ file, previewUrl: canvas.toDataURL('image/png'), width, height });
    }, 'image/png', 0.92);
  });
}

function variantStyle(variant, sourceImage) {
  const dark = variant.key !== 'clean';
  return {
    ...styles.variantPreview,
    color: dark ? '#fff' : '#0f172a',
    background: sourceImage
      ? `${dark ? 'linear-gradient(90deg,rgba(2,6,23,.72),rgba(2,6,23,.14))' : 'linear-gradient(90deg,rgba(255,255,255,.84),rgba(255,255,255,.32))'}, url(${sourceImage}) center/cover`
      : variant.key === 'clean'
        ? 'linear-gradient(135deg,#eff6ff,#fff,#dbeafe)'
        : variant.key === 'lux'
          ? 'linear-gradient(135deg,#020617,#111827,#334155)'
          : 'linear-gradient(135deg,#0f172a,#1d4ed8,#38bdf8)',
  };
}

export default function AdCreativeStudio({ form, selectedSlot, sourceImage, onUseBanner }) {
  const [selected, setSelected] = useState('impact');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const dimensions = useMemo(() => parseDimensions(selectedSlot?.dimensions), [selectedSlot?.dimensions]);
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;
  const activeVariant = VARIANTS.find((item) => item.key === selected) || VARIANTS[0];

  async function useVariant() {
    setGenerating(true);
    setError('');
    try {
      const output = await renderCreative({ form, selectedSlot, sourceImage, variantKey: activeVariant.key });
      onUseBanner?.({ ...output, variant: activeVariant });
    } catch (err) {
      setError(err.message || 'No se pudo generar el banner');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>IA CREATIVA</div>
          <h3 style={styles.title}>Banners automaticos para el anunciante</h3>
        </div>
        <div style={styles.size}>{dimensions.width}x{dimensions.height}</div>
      </div>

      <div style={styles.variantGrid}>
        {VARIANTS.map((variant) => (
          <button
            key={variant.key}
            type="button"
            onClick={() => setSelected(variant.key)}
            style={{ ...styles.variantButton, ...(selected === variant.key ? styles.variantButtonActive : null) }}
          >
            <div style={{ ...variantStyle(variant, sourceImage), aspectRatio }}>
              <span style={styles.brand}>{form?.company_name || 'Casa-Car Ads'}</span>
              <strong style={styles.previewTitle}>{form?.title || 'Tu banner listo'}</strong>
              <span style={styles.previewCta}>{form?.cta_text || 'Ver mas'}</span>
            </div>
            <span style={styles.variantMeta}>{variant.label} · {variant.tone}</span>
          </button>
        ))}
      </div>

      <div style={styles.footer}>
        <button type="button" onClick={useVariant} disabled={generating} style={styles.useButton}>
          {generating ? 'Generando...' : 'Usar diseno IA'}
        </button>
        {error ? <span style={styles.error}>{error}</span> : <span style={styles.hint}>Se genera como imagen PNG antes de subir la campania.</span>}
      </div>
    </section>
  );
}

const styles = {
  wrap: { display: 'grid', gap: 12, border: '1px solid #bfdbfe', background: '#f8fbff', borderRadius: 18, padding: 14 },
  header: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  kicker: { color: '#1d4ed8', fontSize: 12, fontWeight: 900, letterSpacing: '.08em' },
  title: { margin: '4px 0 0 0', color: '#0f172a', fontSize: 20, lineHeight: 1.15 },
  size: { border: '1px solid #dbeafe', background: '#fff', color: '#1d4ed8', borderRadius: 999, padding: '7px 10px', fontWeight: 900, fontSize: 12 },
  variantGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 },
  variantButton: { border: '1px solid #dbeafe', background: '#fff', borderRadius: 14, padding: 8, cursor: 'pointer', display: 'grid', gap: 8, textAlign: 'left' },
  variantButtonActive: { borderColor: '#1d4ed8', boxShadow: '0 0 0 3px rgba(29,78,216,.12)' },
  variantPreview: { borderRadius: 10, overflow: 'hidden', padding: 12, display: 'grid', alignContent: 'space-between', minHeight: 92, boxSizing: 'border-box' },
  brand: { fontSize: 10, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewTitle: { fontSize: 18, lineHeight: 1.05, maxWidth: '80%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  previewCta: { justifySelf: 'start', borderRadius: 999, background: '#fff', color: '#0f172a', padding: '6px 9px', fontSize: 11, fontWeight: 900 },
  variantMeta: { color: '#334155', fontSize: 12, fontWeight: 800 },
  footer: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  useButton: { border: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 12, padding: '11px 14px', fontWeight: 900, cursor: 'pointer' },
  hint: { color: '#64748b', fontSize: 12, fontWeight: 700 },
  error: { color: '#be123c', fontSize: 12, fontWeight: 800 },
};
