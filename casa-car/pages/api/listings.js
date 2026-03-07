import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (usa las mismas variables NEXT_PUBLIC_* que ya tenés)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error:
        'Faltan variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.',
    });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ajustá el nombre de la tabla si en tu DB se llama distinto.
  // Intento con "listings" (lo que tu frontend busca) y, si falla por tabla inexistente,
  // pruebo con "anuncios".
  const tryTables = ['listings', 'anuncios'];

  for (const table of tryTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) {
      return res.status(200).json(data || []);
    }

    // Si el error no es por tabla inexistente, cortamos.
    const msg = String(error?.message || '');
    const looksLikeMissingTable =
      msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('does not exist');
    if (!looksLikeMissingTable) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(500).json({ error: 'No se encontró ninguna tabla (listings/anuncios).' });
}
