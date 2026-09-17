import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
const REPORT = `${SHOTS}\\unit5_verification.json`
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
  'title': 'Audit & Monitoring',
  'mission': 'what happened, who performed the action',
  'kpi events': 'Events',
  'kpi critical': 'Critical',
  'kpi failed logins': 'Failed Logins',
  'kpi health': 'System Health',
  'filter date': 'Date',
  'filter severity': 'Severity',
  'filter user': 'User',
  'filter search': 'Search',
  'export': 'Export Events (CSV)',
  'event log section': 'Event Log',
  'severity badge': 'success',
}
const REMOVED_TEXT = {
  'mission bar badge': 'OPS / OBSERVABILITY',
  'live dot': 'LIVE',
  'refresh telemetry': 'Refresh Telemetry',
  'services online telemetry': 'Services Online',
  'coverage telemetry': 'Coverage',
  'section nav overview': 'Platform Overview',
  'live platform health': 'Live Platform Health',
  'alerts section': 'Operational warnings and critical issues',
  'ml monitoring': 'AI & ML Monitoring',
  'ml platform status': 'ML Platform Status',
  'ml serving metrics': 'ML Serving Metrics',
  'platform activity': 'Platform Activity',
  'export center': 'Export Center',
  'overview metric api availability': 'API Availability',
  'audit records metric': 'Audit Records',
  'ml status metric': 'ML Status',
}
const KEPT_SEL = {
  'hero heading': '.tab-heading',
  'kpi grid': '.card-grid-4',
  'kpi cards': '.card-metric',
  'filter bar': '[role="search"]',
  'table': 'table[role="grid"]',
  'sticky header': 'th',
  'table aria': 'table[aria-label="Audit event log"]',
}
const REMOVED_SEL = {
  'mission bar': '.ew-mission-bar',
  'live dot': '.ew-live-dot',
  'scope badge': '.ew-scope-badge',
  'mission stats': '.ew-mission-stat-item',
  'section nav pills': '.ew-nav-pill',
  'telemetry tiles': '.ew-telemetry-tile',
}

async function checkPage(name, path, opts = {}) {
  const { interact } = opts
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
    if (interact) await interact(page)
    await page.waitForTimeout(800)
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
      const rowCount = document.querySelectorAll('table[role="grid"] tbody tr').length
      const headerCells = Array.from(document.querySelectorAll('table[role="grid"] thead th')).map(h => h.textContent.trim())
      const stickyHeader = getComputedStyle(document.querySelector('table[role="grid"] thead tr')).position === 'sticky'
      const purpleUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-purple|#8b5cf6|#7c5dfa|#a78bfa|#7c3aed/gi) || []).length
      const cyanUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-cyan|#06b6d4|#22d3ee/gi) || []).length
      const gradientUsage = (document.querySelector('.ew-page')?.innerHTML.match(/linear-gradient|radial-gradient/g) || []).length
      const headings = Array.from(document.querySelectorAll('h1, h2, .tab-heading, .ew-workbench-title')).map((h) => h.textContent.trim())
      const drawerOpen = !!document.querySelector('.drawer[role="dialog"]')
      return { removedTextState, removedSelState, keptState, keptTextState, metricCards, kpiLabels, rowCount, headerCells, stickyHeader, purpleUsage, cyanUsage, gradientUsage, headings, drawerOpen }
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
    if (checks['visual:max 4 kpi cards']) entry.pass++
    checks['visual:event table has rows'] = probe.rowCount >= 1
    entry.total++
    if (checks['visual:event table has rows']) entry.pass++
    checks['visual:table has severity col'] = probe.headerCells.includes('Severity')
    entry.total++
    if (checks['visual:table has severity col']) entry.pass++
    checks['visual:sticky header'] = probe.stickyHeader
    entry.total++
    if (checks['visual:sticky header']) entry.pass++
    checks['visual:no purple'] = probe.purpleUsage === 0
    entry.total++
    if (checks['visual:no purple']) entry.pass++
    checks['visual:no cyan'] = probe.cyanUsage === 0
    entry.total++
    if (checks['visual:no cyan']) entry.pass++
    checks['visual:no gradients'] = probe.gradientUsage === 0
    entry.total++
    if (checks['visual:no gradients']) entry.pass++
    checks['visual:single hero'] = probe.headings.filter((h) => h === 'Audit & Monitoring').length === 1
    entry.total++
    if (checks['visual:single hero']) entry.pass++
    checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (checks['health:no console errors']) entry.pass++
    checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (checks['health:no network issues']) entry.pass++
    if (opts.expectDrawer) {
      checks['visual:drawer opens on row click'] = probe.drawerOpen
      entry.total++
      if (probe.drawerOpen) entry.pass++
    }

    entry.checks = checks
    entry.kpiLabels = probe.kpiLabels
    entry.headerCells = probe.headerCells
    entry.headings = probe.headings
    entry.rowCount = probe.rowCount
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

const openDrawer = async (page) => {
  await page.click('table[role="grid"] tbody tr')
}

await checkPage('audit-dashboard', '/app/audit/monitoring')
await checkPage('audit-detail-drawer', '/app/audit/monitoring', { interact: openDrawer, expectDrawer: true })

fs.writeFileSync(REPORT, JSON.stringify(results, null, 2))
console.log(`\nREPORT: ${REPORT}`)
await browser.close()
