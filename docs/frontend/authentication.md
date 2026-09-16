# Authentication Architecture — Enterprise Policy & Implementation

**Status:** Locked  
**Last Updated:** 2026-07-30  
**Audited & Hardened:** Phase 18.3C

---

## 1. Authentication Policy

### One Browser Profile = One Authenticated User

The GET Solar Energy platform enforces a strict single-session-per-browser-profile policy. Logging in as any account (Customer, Technician, Vendor, Engineer, Admin) replaces the currently authenticated session entirely.

**Do NOT** attempt to support multiple simultaneous authenticated users within the same browser profile. Developers who need concurrent sessions must use:
- Different browsers (Chrome + Firefox + Edge)
- Incognito / Private windows
- Separate browser profiles

### Session Replacement

| Action | Behavior |
|--------|----------|
| Login as User A in Tab A | User A session established |
| Login as User B in Tab B | Tab A automatically syncs to User B session |
| Logout in Tab A | Tab B automatically redirects to login |

---

## 2. Architecture

### Files

| File | Role |
|------|------|
| `src/contexts/AuthContext.jsx` | Single source of truth for auth state. Holds `isAuthenticated`, `token`, `user`, `loading`, `sessionFlash`. Exposes `login`, `technicianLogin`, `technicianSignup`, `logout`, `setSession`, `dismissSessionFlash`. |
| `src/services/auth.service.js` | API service layer. Calls `/technician/login`, `/technician/signup`, `/signup`, `/forgot-password`, `/reset-password`. |
| `src/utils/auth.ts` | `normalizeAuthenticatedUser()` — transforms raw backend responses into canonical `AuthenticatedUser`. |
| `src/utils/role.ts` | `normalizeRole()`, `getDisplayRole()`, `getDefaultRoute()` — role normalization and mapping. |
| `src/config/roles.ts` | `ROLES` enum, `ROLE_HIERARCHY`, `roleGte()` utility. |
| `src/config/permissions.ts` | `FEATURE_PERMISSIONS` — maps `FeatureId` to allowed roles. |
| `src/hooks/usePermissions.ts` | React hook: reads `auth.user.role` from AuthContext, exposes `canAccess(feature)`, `hasRole(role)`, `hasAnyRole(roles)`. |
| `src/routes/PermissionGuard.tsx` | Route guard: checks `canAccess(feature)` and redirects to `AccessDenied` if unauthorized. |
| `src/stores/authStore.ts` | **Orphaned** — Zustand store with persist middleware. NOT synchronized with AuthContext. Used only by landing page components (`useAuthStatus`). |

### Data Flow

```
Login Form
  │
  ▼
AuthContext.login() / technicianLogin()
  │
  ├─ api.post('/login', ...)        ← Backend authentication
  ├─ normalizeAuthenticatedUser()   ← Canonical user shape
  ├─ persistSession(token, user)
  │   ├─ localStorage.setItem('access_token', token)
  │   ├─ localStorage.setItem('user', JSON.stringify(user))
  │   └─ set React state (token, user, isAuthenticated)
  │
  └─ return { success: true }

Cross-tab sync (OTHER tabs):
  │
  └─ window 'storage' event fires
      ├─ key === 'access_token' && !newValue  → clearSession()
      ├─ key === 'access_token' && newValue    → reloadSession()
      └─ key === 'user'                        → reloadSession()
```

### Consumer Chain

```
AuthContext state changes
  │
  ├─ useAuth() — Topbar, UserMenu, ProtectedRoute, PermissionGuard
  ├─ usePermissions() — Sidebar, PermissionGuard, AdminGuard
  │   └─ reads auth.user.role
  │
  └─ All consumers re-render automatically via React context propagation
```

---

## 3. Multi-Tab Synchronization

### Mechanism

The `window.addEventListener('storage', handler)` fires in all tabs except the one that triggered the `localStorage` change. The handler (`AuthContext.jsx:124-141`) watches two keys:

| Key | New Value | Action |
|-----|-----------|--------|
| `access_token` | `null` | `clearSession()` — logout |
| `access_token` | truthy | `reloadSession()` — compare identity |
| `user` | any | `reloadSession()` — compare identity |

### Identity Comparison

`reloadSession()` reads both keys from localStorage and compares against the current session via `liveIdentity` ref:

```js
identityChanged =
  current.token !== savedToken ||
  current.user?.email !== parsed.email ||
  current.user?.role !== parsed.role
```

If identity changed: state updates (`setToken`, `setUser`, `setIsAuthenticated(true)`) + `sessionFlash` notification + `AUTH_EVENTS.SESSION_RESTORED` log event with `source: 'cross-tab'`.

### Notification

A fixed top bar appears for 4 seconds when another tab changes the session:
> "Your session changed in another tab. Refreshing..."

The bar is dismissible by clicking. Defined via `.session-flash` CSS in `auth.css`.

### Verified Scenarios

| Scenario | Expected | Mechanism |
|----------|----------|-----------|
| Admin → Technician | Tab A syncs to Technician session. AccessDenied on admin pages. | `access_token` written → `reloadSession()` → identity diff → state update + flash |
| Technician → Admin | Tab A syncs to Admin session. All admin features accessible. | Same as above |
| Vendor → Admin | Tab A syncs to Admin session. | Same as above |
| Customer → Technician | Tab A syncs to Technician session. | Same as above |
| Logout Tab A | Tab B clears session → redirects to login | `access_token` removed → `clearSession()` → `isAuthenticated=false` → `ProtectedRoute` redirects |
| Token refresh Tab B | Tab A silently updates token, no logout | `access_token` written → `reloadSession()` → same email+role → no flash |
| Session expiration | On next storage event or reload → `isTokenExpired()` → `clearSession()` | Token parse + exp check |

---

## 4. Security

### Permission Enforcement Chain

```
ProtectedRoute (App.jsx:67)
  └─ isAuthenticated? render : redirect to /login

PermissionGuard (routes/PermissionGuard.tsx)
  └─ canAccess(feature)? render : render <AccessDenied>

AdminGuard (routes/AdminGuard.tsx)
  └─ PermissionGuard with feature="admin-dashboard"
```

All guards use `useAuth()` and `usePermissions()` hooks — they re-render synchronously when AuthContext state changes.

### localStorage Keys

| Key | Content |
|-----|---------|
| `access_token` | JWT string |
| `user` | JSON: `AuthenticatedUser` (id, email, name, role, displayRole, avatar, phone, city) |
| `refresh_token` | Written by backend, removed on clearSession |

### Auth Logging

All auth events are logged via `logAuthEvent()` (DEV console group only):
- `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_LOGOUT`
- `AUTH_SESSION_RESTORED`, `AUTH_SESSION_EXPIRED`
- `AUTH_PERMISSION_DENIED`

---

## 5. Testing Recommendations

### Manual Cross-Tab Test

1. Open two browser tabs to the same app URL
2. Log in as Admin in Tab A
3. Without closing Tab A, log in as Technician in Tab B
4. Verify Tab A shows the session flash notification
5. Verify Tab A's sidebar shows technician navigation
6. Verify Tab A's UserMenu shows technician name/role
7. Verify Tab A's ProtectedRoute allows authenticated access
8. Verify Tab A's PermissionGuard denies admin-only pages

### Test Matrix

```
Tab A Initial Role    Tab B Action          Expected Tab A Result
──────────────────────────────────────────────────────────────────
Admin                 Technician login      Syncs to tech session, flash shown
Technician            Admin login           Syncs to admin session, flash shown
Customer              Technician login      Syncs to tech session, flash shown
Any role              Logout                Session cleared, redirect to login
Any role              Token refresh         Silent token update, no flash
Expired token load    (page reload)         Session cleared, redirect to login
```

---

## 6. Remaining Risks

1. **Zustand authStore orphan** (`src/stores/authStore.ts`): The Zustand store and its consumer `useAuthStatus()` are disconnected from AuthContext. `MobileDrawer` and `SiteHeader` call `useAuthStore.getState().logout()` which removes localStorage keys but doesn't update AuthContext in the same tab. Cross-tab sync still works (storage events propagate), but same-tab AuthContext state becomes stale until next page load. **Mitigation**: Landing page is public; auth-required navigation happens inside AuthContext-controlled routes.

2. **Race condition on double storage events**: `persistSession` writes `access_token` then `user` in sequence. Between the two writes, a listening tab's `reloadSession()` may read partially-updated state. The second `user` event immediately corrects it. No user-visible flash occurs.

3. **No automatic role-based route redirect**: When identity changes from one role to another, the current page may become inaccessible (`PermissionGuard` → `AccessDenied`). The session flash notification explains the change, and the `AccessDenied` "Return to Dashboard" button navigates to `/app/home`. **Note**: `/app/home` is customer-only; non-customer roles see another `AccessDenied`. This is a pre-existing routing structure issue.

---

## 7. Lock

This authentication architecture is locked as of Phase 18.3C. No further authentication changes should be made unless a critical production bug is discovered. Future frontend phases should assume this architecture is stable and correct.
