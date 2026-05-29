export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "https://casa-car-two.vercel.app",
  ];

  for (const value of candidates) {
    const normalized = normalizeSiteUrl(value);
    if (!normalized) continue;
    if (process.env.VERCEL && isLocalOrPrivateUrl(normalized)) continue;
    return normalized;
  }

  return "https://casa-car-two.vercel.app";
}

function normalizeSiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

function isLocalOrPrivateUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "::1" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return true;
  }
}
