import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
const REPORT = `${SHOTS}\\unit6_verification.json`
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
  'title': 'ML Operations',
  'description': 'model registry, deployment health, inference performance, and drift',
  'kpi active models': 'Active Models',
  'kpi inference requests': 'Inference Requests',
  'kpi avg latency': 'Average Latency',
  'kpi availability': 'Model Availability',
  'export': 'Export Registry (CSV)',
  'registry section': 'Model Registry',
  'deployment section': 'Deployment Status',
  'inference section': 'Inference Performance',
  'drift section': 'Model Drift',
  'logs section': 'Inference Logs',
  'real model': 'bill_model',
  'real algorithm': 'RandomForestRegressor',
  'usage question': 'Which models receive the most requests?',
  'latency question': 'Is latency within acceptable limits?',
  'failed by model': 'Failed predictions by model',
}
const REMOVED_TEXT = {
  'mission bar badge': 'MLOPS / INFERENCE-ENGINE',
  'live dot': 'LIVE',
  'platform status telemetry': 'Serving Models',
  'section nav overview': 'AI Platform Overview',
  'section nav latency': 'Latency Analytics',
  'section nav config': 'Model Configuration',
  'capabilities': 'AI Capabilities',
  'export center': 'Export Center',
  'gemini marketing': 'Powered by Gemini',
  'fake model gemini': 'Gemini AI',
  'fake recommendation engine': 'Recommendation Engine',
  'cache hit telemetry': 'Cache Hit Rate',
  'prediction success telemetry': 'Prediction Success',
  'telemetry uptime': 'Platform Uptime',
  'fake ai terminology': 'Real-time CPU',
}
const KEPT_SEL = {
  'hero heading': '.tab-heading',
  'kpi grid': '.card-grid-4',
  'kpi cards': '.card-metric',
  'registry table': 'table[aria-label="Model registry"]',
  'logs table': 'table[aria-label="Inference logs"]',
  'sticky header': 'th',
}
const REMOVED_SEL = {
  'mission bar': '.ew-mission-bar',
  'live dot': '.ew-live-dot',
  'scope badge': '.ew-scope-badge',
  'mission stats': '.ew-mission-stat-item',
  'section nav pills': '.ew-nav-pill',
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
      const registryRows = document.querySelectorAll('table[aria-label="Model registry"] tbody tr').length
      const registryHeaders = Array.from(document.querySelectorAll('table[aria-label="Model registry"] thead th')).map(h => h.textContent.trim())
      const stickyRegistry = getComputedStyle(document.querySelector('table[aria-label="Model registry"] thead tr') ?? document.createElement('tr')).position === 'sticky'
      const logRows = document.querySelectorAll('table[aria-label="Inference logs"] tbody tr').length
      const monoUsage = (document.querySelector('.ew-page')?.innerHTML.match(/font-mono/gi) || []).length
      const purpleUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-purple|#8b5cf6|#7c5dfa|#a78bfa|#7c3aed|#22c55e|#eab308/gi) || []).length
      const cyanUsage = (document.querySelector('.ew-page')?.innerHTML.match(/color-cyan|#06b6d4|#22d3ee/gi) || []).length
      const gradientUsage = (document.querySelector('.ew-page')?.innerHTML.match(/linear-gradient|radial-gradient/g) || []).length
      const headings = Array.from(document.querySelectorAll('h1, h2, .tab-heading, .ew-workbench-title')).map((h) => h.textContent.trim())
      const drawerOpen = !!document.querySelector('.drawer[role="dialog"]')
      const drawerLabel = document.querySelector('.drawer[role="dialog"]')?.getAttribute('aria-label') || ''
      return { removedTextState, removedSelState, keptState, keptTextState, metricCards, kpiLabels, registryRows, registryHeaders, stickyRegistry, logRows, monoUsage, purpleUsage, cyanUsage, gradientUsage, headings, drawerOpen, drawerLabel }
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
    checks['visual:registry has rows'] = probe.registryRows >= 1
    entry.total++
    if (checks['visual:registry has rows']) entry.pass++
    checks['visual:registry has status col'] = probe.registryHeaders.includes('Status')
    entry.total++
    if (checks['visual:registry has status col']) entry.pass++
    checks['visual:registry sticky header'] = probe.stickyRegistry
    entry.total++
    if (checks['visual:registry sticky header']) entry.pass++
    checks['visual:logs table has rows'] = probe.logRows >= 1
    entry.total++
    if (checks['visual:logs table has rows']) entry.pass++
    checks['visual:monospace used for ids/versions'] = probe.monoUsage >= 2
    entry.total++
    if (checks['visual:monospace used for ids/versions']) entry.pass++
    checks['visual:no purple/off-palette'] = probe.purpleUsage === 0
    entry.total++
    if (checks['visual:no purple/off-palette']) entry.pass++
    checks['visual:no cyan'] = probe.cyanUsage === 0
    entry.total++
    if (checks['visual:no cyan']) entry.pass++
    checks['visual:no gradients'] = probe.gradientUsage === 0
    entry.total++
    if (checks['visual:no gradients']) entry.pass++
    checks['visual:single hero'] = probe.headings.filter((h) => h === 'ML Operations').length === 1
    entry.total++
    if (checks['visual:single hero']) entry.pass++
    checks['health:no console errors'] = consoleErrors.length === 0
    entry.total++
    if (checks['health:no console errors']) entry.pass++
    checks['health:no network issues'] = networkIssues.length === 0
    entry.total++
    if (checks['health:no network issues']) entry.pass++
    if (opts.expectDrawer) {
      checks['visual:drawer opens on registry row click'] = probe.drawerOpen
      entry.total++
      if (probe.drawerOpen) entry.pass++
      checks['visual:drawer is model details'] = probe.drawerLabel === 'Model details'
      entry.total++
      if (probe.drawerLabel === 'Model details') entry.pass++
    }

    entry.checks = checks
    entry.kpiLabels = probe.kpiLabels
    entry.registryHeaders = probe.registryHeaders
    entry.headings = probe.headings
    entry.registryRows = probe.registryRows
    entry.logRows = probe.logRows
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

const openRegistryDrawer = async (page) => {
  await page.click('table[aria-label="Model registry"] tbody tr')
}

await checkPage('mlops-dashboard', '/app/mlops')
await checkPage('mlops-model-drawer', '/app/mlops', { interact: openRegistryDrawer, expectDrawer: true })

fs.writeFileSync(REPORT, JSON.stringify(results, null, 2))
console.log(`\nREPORT: ${REPORT}`)
await browser.close()
