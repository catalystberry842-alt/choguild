// Renders public/bg/hero-{desktop,mobile}.{webp,avif}: thin purple contour arcs on near-black.
// Run: node scripts/render-bg.mjs  (needs Playwright Chromium + python3 Pillow for encoding)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

function svg(w, h, cx, cy) {
  const rings = [];
  // Contour rings, slightly irregular, thinning with distance.
  for (let i = 0; i < 26; i++) {
    const r = 60 + i * 46 + (i % 3) * 6;
    const wobble = 1 + 0.035 * Math.sin(i * 1.7);
    const opacity = (0.22 - i * 0.006).toFixed(3);
    rings.push(`<ellipse cx="${cx}" cy="${cy}" rx="${(r * wobble).toFixed(1)}" ry="${(r * 0.92).toFixed(1)}" fill="none" stroke="#836EF9" stroke-opacity="${opacity}" stroke-width="${i % 5 === 0 ? 1.4 : 0.8}" transform="rotate(${(i * 3) % 18 - 9} ${cx} ${cy})"/>`);
  }
  // A few long arcs sweeping across.
  const arcs = [0.6, 0.9, 1.25].map((k, i) =>
    `<path d="M ${-w * 0.1} ${h * (0.75 + i * 0.08)} Q ${w * 0.45} ${h * (0.2 - i * 0.05)} ${w * 1.1} ${h * (0.55 + i * 0.1)}" fill="none" stroke="#A594FF" stroke-opacity="${0.14 - i * 0.03}" stroke-width="${k}"/>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#050507"/>${rings.join("")}${arcs.join("")}</svg>`;
}

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox"] });
const p = await b.newPage();
for (const [name, w, h, cx, cy] of [["desktop", 2400, 1350, 1750, 320], ["mobile", 900, 1600, 640, 360]]) {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<body style="margin:0;background:#050507">${svg(w, h, cx, cy)}</body>`);
  await p.screenshot({ path: `/tmp/bg-${name}.png` });
  execFileSync("python3", ["-c", `
from PIL import Image
im=Image.open('/tmp/bg-${name}.png').convert('RGB')
im.save('public/bg/hero-${name}.webp','WEBP',quality=70,method=6)
im.save('public/bg/hero-${name}.avif','AVIF',quality=55)
`]);
}
await b.close();
