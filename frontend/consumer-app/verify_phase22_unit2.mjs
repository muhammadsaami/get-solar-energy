import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_shots'
const OUT = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
mkdirSync(SHOTS, { recursive: true })
mkdirSync(OUT, { recursive: true })

// ---- seeded admin login ----
const login = await fetch(`${API}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@getsolar.in', password: 'Admin@5678' }),
}).then((r) => r.json())
if (!login?.token) { console.error('ADMIN LOGIN FAILED', JSON.stringify(login)); process.exit(1) }
const user = { id: 1, email: 'admin@getsolar.in', name: 'Platform Admin', role: 'admin', displayRole: 'Admin', phone: '', city: '', avatar: '', subscriptionTier: 'Admin' }

// ---- removed mission-control / mock telemetry decor (admin page) ----
const REMOVED_TEXT = {
  'mission scope PROD badge': 'PROD / ASIA-SOUTH-1',
  'mission scope cluster name': 'GET-SOLAR-CORE',
  'mission scope cluster id': 'CLUSTER-PRIMARY-01',
  'fake uptime stat': 'Uptime:',
  'fake mesh latency stat': 'Mesh Latency:',
  'fake latency value': '18.4ms',
  'sync cluster wording': 'Sync Cluster',
  'workload queue tab': 'Workload Queue',
  'service mesh tab': 'Service Mesh',
  'audit terminal tab': 'Audit Terminal',
  'mock workload id': 'WRK-9401',
  'mock service node': 'PostgreSQL Primary Pool',
  'directives card': 'Directives & Execution',
  'ai anomaly radar card': 'AI Anomaly Detection Radar',
  'copilot chip': 'COPILOT',
  'geographic fleet coverage card': 'Geographic Fleet Coverage',
  'mock geo city': 'Bangalore Metro',
  'operational control center console': 'Operational Control Center',
  'dense on wording': 'Dense: ON',
}

const REMOVED_SEL = {
  'telemetry tiles grid': '.ew-telemetry-grid',
  'service mesh grid': '.ew-service-mesh-grid',
  'mission live-dot': '.ew-mission-scope .ew-live-dot',
  'audit terminal box': '.ew-audit-stream-box',
}

// ---- kept real functional content ----
const KEPT_SEL = {
  'hero title Command Center': '.tab-heading',
  'hero primary Sync Dashboard': '.tab-header-block button.btn-primary',
  'operational status bar': '.ew-mission-bar',
  'incidents & alerts card': '.ew-workbench-card',
  'activity search input': 'input[placeholder="Filter activity..."]',
  'quick nav primary CRM Leads': '.ew-workbench-card button.btn-primary',
  'quick nav overflow select': '.ew-workbench-card select[aria-label="More actions"]',
  'metric cards': '.card-metric',
  'card-grid-4 row': '.card-grid-4',
}

const KEPT_TEXT = {
  'platform stat': 'Platform:',
  'active leads stat': 'Active Leads:',
  'critical incidents stat': 'Critical Incidents:',
  'last synced stat': 'Last Synced:',
  'incidents & alerts section': 'Incidents & Alerts',
  'pipeline funnel section': 'Pipeline Funnel',
  'recent activity section': 'Recent Activity',
  'executive summary section': 'Executive Summary',
  'system health section': 'System Health',
  'geographic coverage section': 'Geographic Coverage',
  'quick navigation section': 'Quick Navigation',
  'dispatch survey techs button': 'Dispatch Survey Techs',
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

await page.addInitScript(
  ({ token, user }) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },
  { token: login.token, user }
)

const results = {}

async function checkPage(name, path, opts = {}) {
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
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2500)
    entry.actualUrl = page.url()
    entry.redirected = !page.url().startsWith(BASE + path)

    const probe = await page.evaluate(({ removedText, removedSel, keptSel, keptText }) => {
      const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim()
      const lowerBody = bodyText.toLowerCase()
      const present = (sel) => !!document.querySelector(sel)
      const removedTextState = {}
      for (const [label, text] of Object.entries(removedText)) removedTextState[label] = lowerBody.includes(text.toLowerCase())
      const removedSelState = {}
      for (const [label, sel] of Object.entries(removedSel)) removedSelState[label] = present(sel)
      const keptState = {}
      for (const [label, sel] of Object.entries(keptSel)) keptState[label] = present(sel)
      const keptTextState = {}
      for (const [label, text] of Object.entries(keptText)) keptTextState[label] = lowerBody.includes(text.toLowerCase())
      const metricCards = document.querySelectorAll('.card-metric').length
      const kpiLabels = Array.from(document.querySelectorAll('.card-metric .card-metric-label')).map((el) => el.textContent.trim())
      const purpleUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-purple|#7c5dfa|#8b5cf6/g) || []).length
      const cyanUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-cyan|#17a8e5|#06b6d4|#22d3ee/g) || []).length
      const overflowOpts = Array.from(document.querySelectorAll('select[aria-label="More actions"] option')).map((o) => o.textContent.trim())
      return { removedTextState, removedSelState, keptState, keptTextState, metricCards, kpiLabels, purpleUsage, cyanUsage, overflowOpts }
    }, { removedText: REMOVED_TEXT, removedSel: REMOVED_SEL, keptSel: KEPT_SEL, keptText: KEPT_TEXT })

    // removed elements MUST be absent
    for (const [label, found] of Object.entries(probe.removedTextState)) {
      entry.total++
      const ok = !found
      if (ok) entry.pass++
      entry.checks[`removedText:${label}`] = ok
    }
    for (const [label, found] of Object.entries(probe.removedSelState)) {
      entry.total++
      const ok = !found
      if (ok) entry.pass++
      entry.checks[`removedSel:${label}`] = ok
    }

    // kept elements MUST be present
    for (const [label, exists] of Object.entries(probe.keptState)) {
      entry.total++
      if (exists) entry.pass++
      entry.checks[`kept:${label}`] = exists
    }
    for (const [label, exists] of Object.entries(probe.keptTextState)) {
      entry.total++
      if (exists) entry.pass++
      entry.checks[`keptText:${label}`] = exists
    }

    // KPI row: exactly 4 cards above the fold
    entry.checks['kpis:exactly 4 metric cards'] = probe.metricCards === 4
    entry.total++
    if (entry.checks['kpis:exactly 4 metric cards']) entry.pass++
    entry.checks['kpis:labels present'] = probe.kpiLabels.length === 4 && probe.kpiLabels.every((l) => l.length > 0)
    entry.total++
    if (entry.checks['kpis:labels present']) entry.pass++

    // frozen-token discipline: no purple/violet/cyan on admin page
    entry.checks['colors:no purple/violet usage'] = probe.purpleUsage === 0
    entry.total++
    if (entry.checks['colors:no purple/violet usage']) entry.pass++
    entry.checks['colors:no cyan usage'] = probe.cyanUsage === 0
    entry.total++
    if (entry.checks['colors:no cyan usage']) entry.pass++

    // overflow menu exposes remaining nav routes
    entry.checks['nav:overflow has remaining routes'] = ['MLOps Hub', 'Settings'].every((r) => probe.overflowOpts.includes(r))
    entry.total++
    if (entry.checks['nav:overflow has remaining routes']) entry.pass++

    // health
    entry.checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (entry.checks['health:no console errors']) entry.pass++
    entry.checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (entry.checks['health:no network issues']) entry.pass++
    entry.consoleErrors = consoleErrors
    entry.networkIssues = networkIssues

    await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: true })
    entry.screenshot = `${SHOTS}\\${name}.png`
    entry.score = Math.round((entry.pass / Math.max(1, entry.total)) * 100)
  } catch (e) {
    entry.error = String(e).slice(0, 300)
    entry.score = 0
  }

  results[name] = entry
  const mark = entry.score >= 95 ? 'PASS' : entry.score >= 80 ? 'WARN' : 'FAIL'
  console.log(`${mark.padEnd(5)} ${name.padEnd(22)} score=${String(entry.score).padStart(3)}  ${entry.pass}/${entry.total}${entry.error ? ' ERR ' + entry.error : ''}`)
  return entry
}

async function checkNav(name, path, expectedRoute) {
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
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2500)

    const probe = await page.evaluate(() => ({
      mainRendered: !!document.querySelector('.ew-page, main, .tab-content'),
      hasHeading: (document.body.innerText.match(/Audit|Monitoring|Settings|Configuration/i) || []).length > 0,
    }))

    entry.checks['nav:page rendered'] = probe.mainRendered
    entry.total++
    if (probe.mainRendered) entry.pass++
    entry.checks['nav:has page heading'] = probe.hasHeading
    entry.total++
    if (probe.hasHeading) entry.pass++
    entry.checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (entry.checks['health:no console errors']) entry.pass++
    entry.checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (entry.checks['health:no network issues']) entry.pass++
    entry.consoleErrors = consoleErrors
    entry.networkIssues = networkIssues

    await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: true })
    entry.screenshot = `${SHOTS}\\${name}.png`
    entry.score = Math.round((entry.pass / Math.max(1, entry.total)) * 100)
  } catch (e) {
    entry.error = String(e).slice(0, 300)
    entry.score = 0
  }

  results[name] = entry
  const mark = entry.score >= 95 ? 'PASS' : entry.score >= 80 ? 'WARN' : 'FAIL'
  console.log(`${mark.padEnd(5)} ${name.padEnd(22)} score=${String(entry.score).padStart(3)}  ${entry.pass}/${entry.total}${entry.error ? ' ERR ' + entry.error : ''}`)
  return entry
}

await checkPage('admin-dashboard', '/app/admin/dashboard')
await checkNav('admin-nav-audit', '/app/audit/monitoring')
await checkNav('admin-nav-settings', '/app/account/settings')

await browser.close()

writeFileSync(`${OUT}\\unit2_verification.json`, JSON.stringify(results, null, 2))
console.log('\nREPORT: ' + `${OUT}\\unit2_verification.json`)
