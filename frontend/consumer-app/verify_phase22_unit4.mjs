import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
const REPORT = `${SHOTS}\\unit4_verification.json`
const OUT_DIR = SHOTS
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const login = await fetch(`${API}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@getsolar.in', password: 'Admin@5678' }),
}).then(r => r.json())

const USER = { id: 1, email: 'admin@getsolar.in', name: 'Platform Admin', role: 'admin', displayRole: 'Admin', phone: '', city: '', avatar: '', subscriptionTier: 'Admin' }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.addInitScript(({ token, user }) => {
  localStorage.setItem('access_token', token)
  localStorage.setItem('user', JSON.stringify(user))
}, { token: login.token, user: USER })

const results = {}

const KEPT_TEXT = {
  'Business Intelligence': 'Business Intelligence',
  'task-first mission': 'each chart answers one business question',
  'kpi customers': 'Total Customers',
  'kpi system value': 'Total System Value',
  'kpi leads': 'Active Leads',
  'kpi payback': 'Avg Payback',
  'filter date': 'Date',
  'filter region': 'Region',
  'export': 'Export KPI Summary',
  'chart q1 improving': 'Are we improving?',
  'chart q2 losing customers': 'Where are we losing customers?',
  'chart q3 region': 'Which region performs best?',
  'chart q4 forecast': 'What should we expect next?',
  'insights section': 'Key Insights',
  'customer directory': 'Customer Directory',
}
const REMOVED_TEXT = {
  'mission bar title': 'BI / EXECUTIVE-ANALYTICS',
  'live dot label': 'LIVE',
  'command bar': 'Command Bar',
  'active accounts telemetry': 'Active Accounts',
  '30d leads telemetry': '30d Leads',
  'pending surveys telemetry': 'Pending Surveys',
  'installations telemetry': 'Installations',
  'section nav executive pill': 'Executive',
  'customer intelligence': 'Customer Intelligence',
  'sales funnel analytics': 'Sales Funnel Analytics',
  'solar operations': 'Solar Operations',
  'vendor intelligence': 'Vendor Intelligence',
  'geographic intelligence': 'Geographic Intelligence',
  'forecasting title': 'Forecasting',
  'ai business insights': 'AI Business Insights',
  'revenue forecast marketing': 'Revenue Forecast',
  'proposal conversion marketing': 'Proposal Conversion',
  'customer health marketing': 'Customer Health',
  'installation pipeline marketing': 'Installation Pipeline',
  'talking service telemetry': 'Today\'s Summary',
  'operational metric total surveys': 'Total Surveys',
  'operational metric total projects': 'Total Projects',
  'operational metric avg progress': 'Avg Progress',
  'vendor total surveys': 'Total Surveys',
  'export center label': 'Export Center',
  'operations section heading': 'Solar Operations',
  'vendor section heading': 'Vendor Intelligence',
}
const KEPT_SEL = {
  'hero heading': '.tab-heading',
  'kpi grid': '.card-grid-4',
  'kpi cards': '.card-metric',
  'filter bar': '[role="search"]',
  'export bar': 'button',
  'chart card': '.card-base',
  'insights card': '.card-glass',
  'table': 'table[role="grid"]',
}
const REMOVED_SEL = {
  'mission bar': '.ew-mission-bar',
  'live dot': '.ew-live-dot',
  'scope badge': '.ew-scope-badge',
  'mission stats': '.ew-mission-stat-item',
  'mission stat item': '.ew-mission-stat-item',
  'section nav pills': '.ew-nav-pill',
  'telemetry tiles': '.ew-telemetry-tile',
}

async function checkPage(name, path) {
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
    await page.waitForTimeout(3000)

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
      const keptTextVisible = lowerBody.includes('export kpi summary (csv)')
      const metricCards = document.querySelectorAll('.card-metric').length
      const kpiLabels = Array.from(document.querySelectorAll('.card-metric-label')).map((el) => el.textContent.trim())
      const chartTitles = Array.from(document.querySelectorAll('[role="region"][aria-label]')).map((el) => el.getAttribute('aria-label'))
      const chartCount = document.querySelectorAll('.card-base').length
      const purpleUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-purple|#8b5cf6|#7c5dfa|#a78bfa|#7c3aed|#06b6d4|color-cyan|#22d3ee/gi) || []).length
      const gradientUsage = (document.querySelector('.ew-page')?.innerHTML.match(/linear-gradient|radial-gradient/g) || []).length
      const headings = Array.from(document.querySelectorAll('h1, h2, .tab-heading, .ew-workbench-title')).map((h) => h.textContent.trim())
      const bodyLength = document.body.innerText.length
      return { removedTextState, removedSelState, keptState, keptTextState, keptTextVisible, metricCards, kpiLabels, chartTitles, chartCount, purpleUsage, gradientUsage, headings, bodyLength }
    }, { removedText: REMOVED_TEXT, removedSel: REMOVED_SEL, keptSel: KEPT_SEL, keptText: KEPT_TEXT })

    const checks = {}
    for (const [label, text] of Object.entries(probe.removedTextState)) {
      checks[`removedText:${label}`] = !text
      entry.total++
      if (!text) entry.pass++
    }
    for (const [label, sel] of Object.entries(probe.removedSelState)) {
      checks[`removedSel:${label}`] = !sel
      entry.total++
      if (!sel) entry.pass++
    }
    for (const [label, sel] of Object.entries(probe.keptState)) {
      checks[`keptSel:${label}`] = sel
      entry.total++
      if (sel) entry.pass++
    }
      for (const [label, text] of Object.entries(probe.keptTextState)) {
      checks[`keptText:${label}`] = text
      entry.total++
      if (text) entry.pass++
    }
    checks['keptText:export visible'] = probe.keptTextVisible
    entry.total++
    if (probe.keptTextVisible) entry.pass++

    checks['visual:max 4 kpi cards'] = probe.metricCards <= 4
    entry.total++
    if (checks['visual:max 4 kpi cards']) entry.pass++
    checks['visual:exactly 4 charts'] = probe.chartTitles.filter(t => ['Are we improving?', 'Where are we losing customers?', 'Which region performs best?', 'What should we expect next?'].includes(t)).length === 4
    entry.total++
    if (checks['visual:exactly 4 charts']) entry.pass++
    checks['visual:no purple/cyan'] = probe.purpleUsage === 0
    entry.total++
    if (checks['visual:no purple/cyan']) entry.pass++
    checks['visual:no gradients'] = probe.gradientUsage === 0
    entry.total++
    if (checks['visual:no gradients']) entry.pass++
    checks['visual:single hero'] = probe.headings.filter((h) => h === 'Business Intelligence').length === 1
    entry.total++
    if (checks['visual:single hero']) entry.pass++
    checks['visual:no mission pills'] = probe.chartCount >= 4
    entry.total++
    if (checks['visual:no mission pills']) entry.pass++
    checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (checks['health:no console errors']) entry.pass++
    checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (checks['health:no network issues']) entry.pass++

    entry.checks = checks
    entry.kpiLabels = probe.kpiLabels
    entry.chartTitles = probe.chartTitles
    entry.headings = probe.headings
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

await checkPage('bi-dashboard', '/app/business-intelligence')

fs.writeFileSync(REPORT, JSON.stringify(results, null, 2))
console.log(`\nREPORT: ${REPORT}`)
await browser.close()
