import { useState } from 'react';
import { startPremiumCheckout } from '../lib/startPremiumCheckout';

export default function PremiumCheckoutButton({ listingId, children = 'Destacar anuncio', style = {} }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!listingId || loading) return;

    try {
      setLoading(true);
      await startPremiumCheckout(listingId);
    } catch (error) {
      alert(error?.message || 'Error al iniciar pago');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        background: '#16a34a',
        color: '#fff',
        border: '1px solid #15803d',
        borderRadius: 10,
        padding: '12px 16px',
        fontWeight: 800,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        ...style,
      }}
    >
      {loading ? 'Redirigiendo…' : children}
    </button>
  );
}
