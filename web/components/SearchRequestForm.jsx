import { useState } from 'react';

const OWNER_PHONE_DISPLAY = '342 407-3042';
const OWNER_WHATSAPP = 'https://wa.me/543424073042';

const initialState = {
  category: 'Propiedades',
  operation: 'Compra',
  budget_currency: 'USD',
  budget_min: '',
  budget_max: '',
  zones: '',
  details: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
};

export default function SearchRequestForm({ compact = false }) {
  const [form, setForm] = useState(initialState);
  const [state, setState] = useState({ status: 'idle', message: '', whatsappUrl: OWNER_WHATSAPP });

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'sending', message: 'Enviando pedido...', whatsappUrl: OWNER_WHATSAPP });

    try {
      const response = await fetch('/api/search-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: compact ? 'home' : 'pedido' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'No pudimos enviar el pedido.');
      setState({
        status: 'sent',
        message: data?.message || 'Pedido recibido. Te vamos a responder con opciones personalizadas.',
        whatsappUrl: data?.whatsappUrl || OWNER_WHATSAPP,
      });
      setForm(initialState);
    } catch (error) {
      setState({ status: 'error', message: error.message, whatsappUrl: OWNER_WHATSAPP });
    }
  }

  return (
    <section style={{ ...styles.wrap, ...(compact ? styles.compactWrap : null) }}>
      <div style={styles.copy}>
        <span style={styles.kicker}>PEDIDO PERSONALIZADO</span>
        <h2 style={compact ? styles.compactTitle : styles.title}>Decinos que estas buscando</h2>
        <p style={styles.text}>
          Cargá presupuesto aproximado, zonas y detalles. Te respondemos con opciones reales y seguimiento por WhatsApp.
        </p>
        <a href={OWNER_WHATSAPP} target="_blank" rel="noreferrer" style={styles.whatsapp}>
          WhatsApp Casa-Car: {OWNER_PHONE_DISPLAY}
        </a>
      </div>

      <form onSubmit={submit} style={styles.form}>
        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Rubro</span>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)} style={styles.input}>
              <option>Propiedades</option>
              <option>Autos</option>
              <option>Servicios</option>
              <option>Náutica</option>
              <option>Maquinaria</option>
              <option>Turismo</option>
              <option>Otro</option>
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Operación</span>
            <select value={form.operation} onChange={(e) => updateField('operation', e.target.value)} style={styles.input}>
              <option>Compra</option>
              <option>Alquiler</option>
              <option>Venta</option>
              <option>Consulta</option>
            </select>
          </label>
        </div>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Moneda</span>
            <select value={form.budget_currency} onChange={(e) => updateField('budget_currency', e.target.value)} style={styles.input}>
              <option>USD</option>
              <option>ARS</option>
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Presupuesto hasta</span>
            <input value={form.budget_max} onChange={(e) => updateField('budget_max', e.target.value)} placeholder="Ej: 120000" inputMode="numeric" style={styles.input} />
          </label>
        </div>

        <label style={styles.field}>
          <span style={styles.label}>Zonas buscadas</span>
          <input value={form.zones} onChange={(e) => updateField('zones', e.target.value)} placeholder="Ej: Santa Fe, Guadalupe, Candioti" style={styles.input} />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Detalle del pedido</span>
          <textarea value={form.details} onChange={(e) => updateField('details', e.target.value)} placeholder="Ej: casa 2 dormitorios, cochera, patio, cerca de avenida..." rows={4} style={{ ...styles.input, ...styles.textarea }} />
        </label>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Nombre</span>
            <input value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} placeholder="Tu nombre" style={styles.input} />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Tu WhatsApp</span>
            <input value={form.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} placeholder="Ej: 342..." inputMode="tel" style={styles.input} />
          </label>
        </div>

        <label style={styles.field}>
          <span style={styles.label}>Email opcional</span>
          <input value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} placeholder="tu@email.com" inputMode="email" style={styles.input} />
        </label>

        <button type="submit" disabled={state.status === 'sending'} style={{ ...styles.button, ...(state.status === 'sending' ? styles.buttonDisabled : null) }}>
          {state.status === 'sending' ? 'Enviando...' : 'Enviar pedido'}
        </button>

        {state.message ? (
          <div style={{ ...styles.notice, ...(state.status === 'error' ? styles.error : styles.success) }}>
            <strong>{state.message}</strong>
            {state.status === 'sent' ? <a href={state.whatsappUrl} target="_blank" rel="noreferrer" style={styles.noticeLink}>Escribir también por WhatsApp</a> : null}
          </div>
        ) : null}
      </form>

      <style jsx>{`
        @media (max-width: 820px) {
          section {
            grid-template-columns: 1fr !important;
            padding: 14px !important;
          }

          form > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, .85fr) minmax(320px, 1.15fr)',
    gap: 22,
    alignItems: 'stretch',
    background: '#fff',
    border: '1px solid #dbeafe',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 18px 45px rgba(15,23,42,.08)',
  },
  compactWrap: { margin: '0 0 34px' },
  copy: {
    background: 'linear-gradient(180deg,#0f172a 0%, #1d4ed8 100%)',
    color: '#fff',
    borderRadius: 20,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 14,
  },
  kicker: { display: 'inline-block', width: 'fit-content', background: 'rgba(255,255,255,.12)', padding: '8px 12px', borderRadius: 999, fontWeight: 900, letterSpacing: '.08em', fontSize: 12 },
  title: { margin: 0, fontSize: 42, lineHeight: 1.04, fontWeight: 900 },
  compactTitle: { margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 900 },
  text: { margin: 0, color: '#dbeafe', fontSize: 17, lineHeight: 1.5 },
  whatsapp: { color: '#111827', background: '#fff', textDecoration: 'none', borderRadius: 14, padding: '13px 15px', fontWeight: 900, width: 'fit-content' },
  form: { display: 'grid', gap: 12, minWidth: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  field: { display: 'grid', gap: 7, minWidth: 0 },
  label: { fontSize: 13, fontWeight: 900, color: '#334155' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 14, padding: '13px 14px', fontSize: 16, outline: 'none', background: '#fff', color: '#111827' },
  textarea: { minHeight: 110, resize: 'vertical', lineHeight: 1.4 },
  button: { border: 'none', borderRadius: 16, padding: '16px 18px', background: '#111827', color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer' },
  buttonDisabled: { opacity: .7, cursor: 'wait' },
  notice: { display: 'grid', gap: 8, borderRadius: 14, padding: 14, lineHeight: 1.35 },
  success: { background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' },
  error: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
  noticeLink: { color: '#065f46', fontWeight: 900 },
};
