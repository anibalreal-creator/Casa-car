import { isCampaignLive } from './campaignStatus';

export function getActiveBanners(campaigns = [], slot = "") {
  return (campaigns || [])
    .filter((item) => {
      if (!item) return false;
      if (slot && String(item.slot || item.slot_key || "") !== String(slot)) return false;
      return isCampaignLive(item);
    })
    .sort((a, b) => {
      const priority = { premium: 3, destacado: 2, basico: 1 };
      return (priority[String(b?.plan || "").toLowerCase()] || 0) -
             (priority[String(a?.plan || "").toLowerCase()] || 0);
    });
}
