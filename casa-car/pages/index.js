import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Últimos anuncios
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsErr, setListingsErr] = useState('');

  // Limpia hash viejo del navegador (#error=... otp_expired) para que no te rompa la app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash && window.location.hash.includes('error=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Carga de anuncios: siempre desde la misma app (Vercel o local), evitando hardcodear localhost.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setListingsLoading(true);
      setListingsErr('');
      try {
        const res = await fetch('/api/listings');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setListings(Array.isArray(json) ? json : (json?.data || []));
      } catch (e) {
        if (!cancelled) setListingsErr(e?.message || 'Error cargando anuncios');
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Si ya hay sesión, redirige a /dashboard
  useEffect(() => {
    let sub = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) window.location.href = '/dashboard';

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) window.location.href = '/dashboard';
      });
      sub = listener?.subscription;
    }

    init();
    return () => { sub?.unsubscribe?.(); };
  }, []);

  // (ya se cargan los anuncios arriba; evitamos doble fetch)

  function resetMessages() {
    setMsg('');
    setErr('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.session) {
        setMsg('Login correcto ✅');
        window.location.href = '/dashboard';
      } else {
        setMsg('Login OK, pero no llegó sesión. Revisá consola/network.');
      }
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data?.session) {
        setMsg('Usuario creado y logueado ✅');
        window.location.href = '/dashboard';
      } else {
        setMsg('Usuario creado ✅. Revisá tu email para confirmar (si está activado).');
      }
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? window.location.origin + '/'
          : 'http://localhost:3000/';

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;

      setMsg('Te mandé el email de recuperación ✅ (mirá spam/promociones).');
    } catch (e2) {
      setErr(e2?.message ?? String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif' }}>
      <h1>Casa-Car</h1>
      <p>Marketplace de inmuebles y autos (venta / alquiler) con USD / ARS / BRL.</p>

      <div style={{ border: '1px solid #ccc', padding: 16, width: 420, maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0 }}>
          {mode === 'login' && 'Ingresar'}
          {mode === 'signup' && 'Crear usuario'}
          {mode === 'reset' && 'Recuperar contraseña'}
        </h3>

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset}>
          <div style={{ marginBottom: 8 }}>
            <input
              style={{ width: '100%', padding: 8 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@dominio.com"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div style={{ marginBottom: 8 }}>
              <input
                style={{ width: '100%', padding: 8 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={busy}>
              {busy ? '...' : (mode === 'login' ? 'Ingresar' : mode === 'signup' ? 'Crear' : 'Enviar email')}
            </button>

            {mode !== 'login' && (
              <button type="button" onClick={() => { setMode('login'); resetMessages(); }}>
                Volver
              </button>
            )}
          </div>
        </form>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => { setMode('signup'); resetMessages(); }}>
                Crear usuario
              </button>
              <button type="button" onClick={() => { setMode('reset'); resetMessages(); }}>
                Olvidé mi contraseña
              </button>
            </>
          )}
        </div>

        {msg && <p style={{ marginTop: 12, color: 'green' }}>{msg}</p>}
        {err && <p style={{ marginTop: 12, color: 'crimson' }}>{err}</p>}

        <hr />
        <small>
          Tip: si ves en la URL <code>#error=otp_expired</code>, refrescá y se limpia solo.
        </small>
      </div>

      <h2 style={{ marginTop: 32 }}>Últimos anuncios</h2>

      {listingsLoading && <p>Cargando anuncios...</p>}
      {listingsErr && (
        <p style={{ color: 'crimson' }}>
          Error cargando anuncios: {listingsErr}
        </p>
      )}

      {!listingsLoading && !listingsErr && listings.length === 0 && (
        <p>No hay anuncios todavía.</p>
      )}

      {!listingsLoading && !listingsErr && listings.length > 0 && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {listings.map((it) => (
            <a
              key={it.id ?? it.uuid ?? JSON.stringify(it)}
              href={it.id ? `/anuncio/${it.id}` : '#'}
              style={{
                display: 'block',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong>{it.titulo ?? it.title ?? 'Anuncio'}</strong>
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                {it.precio != null ? `Precio: ${it.precio}` : (it.price != null ? `Precio: ${it.price}` : '')}
              </div>
              <div style={{ opacity: 0.8 }}>
                {it.ubicacion ?? it.location ?? ''}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
