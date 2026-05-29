import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { requireUser } from '../../../../lib/auth';
import { isAdmin } from '../../../../lib/permissions';
import { ok, fail, methodNotAllowed } from '../../../../lib/api';

export default async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!(await isAdmin(user.id))) return res.status(403).json({ error: 'Solo admin' });
    const supabase = getSupabaseServer();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select('id,display_name,email,role,verified,created_at').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return ok(res, data || []);
    }

    if (req.method === 'PATCH') {
      const { id, role, verified } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Falta id' });
      const payload = {};
      if (role) payload.role = role;
      if (typeof verified === 'boolean') payload.verified = verified;
      const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      return ok(res, data);
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo gestionar usuarios');
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
