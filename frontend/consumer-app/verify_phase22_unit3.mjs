import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
const REPORT = `${SHOTS}\\unit3_verification.json`
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

const KEPT_TEXT = [
  'CRM & Customers',
  'Manage customers, leads, pipeline, and follow-ups',
  'Pipeline Value',
  'Active Leads',
  'Avg Deal Size',
  'Win Rate',
  'Needs Attention',
  'CRM Operational Workspace',
  'Pipeline Board',
  'Customer Directory',
  'Follow-ups',
  'Task Queue',
  'Site Visits',
  'Proposals',
  'Communications',
]
const REMOVED_TEXT = [
  'Refresh Queue',
  'Lead queue refreshed from CRM server',
  'Velocity Index',
  'VEL',
  'Sales Cycle',
  'DAYS',
  'Conversion Velocity',
  'ACCOUNTS',
  'LIVE',
  'Active View',
  'Customer 360° Inspector',
  'Select an account from the Customer Directory',
  'Pipeline Alerts',
  'Activity Timeline',
  'Omnichannel Comms',
  'Analytics Export',
  'Customer 360°',
]
const REMOVED_SEL = [
  '.ew-telemetry-tile',
  '.ew-mission-stat-item',
]
const KEPT_SEL = [
  '.tab-heading',
  '.card-grid-4',
  '.card-metric',
  '.ew-workbench-card',
  '.ew-workbench-title',
  '.ew-tab-bar',
]

const CHECKLIST = [
  ['visual:one hero only', '.tab-heading'],
  ['visual:no duplicate title', 'section[aria-label="Needs Attention"] .ew-workbench-title'],
  ['visual:max 4 kpis above fold', '.card-metric'],
  ['visual:purple ban', 'purple'],
  ['visual:cyan ban', 'cyan'],
  ['visual:no decorative code-tags', 'tag'],
  ['visual:no fake toasts', 'Lead queue refreshed'],
  ['visual:no dead 360 placeholder', 'Customer 360° Inspector'],
  ['visual:no duplicate alerts entry', 'Pipeline Alerts'],
]

async function checkPage(name, path, opts = {}) {
  const { tabToTest, interact, collect } = opts
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

    if (tabToTest) {
      await page.click(`.ew-tab-btn:has-text("${tabToTest}")`)
      await page.waitForTimeout(2000)
    }
    if (interact) await interact(page)

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
      const kpiLabels = Array.from(document.querySelectorAll('.card-metric-label')).map((el) => el.textContent.trim())
      const telemetryTiles = document.querySelectorAll('.ew-telemetry-tile').length
      const tabBtns = Array.from(document.querySelectorAll('.ew-tab-btn')).map((b) => b.textContent.trim())
      const purpleUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-purple|#8b5cf6|#7c5dfa|#a78bfa|#7c3aed/gi) || []).length
      const cyanUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-cyan|#06b6d4|#22d3ee/gi) || []).length
      const gradientUsage = (document.querySelector('.ew-page')?.innerHTML.match(/linear-gradient|radial-gradient/g) || []).length
      const headings = Array.from(document.querySelectorAll('h1, h2, .tab-heading, .ew-workbench-title')).map((h) => h.textContent.trim())
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim().replace(/\s+/g, ' '))
      return { removedTextState, removedSelState, keptState, keptTextState, metricCards, kpiLabels, telemetryTiles, tabBtns, purpleUsage, cyanUsage, gradientUsage, headings, buttons }
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

    checks['visual:max 4 kpi cards'] = probe.metricCards <= 4
    entry.total++
    if (probe.metricCards <= 4) entry.pass++
    checks['visual:no telemetry tiles'] = probe.telemetryTiles === 0
    entry.total++
    if (probe.telemetryTiles === 0) entry.pass++
    checks['visual:no purple accent'] = probe.purpleUsage === 0
    entry.total++
    if (probe.purpleUsage === 0) entry.pass++
    checks['visual:no cyan accent'] = probe.cyanUsage === 0
    entry.total++
    if (probe.cyanUsage === 0) entry.pass++
    checks['visual:no gradients'] = probe.gradientUsage === 0
    entry.total++
    if (probe.gradientUsage === 0) entry.pass++
    checks['visual:no duplicate hero'] = probe.headings.filter((h) => h === 'CRM & Customers').length === 1
    entry.total++
    if (checks['visual:no duplicate hero']) entry.pass++
    checks['visual:no fake buttons'] = !probe.buttons.some((b) => /Refresh Queue|Sync Pipeline/.test(b)) || probe.buttons.some((b) => b.includes('Sync Pipeline'))
    entry.total++
    if (checks['visual:no fake buttons']) entry.pass++
    checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (checks['health:no console errors']) entry.pass++
    checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (checks['health:no network issues']) entry.pass++

    entry.checks = checks
    entry.kpiLabels = probe.kpiLabels
    entry.tabBtns = probe.tabBtns
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

await checkPage('crm-dashboard', '/app/crm/leads')
await checkPage('crm-tab-customers', '/app/crm/leads', { tabToTest: 'Customer Directory' })
await checkPage('crm-tab-followups', '/app/crm/leads', { tabToTest: 'Follow-ups' })
await checkPage('crm-tab-tasks', '/app/crm/leads', { tabToTest: 'Task Queue' })
await checkPage('crm-tab-meetings', '/app/crm/leads', { tabToTest: 'Site Visits' })
await checkPage('crm-tab-proposals', '/app/crm/leads', { tabToTest: 'Proposals' })
await checkPage('crm-tab-comms', '/app/crm/leads', { tabToTest: 'Communications' })

fs.writeFileSync(REPORT, JSON.stringify(results, null, 2))
console.log(`\nREPORT: ${REPORT}`)
await browser.close()
