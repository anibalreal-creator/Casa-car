import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import GlobalHeader from '../../components/GlobalHeader';
import FooterBlueBar from '../../components/FooterBlueBar';
import AdCreativeStudio from '../../components/AdCreativeStudio';
import { AD_PLANS, AD_SLOTS, getAdPlan } from '../../data/adPlans';
import { supabaseBrowser } from '../../lib/supabaseBrowser';

function statCard(label, value, hint) {
  return { label, value, hint };
}

function locationHref(slotKey) {
  return `/publicidad/slots?slot=${encodeURIComponent(slotKey || 'home_middle')}`;
}

function slotAspectRatio(value = '') {
  const match = String(value || '').match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return '1200 / 220';
  return `${Number(match[1]) || 1200} / ${Number(match[2]) || 220}`;
}

async function readJsonResponse(response, fallbackMessage) {
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const clean = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(clean ? `${fallbackMessage}: ${clean.slice(0, 220)}` : fallbackMessage);
  }
  if (!response.ok) {
    throw new Error(data?.error || data?.hint || data?.message || fallbackMessage);
  }
  return data;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function friendlyPanelError(error, fallback = 'No se pudo completar la operacion') {
  const message = String(error?.message || '');
  if (/row-level|security policy|violates|rls/i.test(message)) {
    return 'No se pudo guardar por permisos de seguridad. Cerra sesion, volve a ingresar e intentalo de nuevo.';
  }
  if (/column .* does not exist|schema cache|JSON\.parse/i.test(message)) {
    return 'No se pudo guardar porque falta sincronizar la base de datos con la ultima version del sistema.';
  }
  return message || fallback;
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
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState('');
  const [republishingId, setRepublishingId] = useState('');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    let mounted = true;
    const redirectToLogin = () => {
      const next = router.asPath || '/publicidad/panel';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    };

    supabaseBrowser.auth.getSession().then(({ data }) => {
      const nextUser = data?.session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
      setAuthChecked(true);
      if (!nextUser) {
        setCampaigns([]);
        redirectToLogin();
        return;
      }
      setForm((prev) => ({ ...prev, contact_email: prev.contact_email || nextUser?.email || '' }));
      loadCampaigns(nextUser);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
      setAuthChecked(true);
      if (!nextUser) {
        setCampaigns([]);
        redirectToLogin();
        return;
      }
      setForm((prev) => ({ ...prev, contact_email: prev.contact_email || nextUser?.email || '' }));
      loadCampaigns(nextUser);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router.isReady, router.asPath]);

  useEffect(() => {
    if (!router.isReady) return;
    const edit = String(router.query.edit || '');
    const republish = edit ? '' : String(router.query.republicar || '');
    setEditingId(edit);
    setRepublishingId(republish);
  }, [router.isReady, router.query.edit, router.query.republicar]);

  useEffect(() => {
    const selectedId = editingId || republishingId;
    if (!selectedId) {
      setBannerPreview('');
      setBannerFile(null);
      return;
    }
    const selected = campaigns.find((item) => String(item.id) === String(selectedId));
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
    if (republishingId && !editingId) {
      setNotice('Datos copiados. Revisalos y republica con Mercado Pago para crear una campania nueva.');
    }
  }, [editingId, republishingId, campaigns, user?.email]);

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
      const data = await readJsonResponse(res, 'No se pudieron cargar campanias');
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

  function useGeneratedBanner({ file, previewUrl }) {
    setBannerFile(file);
    setBannerPreview(previewUrl);
    setNotice('Imagen adaptada lista para presentar y subir con la campania.');
  }

  async function uploadBanner(userId) {
    if (!bannerFile) return bannerPreview || '';
    const auth = await supabaseBrowser.auth.getSession();
    const token = auth?.data?.session?.access_token || '';
    if (!token) throw new Error('Tenes que iniciar sesion para subir un banner.');

    const dataBase64 = await fileToBase64(bannerFile);
    const response = await fetch('/api/secure/listing-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        folder: 'ads',
        fileName: bannerFile.name,
        contentType: bannerFile.type || 'image/jpeg',
        dataBase64,
      }),
    });
    const data = await readJsonResponse(response, 'No se pudo subir el banner');
    return data.publicUrl || '';
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      const auth = await supabaseBrowser.auth.getSession();
      const currentUser = auth?.data?.session?.user || null;
      if (!currentUser) throw new Error('Tenés que iniciar sesión para crear o editar una campaña.');
      const banner_url = await uploadBanner(currentUser.id);

      if (editingId) {
        const res = await fetch(`/api/ads?id=${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.data?.session?.access_token ? { Authorization: `Bearer ${auth.data.session.access_token}` } : {}),
          },
          body: JSON.stringify({ ...form, banner_url }),
        });
        await readJsonResponse(res, 'No se pudo actualizar la campania');
        setNotice('Banner actualizado correctamente.');
        setEditingId('');
        setRepublishingId('');
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
      const campaign = await readJsonResponse(res, 'No se pudo crear la campania');
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
      const pref = await readJsonResponse(prefRes, 'No se pudo iniciar el checkout');
      if (pref.manual) {
        setNotice('Campaña guardada como pendiente/inactiva. Falta Mercado Pago para abrir checkout automático; no se mostrará como activa hasta confirmar el pago.');
        setSubmitting(false);
        await loadCampaigns(currentUser);
        return;
      }
      const checkoutUrl = pref.chosen_checkout_url || pref.checkout_url || pref.init_point || pref.sandbox_init_point;
      if (!checkoutUrl) {
        setNotice('Campania guardada como pendiente, pero Mercado Pago no devolvio un link de pago. Revisar credenciales de Mercado Pago o intentar nuevamente.');
        setSubmitting(false);
        await loadCampaigns(currentUser);
        return;
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setNotice(friendlyPanelError(error, 'Error creando campaña'));
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
      await readJsonResponse(response, 'No se pudo dar de baja');
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
      const data = await readJsonResponse(res, 'No se pudieron sincronizar campanias');
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
  const previewAspectRatio = slotAspectRatio(selectedSlot?.dimensions);
  const isRepublishing = Boolean(republishingId && !editingId);
  const submitCta = editingId
    ? 'Guardar cambios del banner'
    : isRepublishing
      ? 'Republicar y pagar con Mercado Pago'
      : 'Crear campaña y pagar con Mercado Pago';
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

  if (!authChecked || !user) {
    return (
      <div className="cc-panel-page" style={styles.page}>
        <GlobalHeader />
        <main className="cc-panel-wrap" style={styles.wrap}>
          <section style={styles.authCard}>
            <div style={styles.kicker}>PANEL DE EMPRESAS</div>
            <h1 style={styles.authTitle}>Inicia sesion para crear campanas</h1>
            <p style={styles.authText}>Te estamos llevando al login. Despues de ingresar volves automaticamente al panel de publicidad.</p>
            <a href={`/login?next=${encodeURIComponent(router.asPath || '/publicidad/panel')}`} style={styles.primaryLogin}>Ir al login</a>
          </section>
        </main>
        <FooterBlueBar />
      </div>
    );
  }

  return (
    <div className="cc-panel-page" style={styles.page}>
      <GlobalHeader />
      <main className="cc-panel-wrap" style={styles.wrap}>
        <section className="cc-panel-hero" style={styles.hero}>
          <div>
            <div style={styles.kicker}>PANEL DE EMPRESAS</div>
            <h1 style={styles.title}>Subí tu banner, pagá y activalo automáticamente</h1>
            <p style={styles.subtitle}>Flujo listo para anunciantes: carga de creatividad, selección de plan, cobro con Mercado Pago y publicación automática por slot.</p>
            <div className="cc-panel-quick-nav" style={styles.quickNav}>
              <a href='/publicidad' style={styles.quickSecondary}>Landing publicitaria</a>
              <a href='/panel-empresas' style={styles.quickSecondary}>Panel empresas</a>
              <a href='/dashboard/company' style={styles.quickSecondary}>Dashboard empresa</a>
            </div>
          </div>
          <div className="cc-panel-info-box" style={styles.infoBox}>
            <div><strong>Plan:</strong> {selectedPlan.name}</div>
            <div><strong>Precio prueba:</strong> ARS {selectedPlan.price.toLocaleString('es-AR')}</div>
            <div><strong>Duración:</strong> {selectedPlan.durationDays} días</div>
            <button type="button" onClick={syncCampaigns} style={styles.syncButton}>{syncing ? 'Sincronizando…' : 'Sync campañas'}</button>
          </div>
        </section>

        <section className="cc-panel-stats" style={styles.statsRow}>
          {stats.map((item) => (
            <div key={item.label} style={styles.statCard}>
              <div style={styles.statLabel}>{item.label}</div>
              <div style={styles.statValue}>{item.value}</div>
              <div style={styles.statHint}>{item.hint}</div>
            </div>
          ))}
        </section>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <div className="cc-panel-grid" style={styles.grid}>
          <form className="cc-panel-form" onSubmit={submit} style={styles.form}>
            {isRepublishing ? (
              <div style={styles.republishNotice}>
                Republicar: se copiaron los datos y el banner de la campania anterior. Al confirmar se crea una campania nueva, con nuevo pago y metricas desde cero.
              </div>
            ) : null}
            <h2 style={styles.h2}>{editingId ? 'Editar campaña' : (isRepublishing ? 'Republicar campaña' : 'Nueva campaña')}</h2>
            <input style={styles.input} placeholder="Empresa" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} required />
            <input style={styles.input} placeholder="Título del banner" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <textarea style={{ ...styles.input, minHeight: 110 }} placeholder="Descripción" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <div className="cc-panel-row" style={styles.row}>
              <select style={styles.input} value={form.plan_key} onChange={(e) => setForm((p) => ({ ...p, plan_key: e.target.value }))}>
                {AD_PLANS.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
              </select>
              <select style={styles.input} value={form.slot_key} onChange={(e) => setForm((p) => ({ ...p, slot_key: e.target.value }))}>
                {availableSlots.map((slot) => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
              </select>
            </div>
            <input style={styles.input} placeholder="URL destino" value={form.destination_url} onChange={(e) => setForm((p) => ({ ...p, destination_url: e.target.value }))} required />
            <div className="cc-panel-row" style={styles.row}>
              <input style={styles.input} placeholder="Ver más" value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} />
              <input style={styles.input} placeholder="Contacto" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <input style={styles.input} placeholder="Email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} required />
            <label className="cc-panel-upload" style={styles.uploadBox}>
              <span style={styles.uploadTitle}>{editingId ? 'Cambiar banner' : 'Subir banner'}</span>
              <input type="file" accept="image/*" onChange={onFile} style={{ marginTop: 10 }} required={!editingId && !bannerPreview} />
              <span style={styles.uploadHelp}>{editingId ? 'Reemplaza la imagen sin perder la campaña.' : 'Se guarda en Supabase Storage. La campaña queda pendiente/inactiva y se publica automáticamente al aprobar el pago.'}</span>
            </label>
            <AdCreativeStudio
              form={form}
              selectedSlot={selectedSlot}
              sourceImage={bannerPreview}
              onUseBanner={useGeneratedBanner}
            />
            <div className="cc-panel-slot-preview" style={styles.slotPreviewBox}>
              <div style={styles.slotPreviewCopy}>
                <strong>Ubicacion elegida: {selectedSlot?.label || 'Espacio publicitario'}</strong>
                <span>{selectedSlot?.dimensions || 'Formato automatico'} - Pagina {selectedSlot?.page || 'Casa-Car'}</span>
                <span>El anuncio se mostrara en ese espacio cuando la campana este aprobada y activa.</span>
              </div>
              <a href={locationHref(form.slot_key)} style={styles.previewSlotButton}>Ver donde aparece</a>
            </div>
            <div className="cc-panel-creative-preview" style={styles.creativePreview}>
              <div style={styles.creativePreviewInfo}>
                <strong>Vista previa final del banner</strong>
                <span>Asi queda el PNG en el formato elegido antes de guardarlo.</span>
              </div>
              {bannerPreview ? (
                <div style={{ ...styles.smartPreviewFrame, aspectRatio: previewAspectRatio }}>
                  <img src={bannerPreview} alt="Vista previa del banner" style={styles.smartPreviewImg} />
                </div>
              ) : (
                <div style={styles.previewPlaceholder}>Subi una imagen para ver el espacio elegido.</div>
              )}
            </div>
            {!editingId ? (
              <div style={styles.paymentHelp}>
                Si Mercado Pago deja el boton Pagar en gris, normalmente falta validar el medio de pago, usar una cuenta compradora distinta a la vendedora o completar datos de la cuenta de Mercado Pago. Casa-Car ya crea la preferencia y vuelve por webhook cuando Mercado Pago aprueba.
              </div>
            ) : null}
            <button className="cc-panel-submit" type="submit" disabled={submitting} style={styles.button}>{submitting ? 'Procesando...' : submitCta}</button>
          </form>

          <aside className="cc-panel-sidebar" style={styles.sidebar}>
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
                    <a href={`/publicidad/panel?republicar=${item.id}`} style={styles.inlineLink}>Republicar</a>
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
      <style jsx>{`
        .cc-panel-page,
        .cc-panel-wrap,
        .cc-panel-hero,
        .cc-panel-grid,
        .cc-panel-form,
        .cc-panel-sidebar,
        .cc-panel-info-box,
        .cc-panel-creative-preview {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        .cc-panel-form :global(input),
        .cc-panel-form :global(select),
        .cc-panel-form :global(textarea),
        .cc-panel-form :global(button) {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .cc-panel-upload :global(input[type='file']) {
          width: 100%;
          max-width: 100%;
          white-space: normal;
        }

        @media (max-width: 900px) {
          .cc-panel-hero,
          .cc-panel-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .cc-panel-wrap {
            width: 100% !important;
            padding: 18px 10px 96px !important;
            gap: 18px !important;
          }
          .cc-panel-hero,
          .cc-panel-form,
          .cc-panel-sidebar > :global(*) {
            border-radius: 20px !important;
            padding: 16px !important;
          }
          .cc-panel-hero h1 {
            font-size: clamp(36px, 12vw, 54px) !important;
            line-height: 1.06 !important;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          .cc-panel-hero p {
            font-size: 16px !important;
            line-height: 1.45 !important;
          }
          .cc-panel-quick-nav {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-panel-quick-nav :global(a) {
            width: 100%;
            text-align: center;
          }
          .cc-panel-row,
          .cc-panel-stats {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-panel-slot-preview {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .cc-panel-slot-preview :global(a),
          .cc-panel-submit {
            width: 100%;
            text-align: center;
          }
          .cc-panel-upload :global(input[type='file'])::file-selector-button {
            max-width: 100%;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' },
  wrap: { width: '100%', maxWidth: 1400, margin: '0 auto', padding: '28px 16px 50px', display: 'grid', gap: 24, boxSizing: 'border-box' },
  authCard: { background: '#fff', border: '1px solid #dbeafe', borderRadius: 24, padding: 26, maxWidth: 720, boxShadow: '0 16px 40px rgba(15,23,42,.07)' },
  authTitle: { margin: '0 0 12px 0', color: '#0f172a', fontSize: 34, lineHeight: 1.08 },
  authText: { margin: '0 0 18px 0', color: '#475569', fontSize: 18, lineHeight: 1.5 },
  primaryLogin: { display: 'inline-flex', justifyContent: 'center', textDecoration: 'none', background: '#0f172a', color: '#fff', borderRadius: 14, padding: '13px 18px', fontWeight: 900 },
  hero: { display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.8fr)', gap: 20, background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 24, minWidth: 0, overflow: 'hidden' },
  kicker: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 10px', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', marginBottom: 12 },
  title: { margin: '0 0 12px 0', fontSize: 46, lineHeight: 1, overflowWrap: 'break-word' },
  subtitle: { margin: 0, fontSize: 18, lineHeight: 1.6, color: '#475569' },
  quickNav:{display:'flex',gap:10,flexWrap:'wrap',marginTop:16},
  quickSecondary:{textDecoration:'none',background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',padding:'10px 12px',borderRadius:12,fontWeight:800},
  infoBox: { background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', borderRadius: 20, padding: 20, display: 'grid', gap: 10, alignContent: 'start', minWidth: 0 },
  syncButton: { border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.12)', color:'#fff', borderRadius:12, padding:'12px 14px', fontWeight:900, cursor:'pointer' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap:14 },
  statCard: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, padding:18 },
  statLabel: { color:'#64748b', fontSize:13, fontWeight:800, textTransform:'uppercase' },
  statValue: { color:'#111827', fontSize:30, fontWeight:900, marginTop:8 },
  statHint: { color:'#64748b', fontSize:12, marginTop:4 },
  notice: { background:'#ecfeff', color:'#155e75', border:'1px solid #a5f3fc', borderRadius:16, padding:14, fontWeight:800 },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(280px,.65fr)', gap: 20, alignItems: 'start', minWidth: 0 },
  form: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 22, display: 'grid', gap: 14, minWidth: 0, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' },
  h2: { margin: 0, fontSize: 30 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12, minWidth: 0 },
  input: { width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 12, padding: '14px 16px', fontSize: 15 },
  uploadBox: { border: '1px dashed #94a3b8', borderRadius: 16, padding: 16, background: '#f8fafc', color: '#334155', minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  uploadTitle: { display: 'block', fontWeight: 900 },
  uploadHelp: { display: 'block', marginTop: 8, fontSize: 13, color: '#64748b' },
  slotPreviewBox: { border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  slotPreviewCopy: { display: 'grid', gap: 4, color: '#334155', fontSize: 13, minWidth: 0, overflowWrap: 'break-word' },
  previewSlotButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 999, padding: '9px 12px', fontWeight: 900, fontSize: 13 },
  creativePreview: { display: 'grid', gap: 10, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, padding: 12, minWidth: 0, maxWidth: '100%', overflow: 'hidden' },
  creativePreviewInfo: { display: 'grid', gap: 4, color: '#334155', fontSize: 13 },
  smartPreviewFrame: { position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid #cbd5e1', background: '#0f172a', display: 'grid', placeItems: 'center', width: '100%' },
  smartPreviewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: 'transparent' },
  previewPlaceholder: { padding: 20, textAlign: 'center', color: '#64748b', fontWeight: 800 },
  paymentHelp: { fontSize: 13, lineHeight: 1.45, color: '#475569', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: 12, overflowWrap: 'break-word' },
  republishNotice: { fontSize: 13, lineHeight: 1.45, color: '#155e75', background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 14, padding: 12, fontWeight: 800, overflowWrap: 'break-word' },
  cancelButton: { border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', borderRadius: 999, padding: '8px 10px', fontWeight: 900, cursor: 'pointer' },
  preview: { width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 16, border: '1px solid #dbeafe' },
  button: { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 18px', fontWeight: 900, cursor: 'pointer' },
  sidebar: { display: 'grid', gap: 16, minWidth: 0, maxWidth: '100%' },
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
