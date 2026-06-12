import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import { AD_PLANS, AD_SLOTS, getAdPlan } from '../../data/adPlans';
import { supabaseBrowser } from '../../lib/supabaseBrowser';

function statCard(label, value, hint) {
  return { label, value, hint };
}

function locationHref(slotKey) {
  return `/publicidad/slots?slot=${encodeURIComponent(slotKey || 'home_middle')}`;
}

export default function PublicidadPanelPage() {
  const router = useRouter();
  const initial = useMemo(() => ({
    company_name: '',
    title: '',
    description: '',
    plan_key: 'basico',
    slot_key: 'home_middle',
    destination_url: '',
    cta_text: 'Ver más',
    contact_name: '',
    contact_email: '',
  }), []);

  const [form, setForm] = useState(initial);
  const [user, setUser] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    let mounted = true;
    supabaseBrowser.auth.getSession().then(({ data }) => {
      const nextUser = data?.session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
      setForm((prev) => ({ ...prev, contact_email: prev.contact_email || nextUser?.email || '' }));
      if (nextUser) loadCampaigns(nextUser);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const edit = String(router.query.edit || '');
    setEditingId(edit);
  }, [router.isReady, router.query.edit]);

  useEffect(() => {
    if (!editingId) {
      setBannerPreview('');
      return;
    }
    const selected = campaigns.find((item) => String(item.id) === String(editingId));
    if (!selected) return;
    setForm({
      company_name: selected.company_name || '',
      title: selected.title || '',
      description: selected.description || '',
      plan_key: selected.plan_key || 'basico',
      slot_key: selected.slot_key || 'home_middle',
      destination_url: selected.destination_url || '',
      cta_text: selected.cta_text || 'Ver más',
      contact_name: selected.contact_name || '',
      contact_email: selected.contact_email || user?.email || '',
    });
    setBannerPreview(selected.banner_url || '');
    setBannerFile(null);
  }, [editingId, campaigns, user?.email]);

  async function loadCampaigns(currentUser = user) {
    try {
      const auth = await supabaseBrowser.auth.getSession();
      const token = auth?.data?.session?.access_token || '';
      const res = await fetch('/api/ads/my-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-casa-request': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: currentUser?.id || '', contact_email: currentUser?.email || '' }),
      });
      const data = await res.json();
      setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } catch {
      setCampaigns([]);
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : bannerPreview);
  }

  async function uploadBanner() {
    if (!bannerFile) return bannerPreview || '';
    const ext = bannerFile.name.split('.').pop();
    const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseBrowser.storage.from('listings').upload(path, bannerFile, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = supabaseBrowser.storage.from('listings').getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      const auth = await supabaseBrowser.auth.getSession();
      const currentUser = auth?.data?.session?.user || null;
      if (!currentUser) throw new Error('Tenés que iniciar sesión para crear o editar una campaña.');
      const banner_url = await uploadBanner();

      if (editingId) {
        const res = await fetch(`/api/ads?id=${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.data?.session?.access_token ? { Authorization: `Bearer ${auth.data.session.access_token}` } : {}),
          },
          body: JSON.stringify({ ...form, banner_url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la campaña');
        setNotice('Banner actualizado correctamente.');
        setEditingId('');
        router.replace('/publicidad/panel', undefined, { shallow: true });
        await loadCampaigns(currentUser);
        setBannerFile(null);
        return;
      }

      if (!banner_url) throw new Error('Tenés que subir un banner.');
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.data?.session?.access_token ? { Authorization: `Bearer ${auth.data.session.access_token}` } : {}),
        },
        body: JSON.stringify({ ...form, banner_url, status: 'pending_payment' }),
      });
      const campaign = await res.json();
      if (!res.ok) throw new Error(campaign.error || campaign.hint || 'No se pudo crear la campaña');
      setCampaigns((prev) => [campaign, ...prev]);

      const prefRes = await fetch('/api/ads/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-casa-request': '1',
          ...(auth?.data?.session?.access_token ? { Authorization: `Bearer ${auth.data.session.access_token}` } : {}),
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          title: campaign.title,
          planKey: campaign.plan_key,
          slotKey: campaign.slot_key,
          companyName: campaign.company_name,
        }),
      });
      const pref = await prefRes.json();
      if (!prefRes.ok) throw new Error(pref.error || 'No se pudo iniciar el checkout');
      if (pref.manual) {
        setNotice('Campaña guardada como pendiente/inactiva. Falta Mercado Pago para abrir checkout automático; no se mostrará como activa hasta confirmar el pago.');
        setSubmitting(false);
        await loadCampaigns(currentUser);
        return;
      }
      window.location.href = pref.chosen_checkout_url || pref.checkout_url;
    } catch (error) {
      setNotice(error.message || 'Error creando campaña');
      setSubmitting(false);
    }
  }

  async function cancelCampaign(id) {
    if (!id || cancellingId) return;
    const ok = window.confirm('¿Dar de baja esta publicidad? El banner dejará de mostrarse en los espacios activos.');
    if (!ok) return;
    setCancellingId(String(id));
    setNotice('');
    try {
      const auth = await supabaseBrowser.auth.getSession();
      const token = auth?.data?.session?.access_token || '';
      const response = await fetch('/api/ads/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-casa-request': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo dar de baja');
      setNotice('Publicidad dada de baja. Ya no se mostrará en los espacios activos.');
      await loadCampaigns();
    } catch (error) {
      setNotice(error.message || 'No se pudo dar de baja la publicidad');
    } finally {
      setCancellingId('');
    }
  }
  async function syncCampaigns() {
    setSyncing(true);
    setNotice('');
    try {
      const auth = await supabaseBrowser.auth.getSession();
      const token = auth?.data?.session?.access_token || '';
      const res = await fetch('/api/ads/sync-active', {
        method: 'POST',
        headers: {
          'x-casa-request': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron sincronizar campañas');
      setNotice(`Sync OK · ${data.updated || 0} campañas actualizadas`);
      await loadCampaigns();
    } catch (error) {
      setNotice(error.message || 'No se pudieron sincronizar campañas');
    } finally {
      setSyncing(false);
    }
  }

  const selectedPlan = getAdPlan(form.plan_key);
  const availableSlots = AD_SLOTS.filter((slot) => selectedPlan.slots.includes(slot.key));
  const selectedSlot = availableSlots.find((slot) => slot.key === form.slot_key) || availableSlots[0] || AD_SLOTS[0];
  useEffect(() => {
    if (!availableSlots.some((slot) => slot.key === form.slot_key)) {
      setForm((prev) => ({ ...prev, slot_key: availableSlots[0]?.key || 'home_middle' }));
    }
  }, [availableSlots, form.slot_key]);

  useEffect(() => {
    if (!router.isReady) return;
    const status = String(router.query.status || '').toLowerCase();
    if (!status) return;
    if (status === 'paid' || status === 'approved') {
      setNotice('Pago recibido. Vamos a sincronizar la campaña para activarla en pantalla.');
      syncCampaigns();
    } else if (status === 'pending') {
      setNotice('El pago quedó pendiente. Cuando Mercado Pago confirme, la campaña se activará sola.');
    } else if (status === 'failure') {
      setNotice('El pago no se aprobó. Podés volver a intentar desde esta misma pantalla.');
    }
  }, [router.isReady, router.query.status]);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((item) => item.active || item.is_active || item.status === 'active').length;
    const pending = campaigns.filter((item) => String(item.status).includes('pending') && !(item.active || item.is_active)).length;
    const clicks = campaigns.reduce((acc, item) => acc + Number(item.clicks || 0), 0);
    return [
      statCard('Campañas', total, 'totales'),
      statCard('Activas', active, 'en pantalla'),
      statCard('Pendientes', pending, 'de cobro'),
      statCard('Clicks', clicks, 'registrados'),
    ];
  }, [campaigns]);

  return (
    <div style={styles.page}>
      <GlobalHeader />
      <main style={styles.wrap}>
        <section style={styles.hero}>
          <div>
            <div style={styles.kicker}>PANEL DE EMPRESAS</div>
            <h1 style={styles.title}>Subí tu banner, pagá y activalo automáticamente</h1>
            <p style={styles.subtitle}>Flujo listo para anunciantes: carga de creatividad, selección de plan, cobro con Mercado Pago y publicación automática por slot.</p>
            <div style={styles.quickNav}>
              <a href='/publicidad' style={styles.quickSecondary}>Landing publicitaria</a>
              <a href='/panel-empresas' style={styles.quickSecondary}>Panel empresas</a>
              <a href='/dashboard/company' style={styles.quickSecondary}>Dashboard empresa</a>
            </div>
          </div>
          <div style={styles.infoBox}>
            <div><strong>Plan:</strong> {selectedPlan.name}</div>
            <div><strong>Precio prueba:</strong> ARS {selectedPlan.price.toLocaleString('es-AR')}</div>
            <div><strong>Duración:</strong> {selectedPlan.durationDays} días</div>
            <button type="button" onClick={syncCampaigns} style={styles.syncButton}>{syncing ? 'Sincronizando…' : 'Sync campañas'}</button>
          </div>
        </section>

        <section style={styles.statsRow}>
          {stats.map((item) => (
            <div key={item.label} style={styles.statCard}>
              <div style={styles.statLabel}>{item.label}</div>
              <div style={styles.statValue}>{item.value}</div>
              <div style={styles.statHint}>{item.hint}</div>
            </div>
          ))}
        </section>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <div style={styles.grid}>
          <form onSubmit={submit} style={styles.form}>
            <h2 style={styles.h2}>{editingId ? 'Editar campaña' : 'Nueva campaña'}</h2>
            <input style={styles.input} placeholder="Empresa" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} required />
            <input style={styles.input} placeholder="Título del banner" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <textarea style={{ ...styles.input, minHeight: 110 }} placeholder="Descripción" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <div style={styles.row}>
              <select style={styles.input} value={form.plan_key} onChange={(e) => setForm((p) => ({ ...p, plan_key: e.target.value }))}>
                {AD_PLANS.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
              </select>
              <select style={styles.input} value={form.slot_key} onChange={(e) => setForm((p) => ({ ...p, slot_key: e.target.value }))}>
                {availableSlots.map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
              </select>
            </div>
            <input style={styles.input} placeholder="URL destino" value={form.destination_url} onChange={(e) => setForm((p) => ({ ...p, destination_url: e.target.value }))} required />
            <div style={styles.row}>
              <input style={styles.input} placeholder="Ver más" value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} />
              <input style={styles.input} placeholder="Contacto" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <input style={styles.input} placeholder="Email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} required />
            <label style={styles.uploadBox}>
              <span style={styles.uploadTitle}>{editingId ? 'Cambiar banner' : 'Subir banner'}</span>
              <input type="file" accept="image/*" onChange={onFile} style={{ marginTop: 10 }} required={!editingId && !bannerPreview} />
              <span style={styles.uploadHelp}>{editingId ? 'Reemplaza la imagen sin perder la campaña.' : 'Se guarda en Supabase Storage. La campaña queda pendiente/inactiva y se publica automáticamente al aprobar el pago.'}</span>
            </label>
            <div style={styles.slotPreviewBox}>
              <div style={styles.slotPreviewCopy}>
                <strong>Ubicacion elegida: {selectedSlot?.label || 'Espacio publicitario'}</strong>
                <span>{selectedSlot?.dimensions || 'Formato automatico'} - Pagina {selectedSlot?.page || 'Casa-Car'}</span>
                <span>El anuncio se mostrara en ese espacio cuando la campana este aprobada y activa.</span>
              </div>
              <a href={locationHref(form.slot_key)} style={styles.previewSlotButton}>Ver donde aparece</a>
            </div>
            <div style={styles.creativePreview}>
              <div style={styles.creativePreviewInfo}>
                <strong>Vista previa inteligente del banner</strong>
                <span>La imagen se ajusta completa: fondo adaptado y banner centrado para evitar textos cortados.</span>
              </div>
              {bannerPreview ? (
                <div style={styles.smartPreviewFrame}>
                  <img src={bannerPreview} alt="" aria-hidden="true" style={styles.smartPreviewBg} />
                  <img src={bannerPreview} alt="Vista previa del banner" style={styles.smartPreviewImg} />
                </div>
              ) : (
                <div style={styles.previewPlaceholder}>Subi una imagen para ver como se adapta al espacio elegido.</div>
              )}
            </div>
            {!editingId ? (
              <div style={styles.paymentHelp}>
                Si Mercado Pago deja el boton Pagar en gris, normalmente falta validar el medio de pago, usar una cuenta compradora distinta a la vendedora o completar datos de la cuenta de Mercado Pago. Casa-Car ya crea la preferencia y vuelve por webhook cuando Mercado Pago aprueba.
              </div>
            ) : null}
            <button type="submit" disabled={submitting} style={styles.button}>{submitting ? 'Procesando…' : (editingId ? 'Guardar cambios del banner' : 'Crear campaña y pagar con Mercado Pago')}</button>
          </form>

          <aside style={styles.sidebar}>
            <div style={styles.sidebarCard}>
              <h3 style={styles.sideTitle}>Slots disponibles</h3>
              <div style={styles.slotGrid}>
                {AD_SLOTS.map((slot) => (
                  <a key={slot.key} href={locationHref(slot.key)} style={styles.slotCardLink}>
                    <strong>{slot.label}</strong>
                    <span>{slot.dimensions}</span>
                    <small>página {slot.page}</small>
                  </a>
                ))}
              </div>
            </div>
            <div style={styles.sidebarCard}>
              <h3 style={styles.sideTitle}>Mis campañas</h3>
              {campaigns.length ? campaigns.map((item) => (
                <div key={item.id} style={styles.campaignCard}>
                  <div style={styles.campaignTitle}>{item.title}</div>
                  <div style={styles.campaignMeta}>{item.plan_name || item.plan_key} · {item.slot_label || item.slot_key}</div>
                  <div style={styles.campaignMeta}>Estado: {item.status}{item.active || item.is_active ? ' · activa' : ' · inactiva'}</div>
                  <div style={styles.linkRow}>
                    <a href={`/publicidad/panel?edit=${item.id}`} style={styles.inlineLink}>Cambiar banner</a>
                    {item.banner_url ? <a href={item.banner_url} target="_blank" rel="noreferrer" style={styles.subtleLink}>Ver banner</a> : null}
                    <a href={locationHref(item.slot_key)} style={styles.subtleLink}>Ver ubicación</a>
                    <button
                      type="button"
                      onClick={() => cancelCampaign(item.id)}
                      disabled={cancellingId === String(item.id)}
                      style={styles.cancelButton}
                    >
                      {cancellingId === String(item.id) ? 'Dando de baja...' : 'Dar de baja publicidad'}
                    </button>
                  </div>
                </div>
              )) : <div style={styles.empty}>Todavía no hay campañas guardadas para este usuario.</div>}
            </div>
          </aside>
        </div>
      </main>
      <FooterBlueBar />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' },
  wrap: { maxWidth: 1400, margin: '0 auto', padding: '28px 16px 50px', display: 'grid', gap: 24 },
  hero: { display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 20, background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 24 },
  kicker: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 10px', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', marginBottom: 12 },
  title: { margin: '0 0 12px 0', fontSize: 46, lineHeight: 1 },
  subtitle: { margin: 0, fontSize: 18, lineHeight: 1.6, color: '#475569' },
  quickNav:{display:'flex',gap:10,flexWrap:'wrap',marginTop:16},
  quickSecondary:{textDecoration:'none',background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',padding:'10px 12px',borderRadius:12,fontWeight:800},
  infoBox: { background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', borderRadius: 20, padding: 20, display: 'grid', gap: 10, alignContent: 'start' },
  syncButton: { border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:12, padding:'12px 14px', fontWeight:900, cursor:'pointer' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 },
  statCard: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, padding:18 },
  statLabel: { color:'#64748b', fontSize:13, fontWeight:800, textTransform:'uppercase' },
  statValue: { color:'#111827', fontSize:30, fontWeight:900, marginTop:8 },
  statHint: { color:'#64748b', fontSize:12, marginTop:4 },
  notice: { background:'#ecfeff', color:'#155e75', border:'1px solid #a5f3fc', borderRadius:16, padding:14, fontWeight:800 },
  grid: { display: 'grid', gridTemplateColumns: '1.1fr .65fr', gap: 20, alignItems: 'start' },
  form: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 22, display: 'grid', gap: 14 },
  h2: { margin: 0, fontSize: 30 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '14px 16px', fontSize: 15 },
  uploadBox: { border: '1px dashed #94a3b8', borderRadius: 16, padding: 16, background: '#f8fafc', color: '#334155' },
  uploadTitle: { display: 'block', fontWeight: 900 },
  uploadHelp: { display: 'block', marginTop: 8, fontSize: 13, color: '#64748b' },
  slotPreviewBox: { border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  slotPreviewCopy: { display: 'grid', gap: 4, color: '#334155', fontSize: 13 },
  previewSlotButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 999, padding: '9px 12px', fontWeight: 900, fontSize: 13 },
  creativePreview: { display: 'grid', gap: 10, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, padding: 12 },
  creativePreviewInfo: { display: 'grid', gap: 4, color: '#334155', fontSize: 13 },
  smartPreviewFrame: { position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid #cbd5e1', background: '#0f172a', display: 'grid', placeItems: 'center', minHeight: 160 },
  smartPreviewBg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px)', transform: 'scale(1.14)', opacity: 0.45 },
  smartPreviewImg: { position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  previewPlaceholder: { padding: 20, textAlign: 'center', color: '#64748b', fontWeight: 800 },
  paymentHelp: { fontSize: 13, lineHeight: 1.45, color: '#475569', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: 12 },
  cancelButton: { border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', borderRadius: 999, padding: '8px 10px', fontWeight: 900, cursor: 'pointer' },
  preview: { width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 16, border: '1px solid #dbeafe' },
  button: { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 18px', fontWeight: 900, cursor: 'pointer' },
  sidebar: { display: 'grid', gap: 16 },
  sidebarCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 18 },
  sideTitle: { margin: '0 0 10px 0', fontSize: 22 },
  slotGrid: { display:'grid', gap:8 },
  slotCardLink: { textDecoration:'none', border:'1px solid #e5e7eb', borderRadius:12, padding:12, display:'grid', gap:4, color:'#475569' },
  campaignCard: { borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 },
  campaignTitle: { fontWeight: 900, color: '#0f172a' },
  campaignMeta: { color: '#64748b', marginTop: 4 },
  linkRow:{display:'flex',gap:10,flexWrap:'wrap',marginTop:8},
  inlineLink: { display:'inline-block', color:'#2563eb', fontWeight:800, textDecoration:'none' },
  subtleLink:{display:'inline-block', color:'#475569', fontWeight:700, textDecoration:'none'},
  empty: { color: '#64748b' },
};
