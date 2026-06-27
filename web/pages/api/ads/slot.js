import { normalizeSlotKey } from '../../../lib/adSlots'
import { createClient } from '@supabase/supabase-js'
import { toPublicAdRecord } from '../../../lib/adHelpers'
import { isCampaignLive } from '../../../lib/adCampaigns'
import { checkRateLimit } from '../../../lib/server/rateLimit'

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
    .select('id,title,company_name,plan_key,plan,slot_key,slot,banner_url,destination_url,cta_text,status,active,starts_at,ends_at,created_at,impressions,clicks')
    .or(`slot.eq.${slot},slot_key.eq.${slot}`)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    return res.status(500).json({ error: 'No se pudo cargar publicidad' })
  }

  const campaigns = (Array.isArray(data) ? data : []).filter(isCampaignLive)
  const campaign = pickWeightedCampaign(campaigns)

  return res.status(200).json({
    campaign: campaign ? toPublicAdRecord(campaign) : null,
    slot,
    page,
    totalCandidates: campaigns.length,
  })
}
