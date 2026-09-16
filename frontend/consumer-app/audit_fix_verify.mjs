import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const API = 'http://localhost:8000/api'

const adminLogin = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@getsolar.in', password: 'Admin@5678' }) }).then(r => r.json())
const admin = { token: adminLogin.token, user: { id: 1, email: 'admin@getsolar.in', name: 'Admin User', role: 'admin', displayRole: 'Admin', phone: '', city: '', avatar: '', subscriptionTier: 'Admin' } }

async function signup(role, prefix) {
  const n = Date.now().toString().slice(-8)
  const email = `${prefix}_${n}@getsolar.com`
  const body = { email, password: 'VerifyPass123!', name: 'Audit Verify', phone: '97' + n, city: 'Lucknow', role }
  const url = role === 'technician' ? `${API}/technician/signup` : `${API}/signup`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await res.json()
  return { token: j.token, user: j.user ?? j.technician, id: (j.user ?? j.technician)?.id }
}
const cust = await signup('customer', 'fxC')
const tech = await signup('technician', 'fxT')

function mkSession(s) {
  return { token: s.token, user: { id: s.id, email: s.user.email, name: s.user.name, role: s.user.role ?? s.user.displayRole?.toLowerCase() ?? (s.user.email.startsWith('fxT') ? 'technician' : 'customer'), displayRole: '', phone: s.user.phone ?? '9700000000', city: 'Lucknow', avatar: '', subscriptionTier: '' } }
}

const SESSIONS = {
  admin: { token: admin.token, user: { ...admin.user, id: 1 } },
  customer: mkSession(cust),
  tech: mkSession(tech),
}

const browser = await chromium.launch()

let failures = 0
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`)
  if (!cond) failures++
}

async function probe(sessionName, path, { expectAccessDenied = false, expectProfileContent = false } = {}) {
  const session = SESSIONS[sessionName]
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(({ token, user }) => { localStorage.setItem('access_token', token); localStorage.setItem('user', JSON.stringify(user)) }, { token: session.token, user: session.user })
  const consoleErrors = []
  const apiCalls = []
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('response', (resp) => {
    const url = resp.url()
    if (!url.startsWith(API)) return
    apiCalls.push(`${resp.status()} ${url.replace(API, '').split('?')[0]}`)
  })
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1500)
  const techCalls = apiCalls.filter(c => c.includes('/technician/'))
  const has401 = apiCalls.some(c => c.startsWith('401'))
  const bodyText = await page.locator('body').innerText()
  const hasAccessDenied = /access denied|not authorized|no access|permission/i.test(bodyText)

  console.log(`\n[${sessionName}] ${path}`)
  console.log('  API calls:', apiCalls.length ? apiCalls.join(', ') : '(none)')
  if (consoleErrors.length) console.log('  console errors:', consoleErrors.length)

  if (expectAccessDenied) {
    check('customer blocked from technician profile (no 401)', !has401, `techCalls=${techCalls.length}`)
    check('customer sees AccessDenied page', hasAccessDenied, `accessDenied=${hasAccessDenied}`)
    check('no technician API calls fired', techCalls.length === 0, `techCalls=${techCalls.length}`)
  } else if (expectProfileContent) {
    check('no 401s', !has401, has401 ? apiCalls.join(',') : 'ok')
    check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '))
    check('profile content rendered', /profile/i.test(bodyText) && bodyText.length > 200, `len=${bodyText.length}`)
  } else {
    check('no 401s', !has401, has401 ? apiCalls.join(',') : 'ok')
    check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '))
  }
  await context.close()
}

await probe('customer', '/app/home')
await probe('customer', '/app/account/profile', { expectAccessDenied: true })
await probe('customer', '/app/account/settings')
await probe('tech', '/app/technician/profile', { expectProfileContent: true })
await probe('tech', '/app/technician/dashboard')
await probe('admin', '/app/admin/dashboard')

await browser.close()
console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
