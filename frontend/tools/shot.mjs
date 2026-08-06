import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Self-verification screenshot tool.
 *
 * Runs OUTSIDE the interactive Browser pane (which cannot composite frames
 * in this environment) via a real headless Chromium, so what this captures
 * is genuinely what renders — this is how the cramped/overlapping card bug
 * should have been caught the first time.
 *
 * Usage:
 *   node shot.mjs <url> <outPath> [width] [height] [role]
 *   role: "oncologist" | "patient" | "none" (default: none — no login)
 */

const url = process.argv[2] || 'http://localhost:5173';
const out = process.argv[3] || 'shot.png';
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);
const role = process.argv[6] || 'none';

const STATE_FILE = fileURLToPath(new URL(`./.auth-${role}.json`, import.meta.url));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  storageState: role !== 'none' && existsSync(STATE_FILE) ? STATE_FILE : undefined,
});
const page = await context.newPage();

if (role !== 'none' && !existsSync(STATE_FILE)) {
  await page.goto('http://localhost:5173/enter', { waitUntil: 'networkidle' });
  await page.getByText(role === 'oncologist' ? "I'm a doctor" : "I'm a patient").click();
  await page.fill('input[type="email"]', role === 'oncologist' ? 'doctor@example.com' : 'patient@example.com');
  await page.fill('input[type="password"]', 'anything');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await context.storageState({ path: STATE_FILE });
}

// Only errors from the actual page under test count — not anything transient
// during the login helper flow above, which isn't what's being verified.
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
// 'networkidle' only guarantees the .glb *fetch* finished — GLTFLoader still
// has to parse the binary, bake/normalize the geometry and get it through a
// React re-render onto the GPU, which routinely takes longer than a typical
// UI settle time. Too short a wait here silently screenshots the fallback
// figure mid-swap and reads as a broken model when nothing is actually wrong.
await page.waitForTimeout(2500);
await page.screenshot({ path: out, fullPage: false });

// Report every element whose bounding box overflows the viewport or has a
// suspiciously tiny size relative to its own content — this is exactly the
// class of bug (cramped, overlapping, off-screen) that a text-only DOM
// check misses but a screenshot catches.
const overflow = await page.evaluate(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bad = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right > vw + 40 || r.bottom > vh + 400 || r.left < -40) {
      bad.push({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 40),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  });
  return bad.slice(0, 15);
})
await browser.close();

console.log(errors.length ? `CONSOLE_ERRORS: ${JSON.stringify(errors)}` : 'console: OK');
console.log(overflow.length ? `LAYOUT_OVERFLOW: ${JSON.stringify(overflow)}` : 'layout: no overflow detected');
