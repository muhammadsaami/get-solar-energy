import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8000/api';
const OUT = 'C:\\Users\\mhhaq\\AppData\\Local\\Temp\\opencode\\phase21_verify';
const SHOTS = 'C:\\Users\\mhhaq\\AppData\\Local\\Temp\\opencode\\phase21_shots';

mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

// ---- create a fresh session ----
const email = `verify_${Date.now().toString().slice(-8)}@getsolar.com`;
const signup = await fetch(`${API}/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'VerifyPass123!', name: 'UI Verify', phone: '9876543210', city: 'Lucknow', role: 'customer' }),
}).then((r) => r.json());
if (!signup.success) { console.error('SIGNUP FAILED', JSON.stringify(signup)); process.exit(1); }
try { const p = JSON.parse(Buffer.from(signup.token.split('.')[1], 'base64').toString()); console.log('TOKEN exp=', p.exp, 'expired=', p.exp * 1000 < Date.now()); } catch (e) { console.log('token parse err', e.message); }

const user = { id: signup.user.id, email: signup.user.email, name: signup.user.name, role: 'customer', displayRole: 'Customer', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Customer' };

// ---- canonical token expectations (frozen original) ----
const TOKENS = {
  sidebarWidth: '280px',
  headerHeight: '80px',
  fontFamily: 'Outfit',
  bgCard: 'rgba(8, 24, 42, 0.82)',
  textPrimary: 'rgb(240, 248, 255)',
  colorBlue: 'rgb(23, 168, 229)',
  colorOrange: 'rgb(255, 138, 29)',
  colorGreen: 'rgb(54, 211, 153)',
  blurGlass: 'blur(20px)',
  radiusSm: '8px',
  radiusLg: '16px',
};

// ---- per-page assertions ----
const PAGES = {
  'home': {
    path: '/app/home',
    requires: ['.dashboard-grid', '.kpi-widget, .sub-kpi-widget', '.card-base', 'header.header', '.sidebar', '.kpi-value-text'],
    designCheck: '.kpi-widget, .card-base',
  },
  'bill-analyzer': {
    path: '/app/bill-analyzer',
    requires: ['.card-base', '.kpi-title', '.form-input, input', 'header.header', '.sidebar'],
    designCheck: '.card-base',
  },
  'roof-analyzer': {
    path: '/app/roof-analysis',
    requires: ['header.header', '.sidebar', '.card-base', '.kpis-stack-column'],
    designCheck: '.card-base',
  },
  'roi-calculator': {
    path: '/app/roi-calculator',
    requires: ['header.header', '.sidebar', '.card-base', '.shadow-lift'],
    designCheck: '.card-base',
  },
  'proposal': {
    path: '/app/planning/proposal',
    requires: ['header.header', '.sidebar', '.card-base'],
    designCheck: '.card-base',
  },
  'ai-advisor': {
    path: '/app/ai-advisor',
    requires: ['header.header', '.sidebar', '.card-base'],
    designCheck: '.card-base',
  },
  'enterprise-ai': {
    path: '/app/enterprise-ai',
    requires: ['header.header', '.sidebar', '.card-base'],
    designCheck: '.card-base',
  },
  'rewards': {
    path: '/app/support/referrals',
    requires: ['header.header', '.sidebar', '.card-base', '.shadow-lift', '.rewards-kpi-grid'],
    designCheck: '.card-base',
  },
  'activity-center': {
    path: '/app/activity-center',
    requires: ['header.header', '.sidebar', '.card-base', '.timeline-container, .timeline-line, .activity-feed'],
    designCheck: '.card-base',
  },
  'reports-center': {
    path: '/app/ownership/reports',
    requires: ['header.header', '.sidebar', '.card-base', '.reports-templates-grid, .report-card, .template-card'],
    designCheck: '.card-base',
  },
  'system-performance': {
    path: '/app/system-performance',
    requires: ['header.header', '.sidebar', '.card-base', '.perf-progress-list, .kpi-value-text, .grid-2-col'],
    designCheck: '.card-base',
  },
  'amc': {
    path: '/app/amc',
    requires: ['header.header', '.sidebar', '.card-base', '.amc-timeline-card', '.amc-timeline-step'],
    designCheck: '.card-base',
  },
  'account-settings': {
    path: '/app/account/settings',
    requires: ['header.header', '.sidebar', '.card-base'],
    designCheck: '.card-base',
  },
  'support-help': {
    path: '/app/support/help',
    requires: ['header.header', '.sidebar', '.card-base'],
    designCheck: '.card-base',
  },
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.addInitScript(
  ({ token, user }) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  { token: signup.token, user }
);

const results = {};

for (const [name, cfg] of Object.entries(PAGES)) {
  const consoleErrors = [];
  const networkIssues = [];
  let layoutShifts = 0;

  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('requestfailed');
  page.removeAllListeners('response');

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 250));
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 250)));
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.startsWith(BASE) && !url.includes('sockjs') && !url.includes('@vite')) {
      networkIssues.push(`FAILED ${req.method()} ${url.replace(BASE, '')} ${req.failure()?.errorText || ''}`);
    }
  });
  page.on('response', (resp) => {
    const url = resp.url();
    if (!url.startsWith(BASE)) return;
    const s = resp.status();
    if (s >= 500) networkIssues.push(`HTTP ${s} ${resp.request().method()} ${url.replace(BASE, '')}`);
    if (s === 404) networkIssues.push(`HTTP 404 ${url.replace(BASE, '')}`);
  });

  const entry = { checks: {}, pass: 0, total: 0, consoleErrors: [], networkIssues: [], score: 0 };

  try {
    await page.goto(`${BASE}${cfg.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    await page.waitForLoadState('load').catch(() => {});
    if (name === Object.keys(PAGES)[0]) {
      console.log('DEBUG url=', page.url(), 'ls=', await page.evaluate(() => JSON.stringify({ token: !!localStorage.getItem('access_token'), user: localStorage.getItem('user') })));
    }

    entry.actualUrl = page.url();
    entry.redirected = !page.url().startsWith(BASE + '/app/');

    // ---------- LAYOUT ----------
    const layout = await page.evaluate(({ sidebarWidth, headerHeight }) => {
      const sidebar = document.querySelector('.sidebar');
      const header = document.querySelector('header.header, .header');
      const main = document.querySelector('.main-panel');
      const root = getComputedStyle(document.documentElement);
      return {
        sidebarW: sidebar ? getComputedStyle(sidebar).width : null,
        headerH: header ? getComputedStyle(header).height : null,
        mainMarginLeft: main ? getComputedStyle(main).marginLeft : null,
        mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : null,
        tokenSidebar: root.getPropertyValue('--sidebar-width').trim(),
        tokenHeader: root.getPropertyValue('--header-height').trim(),
        hasSidebar: !!sidebar,
        hasHeader: !!header,
      };
    }, { sidebarWidth: TOKENS.sidebarWidth, headerHeight: TOKENS.headerHeight });

    const layoutPasses = [
      ['sidebar present', layout.hasSidebar],
      ['sidebar width ~= token (280px)', layout.sidebarW === TOKENS.sidebarWidth || layout.sidebarW === '280px'],
      ['--sidebar-width token == 280px', layout.tokenSidebar === TOKENS.sidebarWidth],
      ['header present', layout.hasHeader],
      ['header height ~= token (80px)', layout.headerH === TOKENS.headerHeight || layout.headerH === '80px'],
      ['--header-height token == 80px', layout.tokenHeader === TOKENS.headerHeight],
      ['main panel has left margin (sidebar offset)', !!layout.mainMarginLeft && parseFloat(layout.mainMarginLeft) >= 250],
    ];
    layoutPasses.forEach(([name2, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['layout:' + name2] = ok; });

    // ---------- RESPONSIVE BREAKPOINTS (mobile + tablet) ----------
    const responsive = {};
    for (const [vp, w, h] of [['mobile', 375, 812], ['tablet', 768, 1024]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const doc = document.documentElement;
        const sidebar = document.querySelector('.sidebar');
        const header = document.querySelector('header.header, .header');
        return {
          overflowX: doc.scrollWidth - doc.clientWidth,
          sidebarW: sidebar ? getComputedStyle(sidebar).width : null,
          sidebarTransform: sidebar ? getComputedStyle(sidebar).transform : null,
          headerH: header ? getComputedStyle(header).height : null,
        };
      });
      responsive[vp] = r;
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(800);
    }
    const mobile = responsive.mobile;
    const tablet = responsive.tablet;
    const responsivePasses = [
      ['mobile: no horizontal scrollbar', mobile.overflowX <= 0],
      ['mobile: sidebar off-canvas (drawer)', (mobile.sidebarTransform || '') !== 'none'],
      ['tablet: no horizontal scrollbar', tablet.overflowX <= 0],
      ['tablet: sidebar off-canvas (drawer)', (tablet.sidebarTransform || '') !== 'none'],
    ];
    responsivePasses.forEach(([name2, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['responsive:' + name2] = ok; });
    entry.responsive = responsive;

    // ---------- DESIGN SYSTEM (computed styles from tokens) ----------
    const design = await page.evaluate((tokens) => {
      const sel = document.querySelector(tokens.designCheck);
      if (!sel) return { missing: true };
      const cs = getComputedStyle(sel);
      const root = getComputedStyle(document.documentElement);
      return {
        missing: false,
        bg: cs.backgroundColor,
        blur: cs.backdropFilter,
        radius: cs.borderRadius,
        border: cs.borderTopColor,
        font: cs.fontFamily,
        weight: cs.fontWeight,
        boxShadow: cs.boxShadow,
        tokenBg: root.getPropertyValue('--bg-card').trim(),
        tokenFont: root.getPropertyValue('--font-family').trim(),
        tokenText: root.getPropertyValue('--text-primary').trim(),
        tokenBlue: root.getPropertyValue('--color-blue').trim(),
        tokenOrange: root.getPropertyValue('--color-orange').trim(),
        tokenGreen: root.getPropertyValue('--color-green').trim(),
        tokenViolet: root.getPropertyValue('--color-violet').trim(),
        tokenTeal: root.getPropertyValue('--color-teal').trim(),
        tokenBlur: root.getPropertyValue('--blur-glass').trim(),
      };
    }, { designCheck: cfg.designCheck });

    const designPasses = [
      ['design element present', !design.missing],
      ['bg resolves to token value', design.tokenBg === TOKENS.bgCard && design.tokenBg.length > 0],
      ['font is Outfit', (design.font || '').toLowerCase().includes('outfit')],
      ['--text-primary token == #f0f8ff', design.tokenText === 'var(--text-primary)' || design.tokenText === '#f0f8ff' || design.tokenText === 'rgb(240, 248, 255)'],
      ['--color-blue token == #17a8e5', design.tokenBlue === '#17a8e5'],
      ['--color-orange token == #ff8a1d', design.tokenOrange === '#ff8a1d'],
      ['--color-green token == #36d399', design.tokenGreen === '#36d399'],
      ['--color-violet token present', design.tokenViolet === '#8b5cf6'],
      ['--color-teal token present', design.tokenTeal === '#14b8a6'],
      ['--blur-glass token == 20px', design.tokenBlur === '20px'],
    ];
    designPasses.forEach(([name2, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['design:' + name2] = ok; });

    // ---------- COMPONENTS ----------
    const comps = await page.evaluate((required) => {
      const out = {};
      for (const sel of required) out[sel] = !!document.querySelector(sel);
      // generic component presence
      out['any button'] = !!document.querySelector('button');
      out['any svg'] = !!document.querySelector('svg');
      out['any input'] = !!document.querySelector('input, textarea, select');
      return out;
    }, cfg.requires);

    for (const [sel, ok] of Object.entries(comps)) {
      entry.total++; if (ok) entry.pass++;
      entry.checks['component:' + sel] = ok;
    }

    // ---------- BROWSER HEALTH ----------
    const health = await page.evaluate(() => {
      const results2 = { scrollW: 0, scrollH: 0, docClientW: 0, brokenSvg: 0, overflowEls: [], clipped: 0 };
      results2.docClientW = document.documentElement.clientWidth;
      results2.scrollW = window.scrollX + document.documentElement.scrollWidth - document.documentElement.clientWidth;
      results2.scrollH = document.documentElement.scrollHeight;
      document.querySelectorAll('svg').forEach((s) => {
        const b = s.getBoundingClientRect();
        const inView = b.top < window.innerHeight && b.bottom > 0 && b.left < window.innerWidth && b.right > 0;
        if (inView && (b.width === 0 || b.height === 0)) results2.brokenSvg++;
      });
      const horzOverflow = document.querySelectorAll('*');
      let over = 0;
      horzOverflow.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > results2.docClientW + 2) over++;
      });
      results2.overflowEls.push(over);
      return results2;
    });

    const healthPasses = [
      ['no horizontal overflow', health.overflowEls[0] === 0],
      ['no broken SVGs (0-size)', health.brokenSvg === 0],
      ['no console errors', consoleErrors.length === 0],
      ['no network 4xx/5xx (excluding auth)', networkIssues.filter((n) => !n.includes('401')).length === 0],
    ];
    healthPasses.forEach(([name2, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['health:' + name2] = ok; });
    entry.consoleErrors = consoleErrors;
    entry.networkIssues = networkIssues;

    // ---------- SCREENSHOT ----------
    await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: true });
    entry.screenshot = `${SHOTS}\\${name}.png`;

    // ---------- SCORE ----------
    entry.score = Math.round((entry.pass / Math.max(1, entry.total)) * 100);
  } catch (e) {
    entry.error = String(e).slice(0, 300);
    entry.score = 0;
  }

  results[name] = entry;
  const mark = entry.redirected ? 'REDIR' : entry.score >= 90 ? 'PASS' : 'DRIFT';
  console.log(`${mark.padEnd(5)} ${name.padEnd(18)} score=${String(entry.score).padStart(3)}  ${entry.pass}/${entry.total}  ${entry.redirected ? '-> ' + entry.actualUrl : ''}${entry.error ? ' ERR ' + entry.error : ''}`);
}

await browser.close();

writeFileSync(`${OUT}\\verification.json`, JSON.stringify(results, null, 2));
console.log('\nREPORT: ' + `${OUT}\\verification.json`);




