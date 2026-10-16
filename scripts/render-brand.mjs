// Renders public/og.jpg and public/apple-touch-icon.png from the Choguild mark. Run: node scripts/render-brand.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const f = (w) =>
  `@font-face{font-family:'Geist Sans';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/geist-sans/files/geist-sans-latin-${w}-normal.woff2`).toString("base64")}) format('woff2')}`;
const FONTS = `<style>${f(400)}${f(600)}</style>`;
const mark = (c, sw = 2.5) =>
  `<svg viewBox="0 0 24 24" fill="none"><path d="M17.66 6.34A8 8 0 1 0 17.66 17.66" stroke="${c}" stroke-width="${sw}"/><path d="M12 9.25 14.75 12 12 14.75 9.25 12Z" fill="${c}"/></svg>`;
const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;background:#050507;font-family:'Geist Sans',system-ui,sans-serif;color:#f4f3f7;display:flex;flex-direction:column;justify-content:space-between;padding:84px 96px;box-sizing:border-box;position:relative;overflow:hidden">
<div style="position:absolute;width:640px;height:640px;right:-160px;top:-260px;border-radius:50%;background:rgba(131,110,249,.30);filter:blur(110px)"></div><div style="position:absolute;width:420px;height:420px;left:-160px;bottom:-200px;border-radius:50%;background:rgba(110,84,240,.18);filter:blur(100px)"></div>
<svg style="position:absolute;right:-120px;top:-180px" width="760" height="760" viewBox="0 0 760 760">${Array.from({length:12},(_,i)=>`<circle cx="380" cy="380" r="${40+i*30}" fill="none" stroke="#836EF9" stroke-opacity="${(0.28-i*0.018).toFixed(3)}" stroke-width="1"/>`).join('')}</svg>
<div style="position:absolute;inset:56px 64px;border-radius:36px;background:rgba(131,110,249,.07);border:1px solid rgba(165,148,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(20px)"></div>
${FONTS}
<div style="position:relative;display:flex;align-items:center;gap:18px"><div style="width:52px;height:52px">${mark("#f4f3f7")}</div><span style="font-size:34px;font-weight:600;letter-spacing:-.02em">Choguild</span></div>
<div style="position:relative"><div style="font-size:96px;font-weight:600;letter-spacing:-.05em;line-height:1.04;max-width:1040px">Get work and<br>earn your <em style="font-style:italic;color:#a594ff">rank.</em></div>
<div style="margin-top:30px;font-size:26px;color:#bcb4e0">Find work, prove it, climb the ladder.</div></div></body></html>`);
await p.evaluate(async () => {
  await document.fonts.load('600 84px "Geist Sans"');
  await document.fonts.load('400 26px "Geist Sans"');
  await document.fonts.ready;
});
console.log(await p.evaluate(() => document.fonts.check('600 84px "Geist Sans"')));
await p.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 90 });
await p.setViewportSize({ width: 180, height: 180 });
await p.setContent(
  `<body style="margin:0;width:180px;height:180px;background:#050507;background-image:radial-gradient(circle at 50% 40%,rgba(131,110,249,.35),transparent 70%);display:flex;align-items:center;justify-content:center"><div style="width:120px;height:120px">${mark("#f4f3f7")}</div></body>`,
);
await p.screenshot({ path: "public/apple-touch-icon.png" });
await b.close();
