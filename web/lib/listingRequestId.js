export function sanitizeClientRequestId(value) {
  return String(value || '').trim().slice(0, 160);
}

export async function findListingByClientRequestId(supabase, userId, clientRequestId) {
  const requestId = sanitizeClientRequestId(clientRequestId);
  if (!requestId || !userId) return null;

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .eq('specs_json->>client_request_id', requestId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
