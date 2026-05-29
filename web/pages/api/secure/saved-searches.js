import { getSupabaseServer } from '../../../lib/supabaseServer';
import { requireUser } from '../../../lib/auth';
import { parseOrThrow, savedSearchSchema } from '../../../lib/validation';
import { ok, fail, methodNotAllowed } from '../../../lib/api';

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const supabase = getSupabaseServer();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return ok(res, data || []);
    }

    if (req.method === 'POST') {
      const payload = parseOrThrow(savedSearchSchema, req.body || {});
      const { data, error } = await supabase.from('saved_searches').insert({ ...payload, user_id: user.id }).select('*').single();
      if (error) throw error;
      return ok(res, data, 201);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return ok(res, { ok: true });
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo guardar la búsqueda');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};
