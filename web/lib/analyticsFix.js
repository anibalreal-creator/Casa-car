
export async function trackEvent(supabase, data) {
  // Compatibilidad columnas
  const payload = {
    campaign_id: data.campaign_id || null,
    event_type: data.event_type || data.tipo_evento || null,
    slot: data.slot || null,
    page: data.page || null,
  };

  return supabase.from('analytics_events').insert([payload]);
}
