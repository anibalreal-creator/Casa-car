import { useEffect, useMemo, useState } from 'react';

const ADAPT_VARIANT = {
  key: 'complete',
  label: 'Original lleno',
  tone: 'sin espacios',
  type: 'adapt',
  mode: 'cover',
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
  drawCoverAt(ctx, image, 0, 0, width, height, focusX, focusY);
}

function drawCoverAt(ctx, image, x, y, width, height, focusX = 0.5, focusY = 0.5) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const sourceX = clamp((image.width - cropWidth) * focusX, 0, Math.max(0, image.width - cropWidth));
  const sourceY = clamp((image.height - cropHeight) * focusY, 0, Math.max(0, image.height - cropHeight));
  ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, x, y, width, height);
}

function drawContainAt(ctx, image, x, y, width, height, padding = 0) {
  const innerW = Math.max(1, width - padding * 2);
  const innerH = Math.max(1, height - padding * 2);
  const scale = Math.min(innerW / image.width, innerH / image.height);
  const drawWidth = Math.round(image.width * scale);
  const drawHeight = Math.round(image.height * scale);
  const drawX = Math.round(x + (width - drawWidth) / 2);
  const drawY = Math.round(y + (height - drawHeight) / 2);
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
}

function drawFullBleedOriginal(ctx, image, width, height) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  drawCover(ctx, image, width, height);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function mixColor(hex, targetHex, amount = 0.5) {
  const parse = (value) => {
    const clean = String(value || '').replace('#', '');
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };
  const a = parse(hex);
  const b = parse(targetHex);
  return rgbToHex(
    a[0] * (1 - amount) + b[0] * amount,
    a[1] * (1 - amount) + b[1] * amount,
    a[2] * (1 - amount) + b[2] * amount
  );
}

function getImagePalette(image) {
  const fallback = {
    primary: '#2563eb',
    secondary: '#0f172a',
    light: '#eff6ff',
    soft: '#dbeafe',
    dark: '#061226',
  };
  try {
    const sample = document.createElement('canvas');
    sample.width = 24;
    sample.height = 24;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    sampleCtx.drawImage(image, 0, 0, sample.width, sample.height);
    const { data } = sampleCtx.getImageData(0, 0, sample.width, sample.height);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue;
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      if (max > 246 && min > 232) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
    if (!count) return fallback;
    const primary = rgbToHex(r / count, g / count, b / count);
    return {
      primary,
      secondary: mixColor(primary, '#0f172a', 0.72),
      light: mixColor(primary, '#ffffff', 0.84),
      soft: mixColor(primary, '#dbeafe', 0.62),
      dark: mixColor(primary, '#020617', 0.82),
    };
  } catch {
    return fallback;
  }
}

function drawImagePanel(ctx, image, x, y, width, height, radius, background = '#eff6ff', palette = null) {
  fillRoundRect(ctx, x, y, width, height, radius, background);
  if (!image) return;

  ctx.save();
  roundedPath(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.globalAlpha = 0.36;
  ctx.filter = 'blur(12px) saturate(1.08)';
  drawCoverAt(ctx, image, x, y, width, height);
  ctx.restore();

  ctx.save();
  roundedPath(ctx, x, y, width, height, radius);
  ctx.clip();
  const overlay = ctx.createLinearGradient(x, y, x + width, y + height);
  overlay.addColorStop(0, 'rgba(255,255,255,.14)');
  overlay.addColorStop(1, palette?.soft ? `${palette.soft}66` : 'rgba(255,255,255,.22)');
  ctx.fillStyle = overlay;
  ctx.fillRect(x, y, width, height);
  const pad = Math.max(8, Math.min(width, height) * 0.07);
  drawContainAt(ctx, image, x, y, width, height, pad);
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
    let fitted = item;
    while (fitted.length > 4 && ctx.measureText(fitted).width > maxWidth) {
      fitted = fitted.slice(0, -1).trim();
    }
    if (fitted !== item && fitted.length > 4) {
      while (fitted.length > 4 && ctx.measureText(`${fitted}...`).width > maxWidth) {
        fitted = fitted.slice(0, -1).trim();
      }
      fitted = `${fitted}...`;
    }
    ctx.fillText(fitted, x, y + index * lineHeight);
  });
  return y + visible.length * lineHeight;
}

function buildWrappedLines(ctx, text, maxWidth, maxLines) {
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
  return visible;
}

function drawFittedTextBlock(ctx, text, x, y, maxWidth, maxHeight, options = {}) {
  const {
    maxLines = 2,
    initialSize = 36,
    minSize = 18,
    weight = 900,
    color = '#0f172a',
    lineRatio = 1.08,
  } = options;

  let size = initialSize;
  let lines = [];
  let lineHeight = initialSize * lineRatio;

  while (size >= minSize) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    lineHeight = size * lineRatio;
    lines = buildWrappedLines(ctx, text, maxWidth, maxLines);
    if (lines.length * lineHeight <= maxHeight) break;
    size -= 2;
  }

  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.font = `${weight} ${Math.max(size, minSize)}px Arial, sans-serif`;
  lineHeight = Math.max(size, minSize) * lineRatio;
  lines = buildWrappedLines(ctx, text, maxWidth, Math.max(1, Math.min(maxLines, Math.floor(maxHeight / lineHeight))));
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function maxLinesForBox(startY, endY, lineHeight, desiredLines) {
  const available = Math.max(lineHeight, endY - startY);
  return Math.max(1, Math.min(desiredLines, Math.floor(available / lineHeight)));
}

function drawPill(ctx, text, x, y, width, height, fill, color, fontSize) {
  fillRoundRect(ctx, x, y, width, height, height / 2, fill);
  ctx.fillStyle = color;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + height * 0.55, y + height / 2 + 1);
}

function drawWideCreative(ctx, image, width, height, variant, copy, palette) {
  const colors = palette || getImagePalette(image);
  const pad = Math.max(22, Math.round(height * 0.16));
  const isShort = height <= 150;
  const isCompact = height <= 260;
  const titleSize = isShort ? Math.max(30, Math.round(height * 0.27)) : Math.max(42, Math.round(height * 0.22));
  const bodySize = isShort ? Math.max(16, Math.round(height * 0.13)) : Math.max(19, Math.round(height * 0.1));
  const ctaH = isShort ? 38 : 46;

  if (variant.layout === 'splitLight') {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, colors.light);
    bg.addColorStop(0.58, '#ffffff');
    bg.addColorStop(1, colors.soft);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const imageW = Math.min(width * 0.34, height * 2.3);
    drawImagePanel(ctx, image, pad, pad, imageW, height - pad * 2, 22, colors.light, colors);

    const textX = pad + imageW + pad;
    const textW = width - textX - pad - 160;
    drawPill(ctx, copy.company.toUpperCase(), textX, pad, Math.min(270, Math.max(150, ctx.measureText(copy.company).width + 76)), isShort ? 32 : 38, colors.soft, colors.secondary, isShort ? 14 : 16);
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'top';
    const titleY = pad + (isShort ? 42 : 54);
    const descY = height - pad - bodySize - 4;
    const titleLines = maxLinesForBox(titleY, descY - bodySize * 1.25, titleSize * 1.04, isCompact ? 1 : 2);
    drawFittedTextBlock(ctx, copy.title, textX, titleY, Math.max(220, textW), Math.max(30, descY - titleY - 8), {
      initialSize: titleSize,
      minSize: isShort ? 22 : 28,
      maxLines: titleLines,
      color: '#0f172a',
    });
    ctx.fillStyle = '#475569';
    ctx.font = `700 ${bodySize}px Arial, sans-serif`;
    drawWrappedText(ctx, copy.description, textX, descY, Math.max(220, textW), bodySize * 1.2, 1);
    drawPill(ctx, copy.cta, width - pad - 136, height - pad - ctaH, 136, ctaH, '#0f172a', '#ffffff', isShort ? 17 : 18);
    return;
  }

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, variant.layout === 'editorialDark' ? '#080f1f' : colors.dark);
  bg.addColorStop(0.55, colors.secondary);
  bg.addColorStop(1, colors.primary);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width * 0.42, height * 0.45, height * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.arc(width * 0.72, height * 0.75, height * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const imageW = Math.min(width * 0.28, height * 2.1);
  const imageX = width - pad - imageW;
  drawImagePanel(ctx, image, imageX, pad, imageW, height - pad * 2, 24, 'rgba(255,255,255,.14)', colors);

  const textW = imageX - pad * 2;
  drawPill(ctx, copy.company.toUpperCase(), pad, pad, Math.min(290, Math.max(160, copy.company.length * 12 + 70)), isShort ? 32 : 38, 'rgba(255,255,255,.92)', '#0f172a', isShort ? 14 : 16);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  const titleY = pad + (isShort ? 42 : 56);
  const bodyY = height - pad - bodySize - 5;
  const titleLines = maxLinesForBox(titleY, bodyY - bodySize * 1.25, titleSize * 1.04, isCompact ? 1 : 2);
  drawFittedTextBlock(ctx, copy.title, pad, titleY, textW, Math.max(30, bodyY - titleY - 8), {
    initialSize: titleSize,
    minSize: isShort ? 22 : 28,
    maxLines: titleLines,
    color: '#ffffff',
  });
  ctx.fillStyle = '#dbeafe';
  ctx.font = `700 ${bodySize}px Arial, sans-serif`;
  drawWrappedText(ctx, copy.contact || copy.description, pad, bodyY, Math.max(180, textW - 150), bodySize * 1.2, 1);
  drawPill(ctx, copy.cta, imageX - 150, height - pad - ctaH, 132, ctaH, '#ffffff', '#0f172a', isShort ? 17 : 18);
}

function drawVerticalCreative(ctx, image, width, height, variant, copy, palette) {
  const colors = palette || getImagePalette(image);
  const pad = Math.max(18, Math.round(width * 0.07));
  const dark = variant.layout === 'verticalImpact';
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, dark ? colors.dark : colors.light);
  bg.addColorStop(0.58, dark ? colors.secondary : '#ffffff');
  bg.addColorStop(1, dark ? colors.primary : colors.soft);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (dark) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width * 0.68, 92, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const imageH = Math.max(112, Math.min(Math.round(height * 0.34), height - 292));
  const imageY = pad;
  drawImagePanel(ctx, image, pad, imageY, width - pad * 2, imageH, 22, dark ? 'rgba(255,255,255,.14)' : colors.light, colors);

  const pillY = imageY + imageH + 14;
  drawPill(ctx, copy.company.toUpperCase(), pad, pillY, width - pad * 2, 36, dark ? 'rgba(255,255,255,.92)' : colors.soft, dark ? '#0f172a' : colors.secondary, 14);

  const ctaY = height - pad - 42;
  const descY = Math.max(pillY + 86, ctaY - 58);
  const titleY = pillY + 52;
  drawFittedTextBlock(ctx, copy.title, pad, titleY, width - pad * 2, Math.max(48, descY - titleY - 8), {
    initialSize: 31,
    minSize: 22,
    maxLines: 3,
    color: dark ? '#ffffff' : '#0f172a',
  });

  ctx.fillStyle = dark ? '#dbeafe' : '#475569';
  ctx.font = '700 16px Arial, sans-serif';
  drawWrappedText(ctx, copy.description, pad, descY, width - pad * 2, 20, Math.max(1, Math.min(2, Math.floor((ctaY - descY - 8) / 20))));

  drawPill(ctx, copy.cta, pad, ctaY, width - pad * 2, 42, dark ? '#ffffff' : '#0f172a', dark ? '#0f172a' : '#ffffff', 18);
}

function drawGenerated(ctx, image, width, height, variant, form) {
  const copy = getCopy(form);
  const palette = getImagePalette(image);
  const ratio = width / height;
  if (ratio < 1.15) {
    drawVerticalCreative(ctx, image, width, height, variant, copy, palette);
    return;
  }
  drawWideCreative(ctx, image, width, height, variant, copy, palette);
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
    drawFullBleedOriginal(ctx, image, width, height);
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
        La IA llena el espacio con la imagen subida y tambien crea piezas nuevas con logo, colores y datos de la campania.
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
        {error ? <span style={styles.error}>{error}</span> : <span style={styles.hint}>Genera PNG final completo, sin espacios blancos y con textos protegidos.</span>}
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
  previewImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  placeholder: { color: '#64748b', fontWeight: 900, fontSize: 12 },
  variantMeta: { color: '#334155', fontSize: 12, fontWeight: 800 },
  footer: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', minWidth: 0 },
  useButton: { border: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 12, padding: '11px 14px', fontWeight: 900, cursor: 'pointer', maxWidth: '100%' },
  hint: { color: '#64748b', fontSize: 12, fontWeight: 700 },
  error: { color: '#be123c', fontSize: 12, fontWeight: 800 },
};
