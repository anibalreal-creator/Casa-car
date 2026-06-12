import { useEffect, useState } from 'react'

export default function AdBanner({
  slot,
  page = 'global',
  className = '',
  style = {},
  title = 'Espacio publicitario',
  reserveText = 'Reservar este espacio',
  minHeight = 120,
}) {
  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadAd() {
      try {
        setLoading(true)
        const res = await fetch(`/api/ads/slot?slot=${encodeURIComponent(slot)}&page=${encodeURIComponent(page)}`)
        const data = await res.json()
        if (!mounted) return

        setAd(data?.campaign || null)

        if (data?.campaign?.id) {
          fetch('/api/ads/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: data.campaign.id,
              slot,
              page,
            }),
          }).catch(() => {})
        }
      } catch {
        if (mounted) setAd(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (slot) loadAd()

    return () => {
      mounted = false
    }
  }, [slot, page])

  const handleClick = () => {
    if (!ad?.id) return
    fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: ad.id,
        slot,
        page,
      }),
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div
        className={className}
        style={{
          minHeight,
          borderRadius: 18,
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          ...style,
        }}
      >
        <strong>{title}</strong>
        <span style={{ color: '#6b7280' }}>Cargando banner…</span>
      </div>
    )
  }

  if (!ad) {
    return (
      <div
        className={className}
        style={{
          minHeight,
          borderRadius: 18,
          border: '1px dashed #cbd5e1',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          ...style,
        }}
      >
        <strong>{title}</strong>
        <span style={{ color: '#6b7280' }}>{reserveText}</span>
      </div>
    )
  }

  const target = ad.target_url || '#'
  const image = ad.banner_url || ''

  return (
    <a
      href={target}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={className}
      style={{
        minHeight,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        display: 'block',
        textDecoration: 'none',
        background: '#0f172a',
        color: '#fff',
        ...style,
      }}
    >
      {image ? (
        <div style={{ position: 'relative', minHeight, height: '100%', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'blur(18px)', transform: 'scale(1.14)', opacity: 0.42 }}
          />
          <img
            src={image}
            alt={ad.title || 'Publicidad'}
            style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>{(ad.plan || 'PLAN').toUpperCase()}</div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{ad.title || 'Publicidad Casa-Car'}</div>
          <div style={{ marginTop: 8, opacity: 0.9 }}>{ad.contact_email || 'Anunciante'}</div>
        </div>
      )}
    </a>
  )
}
