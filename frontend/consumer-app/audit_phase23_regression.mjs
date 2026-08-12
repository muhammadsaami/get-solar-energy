import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase23_verify'
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true })
const REPORT = `${SHOTS}\\phase23_regression.json`

const ADMIN_PW = 'Admin@5678'
const PW = 'VerifyPass123!'

async function signup(role, prefix) {
  const email = `${prefix}_${Date.now().toString().slice(-8)}@getsolar.com`
  const body = { email, password: PW, name: 'Audit Verify', phone: '98' + Date.now().toString().slice(-8), city: 'Lucknow' }
  if (role === 'vendor') body.role = 'vendor'
  if (role === 'customer') body.role = 'customer'
  const url = role === 'technician' ? `${API}/technician/signup` : `${API}/signup`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await res.json()
  if (!j.token) { console.error('SIGNUP FAILED', role, url, JSON.stringify(j).slice(0, 200)); process.exit(1) }
  return { token: j.token, user: j.user ?? j.technician }
}

const adminLogin = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@getsolar.in', password: ADMIN_PW }) }).then(r => r.json())

const cust = await signup('customer', 'a23c')
const vendor = await signup('vendor', 'a23v')
const tech = await signup('technician', 'a23t')

const SESSIONS = {
  admin: { token: adminLogin.token, user: { id: 1, email: 'admin@getsolar.in', name: 'Admin User', role: 'admin', displayRole: 'Admin', phone: '', city: '', avatar: '', subscriptionTier: 'Admin' } },
  customer: { token: cust.token, user: { id: cust.user.id, email: cust.user.email, name: cust.user.name, role: 'customer', displayRole: 'Customer', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Customer' } },
  vendor: { token: vendor.token, user: { id: vendor.user.id, email: vendor.user.email, name: vendor.user.name, role: 'vendor', displayRole: 'Vendor', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Vendor' } },
  technician: { token: tech.token, user: { id: tech.user.id, email: tech.user.email, name: tech.user.name, role: 'technician', displayRole: 'Technician', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Technician' } },
}

const ROUTES = {
  admin: {
    'admin-dashboard': '/app/admin/dashboard',
    'admin-crm': '/app/crm/leads',
    'admin-bi': '/app/business-intelligence',
    'admin-audit': '/app/audit/monitoring',
    'admin-mlops': '/app/mlops',
  },
  customer: {
    'cust-home': '/app/home',
    'cust-journey': '/app/journey',
    'cust-bill-analyzer': '/app/bill-analyzer',
    'cust-roi': '/app/roi-calculator',
    'cust-roof': '/app/roof-analysis',
    'cust-proposal': '/app/planning/proposal',
    'cust-ai-advisor': '/app/ai-advisor',
    'cust-enterprise-ai': '/app/enterprise-ai',
    'cust-knowledge-base': '/app/knowledge-base',
    'cust-rewards': '/app/support/referrals',
    'cust-activity': '/app/activity-center',
    'cust-reports': '/app/ownership/reports',
    'cust-support': '/app/support/help',
    'cust-profile': '/app/account/profile',
    'cust-settings': '/app/account/settings',
    'cust-site-survey': '/app/site-survey',
    'cust-system-perf': '/app/system-performance',
    'cust-amc': '/app/amc',
  },
  vendor: {
    'vendor-dashboard': '/app/vendor/dashboard',
    'vendor-projects': '/app/vendor/projects',
    'vendor-customers': '/app/vendor/customers',
    'vendor-leads': '/app/vendor/leads',
    'vendor-installations': '/app/vendor/installations',
    'vendor-teams': '/app/vendor/teams',
    'vendor-inventory': '/app/vendor/inventory',
    'vendor-amc': '/app/vendor/amc',
    'vendor-payments': '/app/vendor/payments',
    'vendor-reports': '/app/vendor/reports',
    'vendor-analytics': '/app/vendor/analytics',
    'vendor-documents': '/app/vendor/documents',
    'vendor-settings': '/app/vendor/settings',
    'vendor-profile': '/app/vendor/profile',
    'vendor-my-work': '/app/vendor/my-work',
  },
  technician: {
    'tech-dashboard': '/app/technician/dashboard',
    'tech-training': '/app/technician/training',
    'tech-certifications': '/app/technician/certifications',
    'tech-marketplace': '/app/technician/marketplace',
    'tech-work-orders': '/app/technician/work-orders',
    'tech-earnings': '/app/technician/earnings',
    'tech-profile': '/app/technician/profile',
    'tech-ai': '/app/technician/ai-troubleshooting',
  },
}

const browser = await chromium.launch()
const results = {}
const requestTimes = {}

async function checkRoute(sessionName, name, path) {
  const session = SESSIONS[sessionName]
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }, { token: session.token, user: session.user })

  const consoleErrors = []
  const networkIssues = []
  const duplicateRequests = []
  const apiRequests = {}

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)) })
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 200)))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.startsWith(API)) networkIssues.push(`FAILED ${req.method()} ${url.replace(API, '')} ${req.failure()?.errorText || ''}`)
  })
  page.on('response', (resp) => {
    const url = resp.url()
    if (!url.startsWith(API)) return
    const key = `${resp.request().method()} ${url.replace(API, '').split('?')[0]}`
    apiRequests[key] = (apiRequests[key] || 0) + 1
    const s = resp.status()
    if (s >= 500) networkIssues.push(`HTTP ${s} ${resp.request().method()} ${url.replace(API, '').split('?')[0]}`)
    if (s === 404) networkIssues.push(`HTTP 404 ${resp.request().method()} ${url.replace(API, '').split('?')[0]}`)
    if (s === 401) networkIssues.push(`HTTP 401 ${resp.request().method()} ${url.replace(API, '').split('?')[0]}`)
    if (s === 403) networkIssues.push(`HTTP 403 ${resp.request().method()} ${url.replace(API, '').split('?')[0]}`)
    if (s >= 400 && s < 500 && s !== 404 && s !== 401 && s !== 403) networkIssues.push(`HTTP ${s} ${resp.request().method()} ${url.replace(API, '').split('?')[0]}`)
  })

  const entry = { path, session: sessionName, checks: {}, pass: 0, total: 0, consoleErrors: [], networkIssues: [], duplicateRequests: [], score: 0 }

  try {
    const start = Date.now()
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(2500)
    entry.loadMs = Date.now() - start

    const probe = await page.evaluate(() => {
      const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim()
      const hasContent = bodyText.length > 40
      const skeletons = document.querySelectorAll('.skeleton-loader').length
      const infiniteSpinner = skeletons > 6 && !document.querySelector('h1, h2, .tab-heading, .card-metric, table[role="grid"], .card-glass')
      const headingCount = document.querySelectorAll('h1, h2, .tab-heading').length
      const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      const emptyState = document.querySelectorAll('[class*="empty"]').length
      const errorState = bodyText.includes('Connection Error') || bodyText.includes('Failed to load')
      return { hasContent, skeletons, infiniteSpinner, headingCount, horizontalOverflow, emptyState, errorState, bodyText: bodyText.slice(0, 200) }
    })

    // per-page checks
    const checks = {
      'page loads with content': probe.hasContent && !probe.errorState,
      'no infinite spinner': !probe.infiniteSpinner,
      'no horizontal overflow': !probe.horizontalOverflow,
      'has heading': probe.headingCount >= 1,
      'no console errors': consoleErrors.length === 0,
      'no network issues': networkIssues.length === 0,
      'no duplicated API requests': Object.values(apiRequests).every(n => n === 1),
    }
    let total = 0, pass = 0
    for (const [k, v] of Object.entries(checks)) { total++; if (v) pass++; }
    entry.checks = checks
    entry.total = total
    entry.pass = pass
    entry.duplicateRequests = Object.entries(apiRequests).filter(([, n]) => n > 1).map(([k, n]) => `${k} x${n}`).slice(0, 10)
    entry.apiRequestCount = Object.keys(apiRequests).length
    entry.apiRequests = Object.keys(apiRequests).sort()
    entry.consoleErrors = consoleErrors
    entry.networkIssues = networkIssues
    entry.emptyStatePresent = probe.emptyState > 0
    entry.skeletons = probe.skeletons
    entry.score = Math.round((pass / Math.max(1, total)) * 100)

    await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: false })
    entry.screenshot = `${SHOTS}\\${name}.png`
  } catch (e) {
    entry.error = String(e).slice(0, 300)
    entry.score = 0
  }

  results[name] = entry
  const mark = entry.score === 100 ? 'PASS' : entry.score >= 80 ? 'WARN' : 'FAIL'
  console.log(`${mark.padEnd(5)} ${name.padEnd(24)} score=${String(entry.score).padStart(3)}  ${entry.pass}/${entry.total}  ${entry.loadMs}ms${entry.error ? ' ERR ' + entry.error : ''}${entry.networkIssues.length ? ' NET=' + entry.networkIssues.length : ''}${entry.consoleErrors.length ? ' CON=' + entry.consoleErrors.length : ''}`)
  await context.close()
}

for (const [session, routes] of Object.entries(ROUTES)) {
  for (const [name, path] of Object.entries(routes)) {
    await checkRoute(session, name, path)
  }
}

fs.writeFileSync(REPORT, JSON.stringify(results, null, 2))
console.log(`\nREPORT: ${REPORT}`)

// Summary
const all = Object.values(results)
const fails = all.filter(r => r.score < 100)
console.log(`\nTotal routes: ${all.length}`)
console.log(`100% PASS: ${all.filter(r => r.score === 100).length}`)
console.log(`<100% (WARN/FAIL): ${fails.length}`)
for (const f of fails) {
  console.log(`\n--- ${f.path} (${f.session}) score=${f.score} ---`)
  console.log('  console:', JSON.stringify(f.consoleErrors))
  console.log('  network:', JSON.stringify(f.networkIssues))
  console.log('  dup:', JSON.stringify(f.duplicateRequests))
}
await browser.close()
