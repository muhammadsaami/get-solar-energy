import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8000/api';
const OUT = 'C:\\Users\\mhhaq\\AppData\\Local\\Temp\\opencode\\phase21_shots';

mkdirSync(OUT, { recursive: true });

const email = `ui_verify_${Date.now().toString().slice(-8)}@getsolar.com`;
const password = 'VerifyPass123!';

const signup = await fetch(`${API}/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name: 'UI Verify', phone: '9876543210', city: 'Lucknow', role: 'customer' }),
}).then((r) => r.json());

if (!signup.success) {
  console.error('SIGNUP FAILED', JSON.stringify(signup));
  process.exit(1);
}

const user = {
  id: signup.user.id,
  email: signup.user.email,
  name: signup.user.name,
  role: 'customer',
  displayRole: 'Customer',
  phone: '9876543210',
  city: 'Lucknow',
  avatar: '',
  subscriptionTier: 'Customer',
};

const routes = [
  ['home', '/app/home'],
  ['journey', '/app/journey'],
  ['bill-analyzer', '/app/bill-analyzer'],
  ['roof-analyzer', '/app/roof-analysis'],
  ['proposal', '/app/planning/proposal'],
  ['roi-calculator', '/app/roi-calculator'],
  ['ai-advisor', '/app/ai-advisor'],
  ['enterprise-ai', '/app/enterprise-ai'],
  ['knowledge-base', '/app/knowledge-base'],
  ['rewards', '/app/support/referrals'],
  ['activity-center', '/app/activity-center'],
  ['reports-center', '/app/ownership/reports'],
  ['system-performance', '/app/system-performance'],
  ['amc', '/app/amc'],
  ['account-profile', '/app/account/profile'],
  ['account-settings', '/app/account/settings'],
  ['support-help', '/app/support/help'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') console.log(`[console.error] ${msg.text().slice(0, 300)}`);
});
page.on('pageerror', (err) => console.log(`[pageerror] ${String(err).slice(0, 300)}`));

await page.addInitScript(
  ({ token, user }) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  { token: signup.token, user }
);

for (const [name, path] of routes) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    const title = await page.title().catch(() => 'n/a');
    const url = page.url();
    const heading = await page.locator('h1').first().textContent().catch(() => 'n/a');
    await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: true });
    console.log(`OK  ${name.padEnd(18)} url=${url} h1="${heading}" title="${title}"`);
  } catch (e) {
    await page.screenshot({ path: `${OUT}\\${name}_ERROR.png` }).catch(() => {});
    console.log(`ERR ${name.padEnd(18)} ${String(e).slice(0, 200)}`);
  }
}

await browser.close();
console.log('DONE');
