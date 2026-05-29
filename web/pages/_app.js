import '../styles/globals.css'
import { LanguageProvider } from '../context/LanguageContext'

export function reportWebVitals(metric) {
  if (typeof window === 'undefined' || !metric?.name) return;

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    label: metric.label,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    path: window.location.pathname,
    href: window.location.href,
    userAgent: window.navigator.userAgent,
  });

  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', blob);
      return;
    }
  } catch {}

  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  )
}
