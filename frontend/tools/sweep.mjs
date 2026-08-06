import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/**
 * Captures every screen, in both themes, at desktop and mobile.
 *
 * This exists because "check the website on your own" cannot be done by
 * reading code. Every shot here is a real composited frame from a real
 * browser, and the console/overflow report beside it is what turns a
 * screenshot into a defect list.
 */

const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';
const problems = [];

const browser = await chromium.launch();

async function newPage(theme, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  // The app defaults to an EXPLICIT dark preference, so it deliberately
  // ignores the OS setting — seeding colorScheme alone silently produced four
  // "light" runs that were really dark, and reported them as passing. The
  // stored preference is what actually drives the theme, so seed that.
  await context.addInitScript((t) => {
    window.localStorage.setItem(
      'ao.preferences',
      JSON.stringify({
        state: {
          theme: t,
          language: 'en',
          dateFormat: 'dd-mmm-yyyy',
          timeFormat: '24h',
          timeZone: 'UTC',
        },
        version: 0,
      }),
    );
  }, theme);
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`CONSOLE ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`PAGEERROR ${String(e)}`));
  return { context, page };
}

async function settle(page, ms = 2200) {
  await page.waitForTimeout(ms);
}

/** Flags anything painted outside the viewport horizontally. */
async function overflowReport(page, tag) {
  const bad = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // The Entry's marquee is deliberately wider than the viewport — that is
      // what makes it a marquee. Anything inside it is not an overflow defect.
      if (el.closest('.cinema-marquee')) return;
      if (r.right > vw + 2 || r.left < -2) {
        out.push(`${el.tagName}.${(el.className || '').toString().slice(0, 30)} x=${Math.round(r.x)} w=${Math.round(r.width)}`);
      }
    });
    return out.slice(0, 6);
  });
  if (bad.length) problems.push(`OVERFLOW [${tag}] ${bad.join(' | ')}`);
}

async function shot(page, name, tag) {
  await overflowReport(page, tag);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

async function signIn(page, role, email) {
  await page.goto(`${BASE}/enter`, { waitUntil: 'networkidle' });
  await page.getByText(role === 'oncologist' ? "I'm a doctor" : "I'm a patient").click();
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'anything');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// One theme by decision — see design/use-theme.ts. Sweeping a light pass now
// would screenshot the same dark render twice and call it coverage.
const THEMES = ['dark'];
const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const sfx = `${theme}-${vp.label}`;

    // --- Entry / auth (signed out) ---
    {
      const { context, page } = await newPage(theme, vp.width, vp.height);
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await settle(page, 6000);
      await shot(page, `01-entry-${sfx}`, `entry ${sfx}`);

      await page.goto(`${BASE}/enter`, { waitUntil: 'networkidle' });
      await settle(page);
      await shot(page, `02-auth-roles-${sfx}`, `auth-roles ${sfx}`);

      await page.getByText("I'm a doctor").click();
      await settle(page, 900);
      await shot(page, `03-auth-form-${sfx}`, `auth-form ${sfx}`);
      await context.close();
    }

    // --- Patient session ---
    {
      const { context, page } = await newPage(theme, vp.width, vp.height);
      await signIn(page, 'patient', 'patient@example.com');
      await settle(page);
      await shot(page, `10-patient-home-${sfx}`, `patient-home ${sfx}`);
      await context.close();
    }

    // --- Oncologist session ---
    {
      const { context, page } = await newPage(theme, vp.width, vp.height);
      // A patient must exist before a Patient Space can be shown, and the mock
      // store only creates one at a patient's own first sign-in. Same browser
      // context, so the record persists into the oncologist's session.
      await signIn(page, 'patient', 'patient@example.com');
      await page.evaluate(() => localStorage.removeItem('ao.session.v1'));
      await signIn(page, 'oncologist', 'doctor@example.com');
      await settle(page, 6000);
      await shot(page, `20-practice-${sfx}`, `practice ${sfx}`);

      await page.goto(`${BASE}/account`, { waitUntil: 'networkidle' });
      await settle(page);
      await shot(page, `21-account-${sfx}`, `account ${sfx}`);

      // Intent Bar
      await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
      await settle(page, 1200);
      await page.keyboard.press('Control+k');
      await settle(page, 900);
      await shot(page, `22-intentbar-${sfx}`, `intentbar ${sfx}`);
      await page.keyboard.press('Escape');

      // A real patient space, via a patient created in this same store.
      const store = await page.evaluate(() => localStorage.getItem('ao.mock-store.v1'));
      const parsed = JSON.parse(store || '{"patients":[]}');
      const id = parsed.patients?.[0]?.id;
      if (id) {
        const tabs = ['', '?tab=evidence', '?tab=understanding', '?tab=actions', '?tab=guidance', '?tab=information'];
        for (const [i, t] of tabs.entries()) {
          await page.goto(`${BASE}/patient/${id}${t}`, { waitUntil: 'networkidle' });
          await settle(page, 2200);
          await shot(page, `3${i}-patient-${t.replace(/[?=]/g, '') || 'journey'}-${sfx}`, `patient${t} ${sfx}`);
        }
      } else {
        problems.push(`NO PATIENT RECORD to view patient space (${sfx})`);
      }
      await context.close();
    }
  }
}

await browser.close();

console.log(problems.length ? problems.join('\n') : 'no console errors, no horizontal overflow');
