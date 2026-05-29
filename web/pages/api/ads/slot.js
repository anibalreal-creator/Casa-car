import { normalizeSlotKey } from '../../../lib/adSlots'
import { createClient } from '@supabase/supabase-js'

function pickWeightedCampaign(campaigns) {
  if (!campaigns.length) return null

  const weighted = campaigns.map((campaign) => {
    const impressions = Number(campaign.impressions || 0)
    const clicks = Number(campaign.clicks || 0)
    const planBonus =
      campaign.plan === 'Premium' || campaign.plan === 'PREMIUM'
        ? 3
        : campaign.plan === 'Destacado' || campaign.plan === 'DESTACADO'
        ? 2
        : 1

    const freshnessBonus = campaign.created_at ? 1 : 0
    const score = Math.max(1, 20 - impressions + planBonus * 3 + freshnessBonus - clicks)
    return { campaign, score }
  })

  const total = weighted.reduce((sum, item) => sum + item.score, 0)
  let target = Math.random() * total

  for (const item of weighted) {
    target -= item.score
    if (target <= 0) return item.campaign
  }

  return weighted[0].campaign
}

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const slot = normalizeSlotKey(req.query.slot || '', '')
  const page = String(req.query.page || 'global').trim()

  if (!slot) {
    return res.status(400).json({ error: 'Falta slot' })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('slot', slot)
    .eq('active', true)
    .in('status', ['active', 'active_manual', 'active_paid'])
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const campaigns = Array.isArray(data) ? data : []
  const campaign = pickWeightedCampaign(campaigns)

  return res.status(200).json({
    campaign: campaign || null,
    slot,
    page,
    totalCandidates: campaigns.length,
  })
}
