const PLAN_DAYS = {
  OWNER_FREE: 30,
  FREE: 7,
  PRO: 30,
  DESTACADO: 15,
  PREMIUM: 30,
  BUSINESS: 60,
  INMOBILIARIA: 90,
  CONCESIONARIA: 90,
};

export function getFeaturedDays(planKey, fallback = 30) {
  const key = String(planKey || '').trim().toUpperCase();
  return PLAN_DAYS[key] || Number(fallback || 30);
}

export function plusDaysIso(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString();
}

export function buildFeaturedUpdate({ planKey = 'PRO', days } = {}) {
  const durationDays = Number(days || getFeaturedDays(planKey, 30));
  const nowIso = new Date().toISOString();
  const untilIso = plusDaysIso(durationDays);
  return {
    durationDays,
    nowIso,
    untilIso,
    listingUpdate: {
      status: 'active',
      is_premium: true,
      highlighted: true,
      premium_plan: planKey,
      premium_until: untilIso,
      premium_expires_at: untilIso,
    },
    anuncioUpdate: {
      destacado: true,
      fecha_destacado: nowIso,
      duracion_destacado: durationDays,
    },
  };
}

export function buildExpireFeaturedUpdate() {
  return {
    listingUpdate: {
      status: 'expired',
      is_premium: false,
      highlighted: false,
      premium_plan: null,
      premium_until: null,
      premium_expires_at: null,
    },
    anuncioUpdate: {
      destacado: false,
      fecha_destacado: null,
    },
  };
}

export async function mirrorFeaturedState(supabase, listingId, mode, options = {}) {
  const id = String(listingId || '').trim();
  if (!id) throw new Error('Falta listingId');

  if (mode === 'activate') {
    const payload = buildFeaturedUpdate(options);
    const listingRes = await supabase
      .from('listings')
      .update(payload.listingUpdate)
      .eq('id', id)
      .select('*')
      .single();

    try {
      await supabase.from('anuncios').update(payload.anuncioUpdate).eq('id', id);
    } catch (_) {}

    return { data: listingRes.data, error: listingRes.error, featured: payload };
  }

  if (mode === 'expire') {
    const payload = buildExpireFeaturedUpdate();
    const listingRes = await supabase
      .from('listings')
      .update(payload.listingUpdate)
      .eq('id', id)
      .select('*')
      .single();

    try {
      await supabase.from('anuncios').update(payload.anuncioUpdate).eq('id', id);
    } catch (_) {}

    return { data: listingRes.data, error: listingRes.error, featured: payload };
  }

  throw new Error('Modo inválido para mirrorFeaturedState');
}
