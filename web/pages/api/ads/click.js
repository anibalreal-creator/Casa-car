import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { campaignId, slot, page } = req.body || {}
  if (!campaignId) return res.status(400).json({ error: 'Falta campaignId' })

  const { data: campaign, error: readError } = await supabase
    .from('ad_campaigns')
    .select('id, clicks')
    .eq('id', campaignId)
    .single()

  if (readError) return res.status(500).json({ error: readError.message })

  const currentClicks = Number(campaign?.clicks || 0)
  const { error: updateError } = await supabase
    .from('ad_campaigns')
    .update({ clicks: currentClicks + 1 })
    .eq('id', campaignId)

  if (updateError) return res.status(500).json({ error: updateError.message })

  const analyticsPayload = {
    event_type: 'click',
    campaign_id: campaignId,
    slot: slot || null,
    page: page || null,
    created_at: new Date().toISOString(),
  }

  await supabase.from('analytics_events').insert(analyticsPayload)

  return res.status(200).json({ ok: true })
}
