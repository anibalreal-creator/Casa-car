import { useState } from 'react';
import { startPremiumCheckout } from '../lib/startPremiumCheckout';

export default function PremiumButton({ listing }) {
  const [loading, setLoading] = useState(false);

  async function pagarPremium() {
    if (!listing?.id || loading) return;

    try {
      setLoading(true);
      await startPremiumCheckout(listing.id);
    } catch (error) {
      alert(error?.message || 'Error al iniciar pago');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={pagarPremium}
      disabled={loading}
      style={{
        padding: 12,
        background: '#00a650',
        color: '#fff',
        borderRadius: 8,
        border: '1px solid #15803d',
        fontWeight: 800,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1,
      }}
    >
      {loading ? 'Redirigiendo…' : '🚀 Destacar anuncio'}
    </button>
  );
}
