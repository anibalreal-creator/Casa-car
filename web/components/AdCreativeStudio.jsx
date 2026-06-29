import { useEffect, useMemo, useState } from 'react';

const ADAPT_VARIANT = {
  key: 'complete',
  label: 'Original adaptado',
  tone: 'sin cortar',
  type: 'adapt',
  mode: 'contain',
};

const WIDE_VARIANTS = [
  ADAPT_VARIANT,
  { key: 'brand-clean', label: 'Marca clara', tone: 'logo + mensaje', type: 'generated', layout: 'splitLight' },
  { key: 'impact-blue', label: 'Impacto azul', tone: 'fuerte y comercial', type: 'generated', layout: 'impactBlue' },
  { key: 'editorial-dark', label: 'Premium oscuro', tone: 'sobrio y elegante', type: 'generated', layout: 'editorialDark' },
];

const VERTICAL_VARIANTS = [
  ADAPT_VARIANT,
  { key: 'vertical-impact', label: 'Vertical impacto', tone: 'marca protagonista', type: 'generated', layout: 'verticalImpact' },
  { key: 'vertical-clean', label: 'Vertical claro', tone: 'datos legibles', type: 'generated', layout: 'verticalClean' },
];

function parseDimensions(value = '') {
  const match = String(value || '').match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return { width: 1200, height: 220 };
  return {
    width: Math.max(320, Number(match[1]) || 1200),
    height: Math.max(120, Number(match[2]) || 220),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function drawCover(ctx, image, width, height, focusX = 0.5, focusY = 0.5) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const sourceX = clamp((image.width - cropWidth) * focusX, 0, Math.max(0, image.width - cropWidth));
  const sourceY = clamp((image.height - cropHeight) * focusY, 0, Math.max(0, image.height - cropHeight));
  ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height);
}

function drawContain(ctx, image, width, height) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.filter = 'blur(18px) saturate(1.05)';
  drawCover(ctx, image, width, height);
  ctx.restore();

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = Math.round(image.width * scale);
  const drawHeight = Math.round(image.height * scale);
  const x = Math.round((width - drawWidth) / 2);
  const y = Math.round((height - drawHeight) / 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, drawWidth, drawHeight);
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawImagePanel(ctx, image, x, y, width, height, radius, background = '#eff6ff') {
  fillRoundRect(ctx, x, y, width, height, radius, background);
  if (!image) return;

  ctx.save();
  roundedPath(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.globalAlpha = 0.2;
  ctx.filter = 'blur(14px) saturate(1.08)';
  const scaleCover = Math.max(width / image.width, height / image.height);
  const coverW = image.width * scaleCover;
  const coverH = image.height * scaleCover;
  ctx.drawImage(image, x + (width - coverW) / 2, y + (height - coverH) / 2, coverW, coverH);
  ctx.restore();

  ctx.save();
  roundedPath(ctx, x + 8, y + 8, width - 16, height - 16, Math.max(8, radius - 6));
  ctx.clip();
  const pad = Math.max(10, Math.min(width, height) * 0.08);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const scale = Math.min(innerW / image.width, innerH / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  ctx.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
  ctx.restore();
}

function normalizeText(value, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function clipText(value, max = 70) {
  const text = normalizeText(value, '');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function getCopy(form = {}) {
  const company = normalizeText(form.company_name, 'Tu empresa');
  const title = normalizeText(form.title, company);
  const description = normalizeText(form.description, 'Anuncio destacado en Casa-Car');
  const cta = normalizeText(form.cta_text, 'Ver mas');
  const contact = normalizeText(form.contact_name || form.contact_email, '');
  return {
    company: clipText(company, 36),
    title: clipText(title, 62),
    description: clipText(description, 105),
    cta: clipText(cta, 18),
    contact: clipText(contact, 36),
  };
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = normalizeText(text, '').split(' ').filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
      return;
    }
    lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible[visible.length - 1];
    while (last.length > 4 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1).trim();
    }
    visible[visible.length - 1] = `${last}...`;
  }

  visible.forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
  return y + visible.length * lineHeight;
}

function drawPill(ctx, text, x, y, width, height, fill, color, fontSize) {
  fillRoundRect(ctx, x, y, width, height, height / 2, fill);
  ctx.fillStyle = color;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + height * 0.55, y + height / 2 + 1);
}

function drawWideCreative(ctx, image, width, height, variant, copy) {
  const pad = Math.max(22, Math.round(height * 0.16));
  const isShort = height <= 150;
  const titleSize = isShort ? Math.max(30, Math.round(height * 0.27)) : Math.max(42, Math.round(height * 0.22));
  const bodySize = isShort ? Math.max(16, Math.round(height * 0.13)) : Math.max(19, Math.round(height * 0.1));
  const ctaH = isShort ? 38 : 46;

  if (variant.layout === 'splitLight') {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.58, '#f8fbff');
    bg.addColorStop(1, '#dbeafe');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const imageW = Math.min(width * 0.34, height * 2.3);
    drawImagePanel(ctx, image, pad, pad, imageW, height - pad * 2, 22, '#eaf2ff');

    const textX = pad + imageW + pad;
    const textW = width - textX - pad - 160;
    drawPill(ctx, copy.company.toUpperCase(), textX, pad, Math.min(270, Math.max(150, ctx.measureText(copy.company).width + 76)), isShort ? 32 : 38, '#dbeafe', '#1d4ed8', isShort ? 14 : 16);
    ctx.fillStyle = '#0f172a';
    ctx.font = `900 ${titleSize}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, copy.title, textX, pad + (isShort ? 42 : 54), Math.max(220, textW), titleSize * 1.04, isShort ? 1 : 2);
    ctx.fillStyle = '#475569';
    ctx.font = `700 ${bodySize}px Arial, sans-serif`;
    drawWrappedText(ctx, copy.description, textX, height - pad - bodySize - 4, Math.max(220, textW), bodySize * 1.2, 1);
    drawPill(ctx, copy.cta, width - pad - 136, height - pad - ctaH, 136, ctaH, '#0f172a', '#ffffff', isShort ? 17 : 18);
    return;
  }

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, variant.layout === 'editorialDark' ? '#080f1f' : '#061226');
  bg.addColorStop(0.55, '#183a8a');
  bg.addColorStop(1, '#2563eb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(height * 0.78)}px Arial, sans-serif`;
  ctx.fillText('CASA-CAR', pad, Math.round(height * 0.72));
  ctx.restore();

  const imageW = Math.min(width * 0.28, height * 2.1);
  const imageX = width - pad - imageW;
  drawImagePanel(ctx, image, imageX, pad, imageW, height - pad * 2, 24, 'rgba(255,255,255,.14)');

  const textW = imageX - pad * 2;
  drawPill(ctx, copy.company.toUpperCase(), pad, pad, Math.min(290, Math.max(160, copy.company.length * 12 + 70)), isShort ? 32 : 38, 'rgba(255,255,255,.92)', '#0f172a', isShort ? 14 : 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${titleSize}px Arial, sans-serif`;
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, copy.title, pad, pad + (isShort ? 42 : 56), textW, titleSize * 1.04, isShort ? 1 : 2);
  ctx.fillStyle = '#dbeafe';
  ctx.font = `700 ${bodySize}px Arial, sans-serif`;
  const bodyY = height - pad - bodySize - 5;
  drawWrappedText(ctx, copy.contact || copy.description, pad, bodyY, textW - 150, bodySize * 1.2, 1);
  drawPill(ctx, copy.cta, imageX - 150, height - pad - ctaH, 132, ctaH, '#ffffff', '#0f172a', isShort ? 17 : 18);
}

function drawVerticalCreative(ctx, image, width, height, variant, copy) {
  const pad = 24;
  const dark = variant.layout === 'verticalImpact';
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, dark ? '#061226' : '#ffffff');
  bg.addColorStop(0.58, dark ? '#183a8a' : '#f8fbff');
  bg.addColorStop(1, dark ? '#2563eb' : '#dbeafe');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (dark) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px Arial, sans-serif';
    ctx.fillText('CASA', 20, 92);
    ctx.restore();
  }

  drawImagePanel(ctx, image, pad, pad, width - pad * 2, 116, 22, dark ? 'rgba(255,255,255,.14)' : '#eef6ff');

  drawPill(ctx, copy.company.toUpperCase(), pad, 158, width - pad * 2, 36, dark ? 'rgba(255,255,255,.92)' : '#dbeafe', dark ? '#0f172a' : '#1d4ed8', 14);

  ctx.fillStyle = dark ? '#ffffff' : '#0f172a';
  ctx.font = '900 31px Arial, sans-serif';
  ctx.textBaseline = 'top';
  drawWrappedText(ctx, copy.title, pad, 214, width - pad * 2, 34, 3);

  ctx.fillStyle = dark ? '#dbeafe' : '#475569';
  ctx.font = '700 16px Arial, sans-serif';
  drawWrappedText(ctx, copy.description, pad, 322, width - pad * 2, 20, 2);

  drawPill(ctx, copy.cta, pad, height - 58, width - pad * 2, 42, dark ? '#ffffff' : '#0f172a', dark ? '#0f172a' : '#ffffff', 18);
}

function drawGenerated(ctx, image, width, height, variant, form) {
  const copy = getCopy(form);
  const ratio = width / height;
  if (ratio < 1.15) {
    drawVerticalCreative(ctx, image, width, height, variant, copy);
    return;
  }
  drawWideCreative(ctx, image, width, height, variant, copy);
}

function getVariantsForDimensions(dimensions) {
  const ratio = dimensions.width / dimensions.height;
  return ratio < 1.15 ? VERTICAL_VARIANTS : WIDE_VARIANTS;
}

function canvasToOutput(canvas, variantKey) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar el banner'));
          return;
        }
        let previewUrl = '';
        try {
          previewUrl = canvas.toDataURL('image/png');
        } catch {
          reject(new Error('No se pudo adaptar esta imagen'));
          return;
        }
        const file = new File([blob], `casa-car-banner-${variantKey}-${Date.now()}.png`, { type: 'image/png' });
        resolve({ file, previewUrl, width: canvas.width, height: canvas.height });
      }, 'image/png', 0.96);
    } catch {
      reject(new Error('No se pudo adaptar esta imagen'));
    }
  });
}

async function renderCreative({ selectedSlot, sourceImage, variant, form }) {
  if (!sourceImage) throw new Error('Subi una imagen original para crear el banner');

  const { width, height } = parseDimensions(selectedSlot?.dimensions);
  const image = await loadImage(sourceImage);
  if (!image) throw new Error('No se pudo leer la imagen original');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (variant.type === 'adapt') {
    drawContain(ctx, image, width, height);
  } else {
    drawGenerated(ctx, image, width, height, variant, form);
  }

  return canvasToOutput(canvas, variant.key);
}

export default function AdCreativeStudio({ selectedSlot, sourceImage, form = {}, onUseBanner }) {
  const [selected, setSelected] = useState('brand-clean');
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const dimensions = useMemo(() => parseDimensions(selectedSlot?.dimensions), [selectedSlot?.dimensions]);
  const variants = useMemo(() => getVariantsForDimensions(dimensions), [dimensions.width, dimensions.height]);
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;
  const activeVariant = variants.find((item) => item.key === selected) || variants[0];
  const formKey = [
    form.company_name,
    form.title,
    form.description,
    form.cta_text,
    form.contact_name,
    form.contact_email,
  ].map((value) => String(value || '')).join('|');

  useEffect(() => {
    if (!variants.some((variant) => variant.key === selected)) {
      setSelected(variants.find((item) => item.type === 'generated')?.key || variants[0]?.key || 'complete');
    }
  }, [selected, variants]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setPreviews({});

    if (!sourceImage) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    Promise.all(
      variants.map(async (variant) => {
        try {
          const output = await renderCreative({ selectedSlot, sourceImage, variant, form });
          return [variant.key, { ...output, variant }];
        } catch (err) {
          return [variant.key, { error: err.message || 'No se pudo generar', variant }];
        }
      })
    ).then((items) => {
      if (cancelled) return;
      setPreviews(Object.fromEntries(items));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSlot?.dimensions, sourceImage, variants, formKey]);

  async function useVariant() {
    setGenerating(true);
    setError('');
    try {
      const cached = previews[selected];
      const output = cached?.file
        ? cached
        : await renderCreative({ selectedSlot, sourceImage, variant: activeVariant, form });
      if (!output?.file) throw new Error(output?.error || 'No se pudo generar el banner');
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
          <h3 style={styles.title}>Generar banners para elegir</h3>
        </div>
        <div style={styles.size}>{dimensions.width}x{dimensions.height}</div>
      </div>

      <div style={styles.intro}>
        La IA usa la imagen subida como marca/base y los datos de la campania para crear opciones listas para el slot.
      </div>

      <div style={styles.variantGrid}>
        {variants.map((variant) => {
          const preview = previews[variant.key];
          return (
            <button
              key={variant.key}
              type="button"
              onClick={() => setSelected(variant.key)}
              style={{ ...styles.variantButton, ...(selected === variant.key ? styles.variantButtonActive : null) }}
            >
              <div style={{ ...styles.variantPreview, aspectRatio }}>
                {preview?.previewUrl ? (
                  <img src={preview.previewUrl} alt="" style={styles.previewImage} />
                ) : (
                  <div style={styles.placeholder}>{sourceImage ? 'Generando...' : 'Subi imagen'}</div>
                )}
              </div>
              <span style={styles.variantMeta}>{variant.label} - {variant.tone}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.footer}>
        <button type="button" onClick={useVariant} disabled={generating || loading || !sourceImage} style={styles.useButton}>
          {generating ? 'Generando...' : 'Usar diseno elegido'}
        </button>
        {error ? <span style={styles.error}>{error}</span> : <span style={styles.hint}>Genera PNG final completo, sin cortar texto ni logos.</span>}
      </div>
    </section>
  );
}

const styles = {
  wrap: { display: 'grid', gap: 12, border: '1px solid #bfdbfe', background: '#f8fbff', borderRadius: 18, padding: 14, minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', minWidth: 0 },
  kicker: { color: '#1d4ed8', fontSize: 12, fontWeight: 900, letterSpacing: '.08em' },
  title: { margin: '4px 0 0 0', color: '#0f172a', fontSize: 20, lineHeight: 1.15, overflowWrap: 'break-word' },
  intro: { color: '#475569', fontSize: 13, lineHeight: 1.45, fontWeight: 700 },
  size: { border: '1px solid #dbeafe', background: '#fff', color: '#1d4ed8', borderRadius: 999, padding: '7px 10px', fontWeight: 900, fontSize: 12 },
  variantGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 10, minWidth: 0 },
  variantButton: { border: '1px solid #dbeafe', background: '#fff', borderRadius: 14, padding: 8, cursor: 'pointer', display: 'grid', gap: 8, textAlign: 'left', minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  variantButtonActive: { borderColor: '#1d4ed8', boxShadow: '0 0 0 3px rgba(29,78,216,.12)' },
  variantPreview: { borderRadius: 10, overflow: 'hidden', display: 'grid', placeItems: 'center', minHeight: 0, boxSizing: 'border-box', background: '#eff6ff' },
  previewImage: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  placeholder: { color: '#64748b', fontWeight: 900, fontSize: 12 },
  variantMeta: { color: '#334155', fontSize: 12, fontWeight: 800 },
  footer: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', minWidth: 0 },
  useButton: { border: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 12, padding: '11px 14px', fontWeight: 900, cursor: 'pointer', maxWidth: '100%' },
  hint: { color: '#64748b', fontSize: 12, fontWeight: 700 },
  error: { color: '#be123c', fontSize: 12, fontWeight: 800 },
};
