import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const SHOTS = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_shots'
const OUT = 'C:/Users/mhhaq/AppData/Local/Temp/opencode/phase22_verify'
mkdirSync(SHOTS, { recursive: true })
mkdirSync(OUT, { recursive: true })

// ---- fresh customer session ----
const email = `u1_${Date.now().toString().slice(-8)}@getsolar.com`
const signup = await fetch(`${API}/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'VerifyPass123!', name: 'Unit One Verify', phone: '9876543210', city: 'Lucknow', role: 'customer' }),
}).then((r) => r.json())
if (!signup?.token) { console.error('SIGNUP FAILED', JSON.stringify(signup)); process.exit(1) }
const user = { id: signup.user.id, email: signup.user.email, name: signup.user.name, role: 'customer', displayRole: 'Customer', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Customer' }

const REMOVED = {
  header: {
    'static subtitle (header-subtitle)': '.header-subtitle',
    'breadcrumb (header-breadcrumb)': '.header-breadcrumb',
    'role chip (workspace-chip-role)': '.workspace-chip-role',
    'topbar divider (topbar-divider)': '.topbar-divider',
    'wave emoji': '.header-title .wave',
  },
  sidebar: {
    'promo card (sidebar-promo-card)': '.sidebar-promo-card',
    'plan text (workspace-plan)': '.workspace-plan',
    'status bar (sidebar-status-bar)': '.sidebar-status-bar',
    'version tag (sidebar-status-bar em)': '.sidebar-status-bar em',
    'brand tagline (logo-sub-text)': '.sidebar .logo-sub-text',
    'section count badge (sidebar-section-count)': '.sidebar-section-count',
  },
  hero: {
    'dashboard hero location badge': '.hero-meta-badge #heroLocationText',
    'dashboard hero role badge': '.hero-meta-badge #heroCustomerTypeText',
  },
}

const KEPT = {
  header: {
    'greeting (dashGreeting)': '#dashGreeting',
    'menu toggle': '.menu-toggle',
    'search': '.topbar-search',
    'location selector': '#locationSelector',
    'notification bell': '.notification-btn',
    'profile pill': '.profile-pill',
  },
  sidebar: {
    'brand logo': '.logo-container',
    'workspace selector': '.workspace-selector',
    'nav menu': '.sidebar-menu',
  },
  hero: {
    'hero title': '#heroGreeting',
    'grid status badge': '.hero-meta-badge',
  },
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
    await page.waitForTimeout(2000)
    entry.actualUrl = page.url()
    entry.redirected = !page.url().startsWith(BASE + path)

    const probe = await page.evaluate(({ removed, kept }) => {
      const flat = (obj) => Object.entries(obj).flatMap(([, v]) => Array.isArray(v) ? v : Object.entries(v))
      const present = (sel) => !!document.querySelector(sel)
      const removedState = {}
      for (const [label, sel] of flat(removed)) removedState[label] = present(sel)
      const keptState = {}
      for (const [label, sel] of flat(kept)) keptState[label] = present(sel)
      const greetingText = document.querySelector('#dashGreeting')?.textContent?.replace(/\s+/g, ' ').trim() || ''
      const heroText = document.querySelector('#heroGreeting')?.textContent?.trim() || ''
      return { removedState, keptState, greetingText, heroText }
    }, { removed: REMOVED, kept: KEPT })

    // removed elements MUST be absent
    for (const [label, absent] of Object.entries(probe.removedState)) {
      entry.total++
      const ok = !absent
      if (ok) entry.pass++
      entry.checks[`removed:${label}`] = ok
    }

    // kept elements MUST be present
    for (const [label, exists] of Object.entries(probe.keptState)) {
      entry.total++
      if (exists) entry.pass++
      entry.checks[`kept:${label}`] = exists
    }

    // greeting is a single clean greeting (no duplicate welcome phrases)
    entry.checks['greeting:header contains greeting'] = /Good (Morning|Afternoon|Evening)/.test(probe.greetingText)
    entry.total++
    if (entry.checks['greeting:header contains greeting']) entry.pass++
    entry.checks['greeting:no wave emoji in header'] = !probe.greetingText.includes('👋')
    entry.total++
    if (entry.checks['greeting:no wave emoji in header']) entry.pass++

    // hero title is a non-greeting page title (no "Good Morning" duplication)
    entry.checks['hero:title not a greeting'] = !/Good (Morning|Afternoon|Evening)/.test(probe.heroText)
    entry.total++
    if (entry.checks['hero:title not a greeting']) entry.pass++
    entry.checks['hero:has meaningful title'] = probe.heroText.length >= 3
    entry.total++
    if (entry.checks['hero:has meaningful title']) entry.pass++

    // notification bell navigation: click should route to notifications page
    const bellExists = probe.keptState['notification bell']
    if (bellExists) {
      await page.click('.notification-btn')
      await page.waitForTimeout(1500)
      const afterUrl = page.url()
      entry.checks['bell:navigates to notifications'] = afterUrl.includes('/app/activity-center') || afterUrl.includes('/support/notifications')
      entry.total++
      if (entry.checks['bell:navigates to notifications']) entry.pass++
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(1500)
    }

    // no console errors / network issues
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

await checkPage('customer-dashboard', '/app/home')

await browser.close()

writeFileSync(`${OUT}\\unit1_verification.json`, JSON.stringify(results, null, 2))
console.log('\nREPORT: ' + `${OUT}\\unit1_verification.json`)
