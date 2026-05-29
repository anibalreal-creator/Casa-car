export async function trackImpression(adId) {
  if (!adId) return;
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        campaignId: adId,
        type: 'impression'
      })
    });
  } catch (error) {
    console.error('trackImpression error', error);
  }
}

export async function trackClick(adId) {
  if (!adId) return;
  try {
    await fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        campaignId: adId,
        type: 'click'
      })
    });
  } catch (error) {
    console.error('trackClick error', error);
  }
}
