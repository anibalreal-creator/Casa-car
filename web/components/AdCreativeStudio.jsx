import { useEffect, useMemo, useState } from 'react';

const VARIANTS = [
  { key: 'center', label: 'Adaptado', tone: 'recorte central', mode: 'cover', focusX: 0.5, focusY: 0.5 },
  { key: 'top', label: 'Arriba', tone: 'logo y encabezado', mode: 'cover', focusX: 0.5, focusY: 0.18 },
  { key: 'bottom', label: 'Abajo', tone: 'datos de contacto', mode: 'cover', focusX: 0.5, focusY: 0.82 },
  { key: 'complete', label: 'Completo', tone: 'sin cortar', mode: 'contain', focusX: 0.5, focusY: 0.5 },
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

function drawCover(ctx, image, width, height, focusX = 0.5, focusY = 0.5) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const sourceX = clamp((image.width - cropWidth) * focusX, 0, image.width - cropWidth);
  const sourceY = clamp((image.height - cropHeight) * focusY, 0, image.height - cropHeight);
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

function canvasToOutput(canvas) {
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
        const file = new File([blob], `casa-car-banner-adaptado-${Date.now()}.png`, { type: 'image/png' });
        resolve({ file, previewUrl, width: canvas.width, height: canvas.height });
      }, 'image/png', 0.96);
    } catch {
      reject(new Error('No se pudo adaptar esta imagen'));
    }
  });
}

async function renderCreative({ selectedSlot, sourceImage, variant }) {
  if (!sourceImage) throw new Error('Subi una imagen original para adaptarla');

  const { width, height } = parseDimensions(selectedSlot?.dimensions);
  const image = await loadImage(sourceImage);
  if (!image) throw new Error('No se pudo leer la imagen original');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (variant.mode === 'contain') {
    drawContain(ctx, image, width, height);
  } else {
    drawCover(ctx, image, width, height, variant.focusX, variant.focusY);
  }

  return canvasToOutput(canvas);
}

export default function AdCreativeStudio({ selectedSlot, sourceImage, onUseBanner }) {
  const [selected, setSelected] = useState('center');
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const dimensions = useMemo(() => parseDimensions(selectedSlot?.dimensions), [selectedSlot?.dimensions]);
  const aspectRatio = `${dimensions.width} / ${dimensions.height}`;
  const activeVariant = VARIANTS.find((item) => item.key === selected) || VARIANTS[0];

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
      VARIANTS.map(async (variant) => {
        try {
          const output = await renderCreative({ selectedSlot, sourceImage, variant });
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
  }, [selectedSlot?.dimensions, sourceImage]);

  async function useVariant() {
    setGenerating(true);
    setError('');
    try {
      const cached = previews[selected];
      const output = cached?.file
        ? cached
        : await renderCreative({ selectedSlot, sourceImage, variant: activeVariant });
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
          <h3 style={styles.title}>Adaptar imagen al banner</h3>
        </div>
        <div style={styles.size}>{dimensions.width}x{dimensions.height}</div>
      </div>

      <div style={styles.variantGrid}>
        {VARIANTS.map((variant) => {
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
                  <div style={styles.placeholder}>{sourceImage ? 'Adaptando...' : 'Subi imagen'}</div>
                )}
              </div>
              <span style={styles.variantMeta}>{variant.label} - {variant.tone}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.footer}>
        <button type="button" onClick={useVariant} disabled={generating || loading || !sourceImage} style={styles.useButton}>
          {generating ? 'Generando...' : 'Usar adaptacion IA'}
        </button>
        {error ? <span style={styles.error}>{error}</span> : <span style={styles.hint}>PNG final listo para mostrar y subir.</span>}
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
  variantPreview: { borderRadius: 10, overflow: 'hidden', display: 'grid', placeItems: 'center', minHeight: 92, boxSizing: 'border-box', background: '#eff6ff' },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  placeholder: { color: '#64748b', fontWeight: 900, fontSize: 12 },
  variantMeta: { color: '#334155', fontSize: 12, fontWeight: 800 },
  footer: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  useButton: { border: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 12, padding: '11px 14px', fontWeight: 900, cursor: 'pointer' },
  hint: { color: '#64748b', fontSize: 12, fontWeight: 700 },
  error: { color: '#be123c', fontSize: 12, fontWeight: 800 },
};
