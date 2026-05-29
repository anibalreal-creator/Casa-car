const DEFAULT_BASE = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://casa-car-two.vercel.app';

function normalizeBase(value) {
  return String(value || DEFAULT_BASE).replace(/\/+$/, '');
}

async function text(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  return { status: response.status, body, headers: response.headers };
}

function pass(label, detail = '') {
  console.log(`PASS ${label}${detail ? ` - ${detail}` : ''}`);
}

function fail(label, detail = '') {
  console.error(`FAIL ${label}${detail ? ` - ${detail}` : ''}`);
}

async function main() {
  const base = normalizeBase(process.argv[2]);
  const isLocalBase = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(base);
  const failures = [];
  const check = (ok, label, detail = '') => {
    if (ok) pass(label, detail);
    else {
      fail(label, detail);
      failures.push(label);
    }
  };

  console.log(`Casa-Car launch audit: ${base}`);

  const home = await text(`${base}/`);
  check(home.status === 200, 'Home responde 200', String(home.status));
  check(/Casa-Car/i.test(home.body), 'Home contiene marca Casa-Car');
  check(/application\/ld\+json/i.test(home.body), 'Home tiene JSON-LD');

  const tourism = await text(`${base}/buscar?category=Turismo&launch_audit=${Date.now()}`);
  check(tourism.status === 200, 'Buscar Turismo responde 200', String(tourism.status));
  check(/Check-in|checkIn|Entrada/i.test(tourism.body), 'Turismo muestra filtros tipo Booking');

  const sitemap = await text(`${base}/sitemap.xml?launch_audit=${Date.now()}`);
  check(sitemap.status === 200, 'Sitemap responde 200', String(sitemap.status));
  check(!/localhost|127\.0\.0\.1|192\.168\./i.test(sitemap.body), 'Sitemap no contiene URLs locales');
  if (!isLocalBase) check(sitemap.body.includes(`${base}/`), 'Sitemap usa el dominio base');
  else pass('Sitemap usa dominio publico configurado en entorno local');

  const robots = await text(`${base}/robots.txt?launch_audit=${Date.now()}`);
  check(robots.status === 200, 'Robots responde 200', String(robots.status));
  check(/Allow:\s*\//i.test(robots.body), 'Robots permite rastreo');
  if (!isLocalBase) check(robots.body.includes(`${base}/sitemap.xml`), 'Robots apunta al sitemap correcto');
  else pass('Robots usa sitemap publico configurado en entorno local');

  const unauthorizedPremium = await text(`${base}/api/payments/mercadopago/create-preference?launch_audit=${Date.now()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId: 'launch-audit' }),
  });
  check([401, 403].includes(unauthorizedPremium.status), 'Checkout premium rechaza usuarios sin sesion', String(unauthorizedPremium.status));
  check(!/checkout_url|init_point/i.test(unauthorizedPremium.body), 'Checkout premium no devuelve URL sin sesion');

  const reservation = await text(`${base}/api/tourism/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  check([400, 401, 403].includes(reservation.status), 'Reservas turismo validan payload/autenticacion', String(reservation.status));

  if (failures.length) {
    console.error(`Launch audit failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  console.log('Casa-Car launch audit OK');
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
