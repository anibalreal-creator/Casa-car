const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "social", "campana-lanzamiento");
fs.mkdirSync(outDir, { recursive: true });

const logoPath = path.join(root, "public", "branding", "casa-car-logo-square.png");
const logo = fs.readFileSync(logoPath).toString("base64");
const logoData = `data:image/png;base64,${logo}`;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function campaignSvg({ width, height, format }) {
  const isStory = format === "story";
  const isFeed = format === "feed";
  const pad = isStory ? 74 : 58;
  const headline = isStory
    ? ["Publica gratis", "en Casa-Car"]
    : isFeed
      ? ["Casa-Car ya", "esta online"]
    : ["Casa-Car ya esta online"];
  const sub = isStory
    ? "Propiedades, autos, servicios y oportunidades reales con boton directo a WhatsApp."
    : "Marketplace para propiedades, autos, servicios y turismo. Primeros anuncios gratis.";
  const cardW = width - pad * 2;
  const logoSize = isStory ? 150 : 120;
  const h1Size = isStory ? 102 : format === "landscape" ? 58 : 78;
  const subSize = isStory ? 39 : 36;
  const urlY = height - (isStory ? 170 : 120);
  const bottomText = isStory ? "Visita casa-car.com" : "Visita casa-car.com y publica ahora";
  const headlineStartY = isStory ? pad + 330 : format === "landscape" ? pad + 238 : pad + 285;
  const subStartY = isStory ? pad + 585 : isFeed ? pad + 470 : pad + 300;
  const subLineGap = format === "landscape" ? 38 : subSize * 1.35;
  const chipY = isStory ? pad + 790 : isFeed ? pad + 560 : pad + 374;
  const miniCards = format === "landscape"
    ? []
    : isStory
    ? [
        { x: pad, y: height - 560, title: "3 avisos", body: "gratis" },
        { x: pad + cardW / 2 + 18, y: height - 560, title: "WhatsApp", body: "directo" },
        { x: pad, y: height - 350, title: "Fotos", body: "ubicacion y precio" },
        { x: pad + cardW / 2 + 18, y: height - 350, title: "Publica", body: "en minutos" },
      ]
    : [
        { x: pad + 30, y: height - 340, title: "Propiedades", body: "venta y alquiler" },
        { x: pad + 320, y: height - 340, title: "Autos", body: "avisos con fotos" },
        { x: pad + 610, y: height - 340, title: "Servicios", body: "contacto directo" },
      ];
  const miniW = isStory ? (cardW - 18) / 2 : 250;
  const miniH = isStory ? 150 : 145;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#071226"/>
      <stop offset="55%" stop-color="#102a7a"/>
      <stop offset="100%" stop-color="#0058ff"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#00081a" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${width * 0.9}" cy="${height * 0.12}" r="${width * 0.34}" fill="#ffffff" opacity="0.07"/>
  <circle cx="${width * 0.1}" cy="${height * 0.9}" r="${width * 0.42}" fill="#001d69" opacity="0.35"/>
  <rect x="${pad}" y="${pad}" width="${cardW}" height="${height - pad * 2}" rx="44" fill="#071226" filter="url(#shadow)" stroke="#ffffff" stroke-width="4"/>

  <image href="${logoData}" x="${pad + 32}" y="${pad + 32}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  <rect x="${pad + logoSize + 58}" y="${pad + 54}" width="${isStory ? 330 : 265}" height="58" rx="29" fill="#eff6ff"/>
  <text x="${pad + logoSize + 84}" y="${pad + 93}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 33 : 29}" font-weight="800" fill="#1457d9">CASA-CAR</text>
  <rect x="${width - pad - (isStory ? 340 : 295)}" y="${pad + 54}" width="${isStory ? 300 : 255}" height="58" rx="29" fill="#0b1220" stroke="#eff6ff" stroke-width="2"/>
  <text x="${width - pad - (isStory ? 310 : 265)}" y="${pad + 93}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 29 : 27}" font-weight="700" fill="#eff6ff">Marketplace global</text>

  ${headline
    .map(
      (line, index) =>
        `<text x="${pad + 34}" y="${headlineStartY + index * (isStory ? 108 : 92)}" font-family="Arial, Helvetica, sans-serif" font-size="${h1Size}" font-weight="900" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  <text x="${pad + 36}" y="${subStartY}" font-family="Arial, Helvetica, sans-serif" font-size="${format === "landscape" ? 30 : subSize}" fill="#dbeafe">
    ${sub
      .split(" ")
      .reduce(
        (lines, word) => {
          const last = lines[lines.length - 1];
          const maxChars = isStory ? 38 : format === "landscape" ? 60 : width <= 1000 ? 46 : 58;
          if ((last + " " + word).length > maxChars) lines.push(word);
          else lines[lines.length - 1] = last ? `${last} ${word}` : word;
          return lines;
        },
        [""]
      )
      .map((line, i) => `<tspan x="${pad + 36}" dy="${i === 0 ? 0 : subLineGap}">${escapeXml(line)}</tspan>`)
      .join("")}
  </text>

  <rect x="${pad + 36}" y="${chipY}" width="${isStory ? 385 : isFeed ? 360 : 330}" height="${isStory ? 82 : 70}" rx="${isStory ? 41 : 35}" fill="#ffffff"/>
  <text x="${pad + 68}" y="${chipY + (isStory ? 54 : 45)}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 35 : 31}" font-weight="900" fill="#071226">${isStory ? "3 anuncios gratis" : "Anuncios gratis"}</text>
  <rect x="${isStory ? pad + 450 : isFeed ? pad + 430 : pad + 405}" y="${chipY}" width="${isStory ? 410 : 285}" height="${isStory ? 82 : 70}" rx="${isStory ? 41 : 35}" fill="#19c96b"/>
  <text x="${isStory ? pad + 490 : isFeed ? pad + 464 : pad + 439}" y="${chipY + (isStory ? 54 : 45)}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 35 : 31}" font-weight="900" fill="#ffffff">WhatsApp directo</text>

  ${miniCards
    .map(
      (c) => `<g>
        <rect x="${c.x}" y="${c.y}" width="${miniW}" height="${miniH}" rx="26" fill="#ffffff" opacity="0.96"/>
        <rect x="${c.x + 24}" y="${c.y + 22}" width="${miniW - 48}" height="38" rx="19" fill="#eaf2ff"/>
        <text x="${c.x + 28}" y="${c.y + 98}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 34 : 27}" font-weight="900" fill="#071226">${escapeXml(c.title)}</text>
        <text x="${c.x + 28}" y="${c.y + 132}" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 25 : 22}" fill="#475569">${escapeXml(c.body)}</text>
      </g>`
    )
    .join("\n  ")}

  <rect x="${pad + 36}" y="${urlY}" width="${cardW - 72}" height="${isStory ? 94 : 78}" rx="${isStory ? 47 : 39}" fill="#ffffff"/>
  <text x="${width / 2}" y="${urlY + (isStory ? 61 : 51)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${isStory ? 43 : 38}" font-weight="900" fill="#071226">${escapeXml(bottomText)}</text>
</svg>`;
}

const variants = [
  { name: "casa-car-feed-1080x1350.png", width: 1080, height: 1350, format: "feed" },
  { name: "casa-car-story-1080x1920.png", width: 1080, height: 1920, format: "story" },
  { name: "casa-car-landscape-1200x628.png", width: 1200, height: 628, format: "landscape" },
  { name: "casa-car-pinterest-pin-1000x1500.png", width: 1000, height: 1500, format: "feed" },
  { name: "casa-car-square-1200x1200.png", width: 1200, height: 1200, format: "feed" },
  { name: "casa-car-facebook-cover-1640x924.png", width: 1640, height: 924, format: "landscape" },
];

(async () => {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const executablePath = fs.existsSync(chromePath)
    ? chromePath
    : fs.existsSync(edgePath)
      ? edgePath
      : undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage();
  for (const variant of variants) {
    const svg = campaignSvg(variant);
    const svgPath = path.join(outDir, variant.name.replace(".png", ".svg"));
    const pngPath = path.join(outDir, variant.name);
    fs.writeFileSync(svgPath, svg);
    await page.setViewportSize({ width: variant.width, height: variant.height });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: pngPath, omitBackground: false });
    console.log(pngPath);
  }
  await browser.close();
})();
