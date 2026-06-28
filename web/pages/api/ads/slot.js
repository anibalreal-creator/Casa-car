import { normalizeSlotKey } from '../../../lib/adSlots'
import { createClient } from '@supabase/supabase-js'
import { toPublicAdRecord } from '../../../lib/adHelpers'
import { isCampaignLive, syncCampaignStatuses } from '../../../lib/adCampaigns'
import { checkRateLimit } from '../../../lib/server/rateLimit'

function pickWeightedCampaign(campaigns) {
  if (!campaigns.length) return null

  const weighted = campaigns.map((campaign) => {
    const impressions = Number(campaign.impressions || 0)
    const clicks = Number(campaign.clicks || 0)
    const planKey = String(campaign.plan_key || '').toLowerCase()
    const planBonus =
      planKey === 'premium'
        ? 3
        : planKey === 'destacado' || planKey === 'featured'
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!checkRateLimit(req, res, { name: 'ads-slot', limit: 180, windowMs: 60_000 })) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const slot = normalizeSlotKey(req.query.slot || '', '')
  const page = String(req.query.page || 'global').trim()

  if (!slot) {
    return res.status(400).json({ error: 'Falta slot' })
  }

  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return res.status(500).json({ error: 'No se pudo cargar publicidad' })
  }

  const synced = await syncCampaignStatuses(supabase, Array.isArray(data) ? data : [])
  const campaigns = synced.filter((item) => isCampaignLive(item) && normalizeSlotKey(item.slot_key || item.slot || '', '') === slot)
  const campaign = pickWeightedCampaign(campaigns)

  return res.status(200).json({
    campaign: campaign ? toPublicAdRecord(campaign) : null,
    slot,
    page,
    totalCandidates: campaigns.length,
  })
}
