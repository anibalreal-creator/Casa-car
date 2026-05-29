export const OWNER_EMAIL = 'anibalreal@hotmail.com';

export function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

export function isOwnerEmail(email = '') {
  return normalizeEmail(email) === OWNER_EMAIL;
}

export function ownerMembership() {
  return {
    plan: 'OWNER_FREE',
    active: true,
    expires_at: null,
    publications: 999999,
    premiumSlots: 999999,
    analytics: true,
    adCampaigns: true,
    hiddenOwnerMode: true,
  };
}
