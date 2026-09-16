import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const API = 'http://localhost:8000/api'

const adminLogin = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@getsolar.in', password: 'Admin@5678' }) }).then(r => r.json())
const admin = { token: adminLogin.token, user: { id: 1, email: 'admin@getsolar.in', name: 'Admin User', role: 'admin', displayRole: 'Admin', phone: '', city: '', avatar: '', subscriptionTier: 'Admin' } }

async function signup(role, prefix) {
  const email = `${prefix}_${Date.now().toString().slice(-8)}@getsolar.com`
  const body = { email, password: 'VerifyPass123!', name: 'Audit Verify', phone: '98' + Date.now().toString().slice(-8), city: 'Lucknow', role }
  const url = role === 'technician' ? `${API}/technician/signup` : `${API}/signup`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await res.json()
  return { token: j.token, user: j.user ?? j.technician, id: (j.user ?? j.technician)?.id }
}
const tech = await signup('technician', 'prodT')

const SESSIONS = {
  admin,
  tech: { token: tech.token, user: { id: tech.id, email: tech.user.email, name: tech.user.name, role: 'technician', displayRole: 'Technician', phone: '9876543210', city: 'Lucknow', avatar: '', subscriptionTier: 'Technician' } },
}

const browser = await chromium.launch()

async function probe(sessionName, path) {
  const session = SESSIONS[sessionName]
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript(({ token, user }) => { localStorage.setItem('access_token', token); localStorage.setItem('user', JSON.stringify(user)) }, { token: session.token, user: session.user })
  const apiRequests = {}
  page.on('response', (resp) => {
    const url = resp.url()
    if (!url.startsWith(API)) return
    const key = `${resp.request().method()} ${url.replace(API, '').split('?')[0]}`
    apiRequests[key] = (apiRequests[key] || 0) + 1
  })
  const t0 = Date.now()
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(2000)
  const loadMs = Date.now() - t0
  console.log(`\n${path}  [load ${loadMs}ms]`)
  for (const [k, n] of Object.entries(apiRequests)) {
    console.log(`  ${n === 1 ? '  1x' : `  ${n}x  !!`} ${k}`)
  }
  await context.close()
}

for (const [s, p] of [['admin', '/app/admin/dashboard'], ['admin', '/app/mlops'], ['tech', '/app/technician/dashboard'], ['tech', '/app/technician/training']]) {
  await probe(s, p)
}
await browser.close()
