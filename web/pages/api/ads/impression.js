import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { campaignId, slot, page } = req.body || {}
  if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' })

  const payload = {
    event_type: 'impression',
    campaign_id: campaignId,
    slot: slot || null,
    page: page || null,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('analytics_events').insert(payload)
  if (error) {
    return res.status(200).json({ ok: true, warning: error.message })
  }

  return res.status(200).json({ ok: true })
}
