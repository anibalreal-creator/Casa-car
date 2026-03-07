import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!ignore) {
        setEmail(session?.user?.email ?? '');
        setLoading(false);
      }
      if (!session && !ignore) {
        window.location.href = '/';
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial' }}>
      <h1>Dashboard</h1>
      <p>Logueado como: <b>{email}</b></p>
      <button onClick={logout}>Salir</button>
      <hr />
      <p>Si llegaste acá, la sesión está OK.</p>
    </div>
  );
}
