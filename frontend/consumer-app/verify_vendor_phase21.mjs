import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase21_1_shots'
const OUT = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase21_1_verify'
mkdirSync(SHOTS, { recursive: true })
mkdirSync(OUT, { recursive: true })

const email = `vendor_${Date.now().toString().slice(-8)}@getsolar.com`
const signup = await fetch(`${API}/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'VerifyPass123!', name: 'UI Verify', phone: '9876543210', city: 'Lucknow', role: 'vendor' }),
}).then((r) => r.json())
if (!signup?.token) {
  console.error('SIGNUP FAILED', JSON.stringify(signup))
  process.exit(1)
}
const user = { id: signup.user.id, email: signup.user.email, name: signup.user.name, role: 'vendor', displayRole: 'Vendor', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Vendor' }

const TOKENS = {
  sidebarWidth: '270px',
  fontFamily: 'Outfit',
  bgCard: 'rgba(8, 24, 42, 0.82)',
  colorBlue: 'rgb(23, 168, 229)',
  colorOrange: 'rgb(255, 138, 29)',
  colorRed: 'rgb(244, 63, 94)',
  colorTeal: 'rgb(20, 184, 166)',
}

const PAGES = {
  'vendor-dashboard': { path: '/app/vendor/dashboard', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a', '.vendor-bg-mesh'], designCheck: '.vendor-glass-card' },
  'vendor-projects': { path: '/app/vendor/projects', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-customers': { path: '/app/vendor/customers', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-leads': { path: '/app/vendor/leads', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-installations': { path: '/app/vendor/installations', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-teams': { path: '/app/vendor/teams', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-inventory': { path: '/app/vendor/inventory', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-amc': { path: '/app/vendor/amc', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-payments': { path: '/app/vendor/payments', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-reports': { path: '/app/vendor/reports', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-analytics': { path: '/app/vendor/analytics', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-documents': { path: '/app/vendor/documents', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-settings': { path: '/app/vendor/settings', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-profile': { path: '/app/vendor/profile', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
  'vendor-my-work': { path: '/app/vendor/my-work', requires: ['.vendor-portal-root', '.vendor-glass-card', 'nav a'], designCheck: '.vendor-glass-card' },
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.addInitScript(
  ({ token, user }) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
  { token: signup.token, user }
)

const results = {}

for (const [name, cfg] of Object.entries(PAGES)) {
  const consoleErrors = []
  const networkIssues = []

  page.removeAllListeners('console')
  page.removeAllListeners('pageerror')
  page.removeAllListeners('requestfailed')
  page.removeAllListeners('response')

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 250)) })
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 250)))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.startsWith(API)) networkIssues.push(`FAILED ${req.method()} ${url.replace(API, '')} ${req.failure()?.errorText || ''}`)
  })
  page.on('response', (resp) => {
    const url = resp.url()
    if (!url.startsWith(API)) return
    const s = resp.status()
    if (s >= 500) networkIssues.push(`HTTP ${s} ${resp.request().method()} ${url.replace(API, '')}`)
    if (s === 404) networkIssues.push(`HTTP 404 ${url.replace(API, '')}`)
  })

  const entry = { checks: {}, pass: 0, total: 0, consoleErrors: [], networkIssues: [], score: 0 }

  try {
    await page.goto(`${BASE}${cfg.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3500)
    await page.waitForLoadState('load').catch(() => {})

    entry.actualUrl = page.url()
    entry.redirected = !page.url().startsWith(BASE + '/app/vendor/')

    // ---------- LAYOUT ----------
    const layout = await page.evaluate(() => {
      const shell = document.querySelector('.vendor-portal-root')
      const sidebar = document.querySelector('aside')
      const header = document.querySelector('header')
      return {
        hasShell: !!shell,
        sidebarW: sidebar ? getComputedStyle(sidebar).width : null,
        headerH: header ? getComputedStyle(header).height : null,
      }
    })
    const layoutPasses = [
      ['vendor shell present', layout.hasShell],
      ['sidebar width 270px', layout.sidebarW === '270px'],
      ['header present', !!layout.headerH],
    ]
    layoutPasses.forEach(([n, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['layout:' + n] = ok })

    // ---------- RESPONSIVE ----------
    const responsive = {}
    for (const [vp, w, h] of [['mobile', 375, 812], ['tablet', 768, 1024]]) {
      await page.setViewportSize({ width: w, height: h })
      await page.waitForTimeout(1200)
      const r = await page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }))
      responsive[vp] = r
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForTimeout(700)
    }
    const respPasses = [
      ['mobile: no horizontal scrollbar', responsive.mobile.overflowX <= 0],
      ['tablet: no horizontal scrollbar', responsive.tablet.overflowX <= 0],
    ]
    respPasses.forEach(([n, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['responsive:' + n] = ok })
    entry.responsive = responsive

    // ---------- DESIGN SYSTEM ----------
    const design = await page.evaluate((tokens) => {
      const sel = document.querySelector(tokens.designCheck)
      if (!sel) return { missing: true }
      const cs = getComputedStyle(sel)
      const root = getComputedStyle(document.documentElement)
      return {
        missing: false,
        bg: cs.backgroundColor,
        blur: cs.backdropFilter,
        radius: cs.borderRadius,
        font: cs.fontFamily,
        tokenFont: root.getPropertyValue('--font-family').trim(),
        tokenBg: root.getPropertyValue('--bg-card').trim(),
        tokenBlue: root.getPropertyValue('--color-blue').trim(),
        tokenOrange: root.getPropertyValue('--color-orange').trim(),
        tokenRed: root.getPropertyValue('--color-red').trim(),
        tokenTeal: root.getPropertyValue('--color-teal').trim(),
        hasAccentRed: !!document.querySelector('.card-metric.accent-red'),
      }
    }, { designCheck: cfg.designCheck })

    const designPasses = [
      ['design element present', !design.missing],
      ['glass blur applied', (design.blur || '').includes('blur')],
      ['font is Outfit', (design.font || '').toLowerCase().includes('outfit')],
      ['--color-blue token == #17a8e5', design.tokenBlue === '#17a8e5'],
      ['--color-orange token == #ff8a1d', design.tokenOrange === '#ff8a1d'],
      ['--color-red token == #f43f5e', design.tokenRed === '#f43f5e'],
      ['--color-teal token == #14b8a6', design.tokenTeal === '#14b8a6'],
    ]
    designPasses.forEach(([n, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['design:' + n] = ok })

    // ---------- COMPONENTS ----------
    const comps = await page.evaluate((required) => {
      const out = {}
      for (const sel of required) out[sel] = !!document.querySelector(sel)
      out['any button'] = !!document.querySelector('button')
      out['any svg'] = !!document.querySelector('svg')
      out['nav has links'] = (document.querySelectorAll('nav a').length || 0) >= 4
      return out
    }, cfg.requires)
    for (const [sel, ok] of Object.entries(comps)) {
      entry.total++; if (ok) entry.pass++
      entry.checks['component:' + sel] = ok
    }

    // ---------- BROWSER HEALTH ----------
    const health = await page.evaluate(() => {
      const doc = document.documentElement
      let brokenSvg = 0
      document.querySelectorAll('svg').forEach((s) => {
        const b = s.getBoundingClientRect()
        const inView = b.top < window.innerHeight && b.bottom > 0 && b.left < window.innerWidth && b.right > 0
        if (inView && (b.width === 0 || b.height === 0)) brokenSvg++
      })
      return {
        scrollW: doc.scrollWidth - doc.clientWidth,
        brokenSvg,
      }
    })
    const healthPasses = [
      ['no horizontal overflow', health.scrollW <= 0],
      ['no broken in-viewport SVGs', health.brokenSvg === 0],
      ['no console errors', consoleErrors.length === 0],
      ['no network 4xx/5xx (excluding auth)', networkIssues.filter((n) => !n.includes('401')).length === 0],
    ]
    healthPasses.forEach(([n, ok]) => { entry.total++; if (ok) entry.pass++; entry.checks['health:' + n] = ok })
    entry.consoleErrors = consoleErrors
    entry.networkIssues = networkIssues

    // ---------- SCREENSHOT ----------
    await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: true })
    entry.screenshot = `${SHOTS}\\${name}.png`

    entry.score = Math.round((entry.pass / Math.max(1, entry.total)) * 100)
  } catch (e) {
    entry.error = String(e).slice(0, 300)
    entry.score = 0
  }

  results[name] = entry
  const mark = entry.redirected ? 'REDIR' : entry.score >= 90 ? 'PASS' : 'DRIFT'
  console.log(`${mark.padEnd(5)} ${name.padEnd(20)} score=${String(entry.score).padStart(3)}  ${entry.pass}/${entry.total}  ${entry.redirected ? '-> ' + entry.actualUrl : ''}${entry.error ? ' ERR ' + entry.error : ''}`)
}

await browser.close()

writeFileSync(`${OUT}\\verification.json`, JSON.stringify(results, null, 2))
console.log('\nREPORT: ' + `${OUT}\\verification.json`)
