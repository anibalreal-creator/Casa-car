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
      const [reports, verificationRequests] = await Promise.all([
        supabase.from('listing_reports').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('verification_requests').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      return ok(res, {
        reports: reports.data || [],
        verificationRequests: verificationRequests.data || [],
      });
    }

    if (req.method === 'PATCH') {
      const { table, id, status } = req.body || {};
      if (!table || !id || !status) return res.status(400).json({ error: 'Faltan datos' });
      if (!['listing_reports', 'verification_requests'].includes(table)) return res.status(400).json({ error: 'Tabla inválida' });
      const { data, error } = await supabase.from(table).update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq('id', id).select('*').single();
      if (error) throw error;
      return ok(res, data);
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo gestionar moderación');
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
