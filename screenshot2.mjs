import pkg from "/home/codespace/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js";
const { chromium } = pkg;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 3000 } });
await page.goto("http://localhost:3000/debugavatar123", { waitUntil: "networkidle" });

const frames = await page.locator(".avatar-frame.h-40").all();
console.log("found", frames.length, "preview frames");
for (let i = 0; i < frames.length; i++) {
  await frames[i].screenshot({ path: `/tmp/preview-${i}.png` });
  const html = await frames[i].innerHTML();
  console.log(`=== preview ${i} === html length ${html.length}`);
  console.log(html.slice(0, 1500));
  console.log("...\n");
}
await browser.close();
