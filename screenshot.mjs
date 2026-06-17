import pkg from "/home/codespace/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js";
const { chromium } = pkg;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 3000 } });
await page.goto("http://localhost:3000/debugavatar123", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/avatar-debug-full.png", fullPage: true });
await browser.close();
