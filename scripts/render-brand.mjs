// Renders public/og.jpg and public/apple-touch-icon.png from the Choguild mark. Run: node scripts/render-brand.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const f = (w) =>
  `@font-face{font-family:'Geist Sans';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/geist-sans/files/geist-sans-latin-${w}-normal.woff2`).toString("base64")}) format('woff2')}`;
const FONTS = `<style>${f(400)}${f(600)}</style>`;
const mark = (c, sw = 2.5) =>
  `<svg viewBox="0 0 24 24" fill="none"><path d="M17.66 6.34A8 8 0 1 0 17.66 17.66" stroke="${c}" stroke-width="${sw}"/><path d="M12 9.25 14.75 12 12 14.75 9.25 12Z" fill="${c}"/></svg>`;
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;background:#050505;font-family:'Geist Sans',system-ui,sans-serif;color:#f4f3f7;display:flex;flex-direction:column;justify-content:space-between;padding:84px 96px;box-sizing:border-box;background-image:radial-gradient(60% 50% at 50% -10%,rgba(140,130,220,.16),transparent 70%)">
${FONTS}
<div style="display:flex;align-items:center;gap:18px"><div style="width:52px;height:52px">${mark("#f4f3f7")}</div><span style="font-size:34px;font-weight:600;letter-spacing:-.02em">Choguild</span></div>
<div><div style="font-size:96px;font-weight:600;letter-spacing:-.05em;line-height:1.04;max-width:1040px">Get work and<br>earn your rank.</div>
<div style="margin-top:30px;font-size:26px;color:#9a98a4">Find work, prove it, climb the ladder.</div></div></body></html>`);
await p.evaluate(async () => {
  await document.fonts.load('600 84px "Geist Sans"');
  await document.fonts.load('400 26px "Geist Sans"');
  await document.fonts.ready;
});
console.log(await p.evaluate(() => document.fonts.check('600 84px "Geist Sans"')));
await p.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 90 });
await p.setViewportSize({ width: 180, height: 180 });
await p.setContent(
  `<body style="margin:0;width:180px;height:180px;background:#0a0a0b;display:flex;align-items:center;justify-content:center"><div style="width:120px;height:120px">${mark("#f4f3f7")}</div></body>`,
);
await p.screenshot({ path: "public/apple-touch-icon.png" });
await b.close();
