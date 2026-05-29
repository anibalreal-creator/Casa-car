import { useMemo, useState } from "react";
import { useLang } from "../context/LanguageContext";
import { calculateTourismQuote, getTourismSpecs, tourismText } from "../lib/tourism";

export default function TourismBookingPanel({ listing }) {
  const { language } = useLang();
  const tr = (key) => tourismText(language, key);
  const specs = getTourismSpecs(listing);
  const [form, setForm] = useState({
    check_in: '',
    check_out: '',
    guests: '2',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    note: '',
    pay_now: false,
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const quote = useMemo(() => calculateTourismQuote(listing, {
    checkIn: form.check_in,
    checkOut: form.check_out,
    guests: form.guests,
  }), [listing, form.check_in, form.check_out, form.guests]);

  const minNights = Number(specs.min_nights || 0);
  const maxNights = Number(specs.max_nights || 0);
  const invalidNights = Boolean((minNights && quote.nights && quote.nights < minNights) || (maxNights && quote.nights && quote.nights > maxNights));

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setMessage('');
    try {
      const response = await fetch('/api/tourism/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          ...form,
          total_estimate: quote.total,
          nights: quote.nights,
          currency: quote.currency,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'No se pudo reservar');
      if (payload.checkout_url && form.pay_now) {
        window.location.href = payload.checkout_url;
        return;
      }
      setMessage(payload.message || tr('booking_sent'));
      setForm((prev) => ({ ...prev, note: '' }));
    } catch (error) {
      setMessage(error.message || 'No se pudo reservar');
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={styles.card}>
      <div style={styles.top}>
        <div>
          <div style={styles.kicker}>BOOKING</div>
          <h2 style={styles.title}>{tr('tourism_booking_title')}</h2>
        </div>
        <span style={styles.badge}>{specs.instant_book ? tr('instant_book') : tr('request_booking')}</span>
      </div>

      <form onSubmit={submit} style={styles.form}>
        <div style={styles.grid}>
          <label style={styles.label}>{tr('checkin')}<input required type="date" style={styles.input} value={form.check_in} onChange={(e) => setForm((p) => ({ ...p, check_in: e.target.value }))} /></label>
          <label style={styles.label}>{tr('checkout')}<input required type="date" style={styles.input} value={form.check_out} onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))} /></label>
          <label style={styles.label}>{tr('guests')}<input required min="1" type="number" style={styles.input} value={form.guests} onChange={(e) => setForm((p) => ({ ...p, guests: e.target.value }))} /></label>
        </div>

        <div style={styles.summary}>
          <div><strong>{quote.nights || 0}</strong> {tr('nights')}</div>
          <div><strong>{quote.currency} {quote.total.toLocaleString('es-AR')}</strong> {tr('total_estimate')}</div>
          {quote.blocked ? <div style={styles.warn}>{tr('not_available')}</div> : null}
          {invalidNights ? <div style={styles.warn}>{tr('min_nights')}: {specs.min_nights || '-'} · {tr('max_nights')}: {specs.max_nights || '-'}</div> : null}
        </div>

        <div style={styles.grid}>
          <input required style={styles.input} placeholder={tr('booking_name')} value={form.guest_name} onChange={(e) => setForm((p) => ({ ...p, guest_name: e.target.value }))} />
          <input required type="email" style={styles.input} placeholder={tr('booking_email')} value={form.guest_email} onChange={(e) => setForm((p) => ({ ...p, guest_email: e.target.value }))} />
          <input style={styles.input} placeholder={tr('booking_phone')} value={form.guest_phone} onChange={(e) => setForm((p) => ({ ...p, guest_phone: e.target.value }))} />
        </div>
        <textarea style={styles.textarea} placeholder={tr('booking_note')} value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />

        <label style={styles.payLine}>
          <input type="checkbox" checked={form.pay_now} onChange={(e) => setForm((p) => ({ ...p, pay_now: e.target.checked }))} />
          {tr('pay_and_reserve')}
        </label>

        <button disabled={sending || quote.blocked || invalidNights || !quote.nights} type="submit" style={styles.button}>
          {sending ? '...' : tr('reserve_now')}
        </button>
        {message ? <div style={styles.message}>{message}</div> : null}
      </form>
    </section>
  );
}

const styles = {
  card: { background: '#fff', border: '1px solid #dbeafe', borderRadius: 18, padding: 18, boxShadow: '0 12px 28px rgba(15,23,42,.06)', display: 'grid', gap: 14 },
  top: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' },
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: '.12em', color: '#1d4ed8' },
  title: { margin: '4px 0 0', fontSize: 24, color: '#111827' },
  badge: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '8px 11px', fontWeight: 900, fontSize: 12 },
  form: { display: 'grid', gap: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 },
  label: { display: 'grid', gap: 6, fontSize: 12, fontWeight: 900, color: '#475569' },
  input: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', boxSizing: 'border-box', background: '#fff' },
  textarea: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', minHeight: 86, resize: 'vertical', boxSizing: 'border-box' },
  summary: { display: 'grid', gap: 6, border: '1px solid #e5e7eb', background: '#f8fafc', borderRadius: 14, padding: 12, color: '#334155' },
  warn: { color: '#b45309', fontWeight: 900 },
  payLine: { display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900, color: '#334155' },
  button: { border: 'none', borderRadius: 12, padding: '13px 14px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  message: { border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', borderRadius: 12, padding: '10px 12px', fontWeight: 800 },
};
