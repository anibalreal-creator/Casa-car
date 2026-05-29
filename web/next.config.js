/** @type {import('next').NextConfig} */
const { URL } = require('url');

function parseAllowedImageHosts() {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    'https://images.unsplash.com',
    'https://picsum.photos',
    'https://localhost:3000',
  ].filter(Boolean);

  const unique = new Set();
  for (const value of candidates) {
    try {
      const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
      unique.add(`${url.protocol}//${url.hostname}`);
    } catch {
      // ignore malformed env values
    }
  }

  return Array.from(unique).map((origin) => {
    const url = new URL(origin);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      pathname: '/**',
    };
  });
}

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
];

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
].join('; ');

securityHeaders.push({ key: 'Content-Security-Policy', value: contentSecurityPolicy });

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Evita depender del optimizer remoto amplio, que es la parte más sensible del audit.
    unoptimized: true,
    remotePatterns: parseAllowedImageHosts(),
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
