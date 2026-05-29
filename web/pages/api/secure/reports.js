import { getSupabaseServer } from '../../../lib/supabaseServer';
import { requireUser } from '../../../lib/auth';
import { parseOrThrow, reportSchema } from '../../../lib/validation';
import { ok, fail, methodNotAllowed } from '../../../lib/api';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServer();
    if (req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { data, error } = await supabase.from('listing_reports').select('*').eq('reporter_user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return ok(res, data || []);
    }

    if (req.method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const payload = parseOrThrow(reportSchema, req.body || {});
      const { data, error } = await supabase.from('listing_reports').insert({
        ...payload,
        reporter_user_id: user.id,
        status: 'pending',
      }).select('*').single();
      if (error) throw error;
      return ok(res, data, 201);
    }

    return methodNotAllowed(res);
  } catch (error) {
    return fail(res, error, 'No se pudo enviar el reporte');
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
