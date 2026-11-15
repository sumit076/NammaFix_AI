// End-to-end check of the demo scenario in a real browser.
// Usage: npm i --no-save puppeteer-core && npm run dev   (in another shell)  &&  node scripts/e2e.mjs
import puppeteer from 'puppeteer-core';

const URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/';
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = 'docs/screens';

let failed = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  → ' + extra : ''}`);
  if (!ok) failed++;
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 1100 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const clickText = async (sel, text) => {
  const ok = await page.evaluate(
    (sel, text) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.replace(/\s+/g, ' ').trim().includes(text));
      if (!el) return false;
      el.click();
      return true;
    },
    sel,
    text,
  );
  if (!ok) throw new Error(`No ${sel} containing "${text}"`);
};
const bodyText = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await page.goto(URL + '#/report', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  // 1. Citizen reports the pothole in Koramangala
  await clickText('button', 'Load sample pothole report');
  await clickText('button', 'Submit & run AI analysis');
  await page.waitForFunction(() => document.body.innerText.includes('Complaint submitted successfully'), { timeout: 5000 });
  await wait(1500); // let the staged agent animation finish
  const t1 = await bodyText();
  const id = (t1.match(/Your complaint ID: (NF-\d{8}-\d+)/) ?? [])[1];
  check('complaint ID generated', !!id, id);
  check('AI classification = Pothole', /AI classification Pothole/.test(t1));
  check('two similar sample reports found', /2 similar open reports were found/.test(t1));
  check('consolidated into one incident', /grouped into incident NF-DEMO-\d+/.test(t1));
  check('severity is Critical', /Priority Critical/.test(t1), (t1.match(/Priority ([A-Za-z]+ · \d+)/) ?? [])[1] ?? (t1.match(/Critical · \d+/) ?? [])[0]);
  check('routed to Road Maintenance', /Recommended: Road Maintenance Department/.test(t1));
  check('urgent inspection suggested', /Urgent inspection by Road Maintenance Department within 24 h/.test(t1));
  check('human approval notice shown', /Human approval required/.test(t1));
  check('success toast shown', /Complaint NF-\d{8}-\d+ submitted/.test(t1));
  const citizenScore = (t1.match(/Priority (\d+)\/100/) ?? [])[1];
  await page.screenshot({ path: `${SHOTS}/e2e-1-citizen-result.png` });

  // 2. Officer dashboard shows the submission, signs in, approves
  await clickText('nav a', 'Officer Command Centre');
  await page.waitForFunction(() => document.body.innerText.includes('Sign in as Ananya'));
  check('officer gate shown before sign-in', true);
  await clickText('button', 'Sign in as Ananya');
  await page.waitForFunction(() => document.body.innerText.includes('Complaint management'));
  let t2 = await bodyText();
  check('KPI cards present', ['total issues', 'pending approval', 'critical (open)', 'resolved'].every((k) => t2.toLowerCase().includes(k)));
  const pendingBefore = Number((t2.match(/Pending approval (\d+)/i) ?? [])[1]);
  const totalBefore = Number((t2.match(/Total issues (\d+)/i) ?? [])[1]);
  check('detail panel auto-opened with 3 consolidated reports', /Consolidated reports \(3\)/.test(t2));
  check('citizen submission visible in officer view', t2.includes(id) || /NF-DEMO-0001/.test(t2));
  check('same priority score on citizen and officer screens', !!citizenScore && t2.includes(`Priority ${citizenScore}/100`), citizenScore);
  check('all 3 original references retained', [id, 'NF-DEMO-0001', 'NF-DEMO-0002'].every((x) => t2.includes(x)));
  check('Total issues = 20 (new report + 2 sample incidents merged into one)', totalBefore === 20, String(totalBefore));
  await clickText('button', 'Approve recommendation & assign');
  await page.waitForFunction(() => document.body.innerText.includes('Assigned to Road Maintenance Department'));
  await clickText('button', 'In Progress');
  await page.waitForFunction(() => [...document.querySelectorAll('button[aria-pressed="true"]')].some((b) => b.textContent.trim() === 'In Progress'));
  t2 = await bodyText();
  check('approval recorded with officer name', /Approved by Ananya Rao/.test(t2));
  check('status now In Progress', /Status changed: Assigned → In Progress/.test(t2));
  const pendingAfter = Number((t2.match(/Pending approval (\d+)/i) ?? [])[1]);
  check('Pending KPI dropped by 1', pendingAfter === pendingBefore - 1, `${pendingBefore} → ${pendingAfter}`);
  await page.screenshot({ path: `${SHOTS}/e2e-2-officer.png`, fullPage: true });

  // 3. Filters and search work
  await page.type('#q', 'Marathahalli');
  await wait(200);
  const rowsMara = await page.$$eval('tbody tr', (r) => r.length);
  check('search narrows table', rowsMara > 0 && rowsMara < 10, `${rowsMara} rows`);
  await page.$eval('#q', (e) => (e.value = ''));
  await page.click('#q', { clickCount: 3 });
  await page.keyboard.press('Backspace');

  // 4. Impact dashboard reflects state
  await clickText('nav a', 'City Impact');
  await page.waitForFunction(() => document.body.innerText.includes('Ward-wise issue trends'));
  const t3 = await bodyText();
  check('impact shows 27 reports → 20 incidents', /27 reports → 20 incidents/.test(t3));
  check('impact shows 4 in progress', /4 incidents in progress/.test(t3));
  check('impact shows 7 duplicates consolidated', /Duplicates consolidated 7/i.test(t3));
  await page.screenshot({ path: `${SHOTS}/e2e-3-impact.png`, fullPage: true });

  // 5. Persistence across refresh
  await page.reload({ waitUntil: 'networkidle0' });
  const t4 = await bodyText();
  check('state persists after refresh', /27 reports → 20 incidents/.test(t4) && /4 incidents in progress/.test(t4));

  // 6. Error handling: too-short description
  await clickText('nav a', 'Citizen Portal');
  await page.type('#desc', 'bad');
  await clickText('button', 'Submit & run AI analysis');
  await wait(300);
  const t5 = await bodyText();
  check('validation error notification', /Please fix the highlighted fields/.test(t5) && /at least 15 characters/.test(t5));

  check('no browser console/page errors', errors.length === 0, errors.join(' | '));
} catch (e) {
  check('script completed', false, e.message);
  await page.screenshot({ path: `${SHOTS}/e2e-failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
