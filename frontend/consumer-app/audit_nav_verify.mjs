import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const API = 'http://localhost:8000/api'

async function signup(role, prefix) {
  const n = Date.now().toString().slice(-8)
  const email = `${prefix}_${n}@getsolar.com`
  const body = { email, password: 'VerifyPass123!', name: 'Audit Verify', phone: '96' + n, city: 'Lucknow', role }
  const url = role === 'technician' ? `${API}/technician/signup` : `${API}/signup`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await res.json()
  const u = j.user ?? j.technician
  return { token: j.token, id: u?.id, role: u?.role ?? role }
}
const cust = await signup('customer', 'nvC')
const tech = await signup('technician', 'nvT')

const browser = await chromium.launch()
let failures = 0
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`)
  if (!cond) failures++
}

async function session(role, data) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const user = { id: data.id ?? 1, email: data.role === 'technician' ? 't@t.co' : 'c@c.co', name: 'Audit Verify', role: data.role, displayRole: '', phone: '9600000000', city: 'Lucknow', avatar: '', subscriptionTier: '' }
  await page.addInitScript(({ token, user }) => { localStorage.setItem('access_token', token); localStorage.setItem('user', JSON.stringify(user)) }, { token: data.token, user })
  await page.goto(`${BASE}${role === 'technician' ? '/app/technician/dashboard' : '/app/home'}`, { waitUntil: 'networkidle', timeout: 45000 })
  return { context, page }
}

// --- CUSTOMER: UserMenu must not show Profile; Sidebar Account group must not show Profile ---
{
  const { context, page } = await session('customer', cust)
  await page.locator('.profile-pill').click()
  await page.waitForTimeout(500)
  const menuText = await page.locator('.profile-dropdown').innerText()
  check('customer UserMenu has NO Profile item', !/^\s*Profile/m.test(menuText), `menu="${menuText.trim().replace(/\s+/g, ' ')}"`)
  check('customer UserMenu HAS Account Settings', /Account Settings/.test(menuText))
  check('customer UserMenu HAS Notifications', /Notifications/.test(menuText))
  check('customer UserMenu HAS Logout', /Logout|Sign Out/.test(menuText))
  await page.keyboard.press('Escape')
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.waitForTimeout(300)

  const sidebarText = await page.locator('.sidebar').innerText()
  const acctIdx = sidebarText.toUpperCase().indexOf('ACCOUNT')
  const accountBlock = acctIdx >= 0 ? sidebarText.slice(acctIdx) : ''
  check('customer sidebar Account group has NO Profile item', !/Profile/i.test(accountBlock), `account="${accountBlock.replace(/\s+/g, ' ').trim()}"`)
  check('customer sidebar Account group HAS Settings item', /Settings/i.test(accountBlock))
  await context.close()
}

// --- TECHNICIAN: UserMenu must show Profile → technician profile; Sidebar has Profile item ---
{
  const { context, page } = await session('technician', tech)
  const sidebarText = await page.locator('.sidebar').innerText()
  check('technician sidebar HAS Profile & Performance', /Profile & Performance/.test(sidebarText))
  await page.locator('.profile-pill').click()
  await page.waitForTimeout(500)
  const menuText = await page.locator('.profile-dropdown').innerText()
  check('technician UserMenu HAS Profile item', /^\s*Profile/m.test(menuText), `menu="${menuText.trim().replace(/\s+/g, ' ')}"`)

  const techCalls = []
  page.on('response', (resp) => { if (resp.url().startsWith(API)) techCalls.push(`${resp.status()} ${resp.url().replace(API, '').split('?')[0]}`) })
  await page.locator('.profile-dropdown-item', { hasText: 'Profile' }).first().click()
  await page.waitForTimeout(1500)
  const url = page.url()
  check('technician UserMenu Profile navigates to technician profile route', url.includes('/app/technician/profile'), url)
  const techProfileCalls = techCalls.filter(c => c.includes('/technician/'))
  check('technician profile API calls are 200 (no 401)', techProfileCalls.length > 0 && techProfileCalls.every(c => c.startsWith('200')), techProfileCalls.join(', ') || '(none)')
  await context.close()
}

await browser.close()
console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
