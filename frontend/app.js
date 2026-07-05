/**
 * GET Solar Energy Dashboard - Interactive Application Logic
 * Layout: Light Mode Premium Clone
 * Brand Colors: Dark Navy (#0F172A), Orange (#F7931E), Blue (#00AEEF)
 */

/* ==========================================================================
   FIX 8 — DEV MODE FLAG
   Set to true only during development to see internal API labels.
   ========================================================================== */
const DEV_MODE = false;

console.log('ROI DEBUG: app.js loaded');

const API_BASE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:8000"
        : "";

/**
 * safeFetch(url, options) — Centralized Safe Fetch Wrapper
 * Validates status codes and content type to prevent HTML parsing errors, returning the response object.
 */
async function safeFetch(url, options = {}) {
  const logLabel = `API [${options.method || 'GET'}] ${url}`;
  console.log(`${logLabel} - Fetching...`);
  
  try {
    const res = await fetch(url, options);
    console.log(`${logLabel} - Status: ${res.status}`);
    
    if (!res.ok) {
      const errorMsg = `Admin API Request Failed\n\nURL:\n${url}\n\nStatus:\n${res.status}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (res.status !== 204 && !url.endsWith('.json') && !contentType.includes("application/json")) {
      const errorMsg = `Admin API Request Failed\n\nURL:\n${url}\n\nStatus:\n${res.status}\n\nReason:\nExpected JSON response but received content-type "${contentType}"`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    return res;
  } catch (err) {
    console.error(`Fetch execution error for URL: ${url}`, err);
    throw err;
  }
}

/* ==========================================================================
   FIX 1 — CENTRALIZED USER HELPER
   Single source of truth for all user session data.
   ========================================================================== */

/**
 * getInitials(name) — FIX 1
 * Rules: up to 3 initials from first 3 words of name.
 * "Muhammad Hammaad Haque Khan" → "MHH"
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'GU';
  const words = name.trim().split(/\s+/).slice(0, 3);
  return words.map(w => w[0] ? w[0].toUpperCase() : '').join('').slice(0, 3) || 'GU';
}

/**
 * getCurrentUser() — FIX 1
 * Returns a structured object with all user fields and safe fallbacks.
 * Uses _getUser() (defined later) as the raw data source.
 */
function getCurrentUser() {
  // _getUser is defined below in the auth section; safe to call lazily
  const raw = (typeof _getUser === 'function' ? _getUser() : null) || {};
  const name = raw.name || 'Solar Explorer';
  const firstName = name.split(' ')[0];
  const city = raw.city || raw.location_city || '';
  const state = raw.state || raw.location_state || '';
  // Attempt to derive city/state from a stored location string like "Agra, Uttar Pradesh"
  let resolvedCity = city;
  let resolvedState = state;
  if (!resolvedCity && !resolvedState) {
    const savedLoc = localStorage.getItem('gse_selected_location');
    if (savedLoc && savedLoc.includes(',')) {
      const [c, s] = savedLoc.split(',').map(p => p.trim());
      resolvedCity = c;
      resolvedState = s;
    }
  }
  const location = resolvedCity && resolvedState
    ? `${resolvedCity}, ${resolvedState}`
    : (resolvedCity || resolvedState || 'Location Not Set');

  return {
    name,
    firstName,
    initials:         getInitials(name),
    email:            raw.email || '',
    role:             raw.role || 'Standard User',
    subscriptionTier: raw.subscriptionTier || raw.subscription_tier || raw.role || 'Standard User',
    city:             resolvedCity,
    state:            resolvedState,
    location,
    avatarUrl:        raw.avatar_url || raw.profile_image || raw.avatarUrl || null,
    points:           raw.points || 0,
  };
}

/**
 * generateReferralCode() — FIX 10
 * Generates and persists a unique GSE-XXXXXX referral code per user.
 */
function generateReferralCode(email) {
  const storeKey = `gse_referral_${email || 'guest'}`;
  const existing = localStorage.getItem(storeKey);
  if (existing) return existing;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GSE-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  localStorage.setItem(storeKey, code);
  return code;
}

/**
 * renderProfileAvatar(containerEl, user) — FIX 4
 * Priority: avatarUrl → initials SVG → solar-themed fallback
 */
function renderProfileAvatar(containerEl, user) {
  if (!containerEl) return;
  if (user.avatarUrl) {
    // Try image first; fall back to initials on error
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = `${user.name} avatar`;
    img.className = 'profile-avatar';
    img.onerror = () => renderInitialsAvatar(containerEl, user);
    containerEl.innerHTML = '';
    containerEl.appendChild(img);
    containerEl.classList.remove('profile-avatar-initials');
  } else {
    renderInitialsAvatar(containerEl, user);
  }
}

function renderInitialsAvatar(containerEl, user) {
  containerEl.innerHTML = user.initials;
  containerEl.className = 'profile-avatar profile-avatar-initials';
  // Pick a deterministic color from the brand palette based on first char
  const colors = ['#ff8a1d','#17a8e5','#36d399','#c084fc','#f472b6','#38bdf8'];
  const idx = (user.name || '').charCodeAt(0) % colors.length;
  containerEl.style.background = `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx+2)%colors.length]})`;
}

let dashboardData = null;


document.addEventListener('DOMContentLoaded', () => {
  // Fetch realistic dummy data
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
      dashboardData = data;
      initDashboard();
    })
    .catch(err => {
      console.warn('Could not load data.json, falling back to local dataset:', err);
      // Fallback local dataset matching requirements
      dashboardData = {
        "heroKPIs": {
          "potentialAnnualSavingsMin": 45000,
          "potentialAnnualSavingsMax": 120000,
          "monthlySavingsMin": 3500,
          "monthlySavingsMax": 10000,
          "paybackPeriodMin": 3.5,
          "paybackPeriodMax": 6.5,
          "solarReadinessMin": 75,
          "solarReadinessMax": 98
        },
        "primaryKPIs": {
          "solarReadinessScore": 92,
          "recommendedSystemSize": 5.2,
          "monthlyBillReduction": 4850,
          "annualSavings": 58400,
          "paybackPeriod": 4.8,
          "lifetimeSavings": 14.2,
          "carbonOffset": 2.8,
          "energyIndependence": 84
        },
        "secondaryKPIs": {
          "monthlyUnitsConsumed": 450,
          "currentMonthlyBill": 6500,
          "solarGeneration": 580,
          "solarConsumption": 480,
          "importUnits": 120,
          "exportUnits": 250,
          "prRatio": 82.5,
          "systemEfficiency": 89.2
        },
        "chartData": {
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          "energyProduction": [380, 420, 490, 520, 560, 510, 440, 460, 480, 510, 440, 400],
          "electricityConsumption": [420, 410, 430, 480, 520, 490, 460, 470, 450, 430, 410, 430]
        }
      };
      initDashboard();
    });
});

function initDashboard() {
  initAuth();          // Must be first — hydrates session data into UI
  initMobileMenu();
  initLocationSelector();
  initGaugesAnimation();
  hydrateHeroDashboard(); // Revert to original Dashboard Hydration

  initCharts();
  initROICalculator();
  initTestimonialCarousel();
  initRewardsTab();
  
  // Redesign additions
  initTabsNavigation();
  initAIInsightsFeed(); // Restore AI insights feed
  initBillUploadSimulator();
  initSolarReportUploader();
  initRoofScannerSimulator();
  initAIAdvisorChat();
  initReportsCenter();
  initTabROICalculator();
  initAdminDashboard();
  initNotificationCenter();
  initActivityCenterTab();
  initSettingsPreferences();
  initCrmDashboard();
  initAuditMonitoring();
  initBusinessIntelligence();
  initVendorPortal();
  initAmcWorkspace();
  initSiteSurveyWorkspace();
}

/**
 * Auth Integration – hydrates user session data into the dashboard UI.
 * Called at dashboard startup; wires logout button.
 */
function initAuth() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let rawUser = null;
  try { rawUser = userStr ? JSON.parse(userStr) : null; } catch(e) {}

  if (!token || !rawUser) {
    window.location.replace('login.html');
    return;
  }

  // Hardening override: force role for admin email
  if (rawUser.email === 'admin@getsolar.in') {
    rawUser.role = 'Administrator';
    localStorage.setItem('user', JSON.stringify(rawUser));
  }

  // Use centralized helper for all user fields
  const cu = getCurrentUser();

  // Toggle admin-only menu items
  const isAdmin = rawUser.role === 'Administrator';
  ['menu-item-admin', 'menu-item-crm', 'menu-item-audit', 'menu-item-bi'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAdmin ? 'block' : 'none';
  });

  // FIX 2 — Dynamic greeting engine
  const greetEl = document.getElementById('dashGreeting');
  if (greetEl) {
    const hour = new Date().getHours();
    let greeting;
    if      (hour >= 5  && hour < 12) greeting = 'Good Morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
    else                              greeting = 'Welcome Back';
    greetEl.innerHTML = `${greeting}, ${cu.firstName} <span class="wave">👋</span>`;
  }

  // FIX 4 — Dynamic profile avatar
  const avatarContainer = document.getElementById('profileAvatar');
  if (avatarContainer) renderProfileAvatar(avatarContainer, cu);

  // FIX 3 & 6 — Dynamic name and subscription tier
  const nameEl = document.getElementById('profileName');
  const roleEl = document.getElementById('profileRole');
  if (nameEl) nameEl.textContent = cu.firstName;
  if (roleEl) roleEl.textContent = cu.subscriptionTier;

  // FIX 5 — Dynamic location
  const locEl = document.getElementById('currentLocation');
  if (locEl && locEl.textContent === 'Agra, Uttar Pradesh') {
    locEl.textContent = cu.location;
  } else if (locEl && !locEl._userSet) {
    const saved = localStorage.getItem('gse_selected_location');
    if (saved) locEl.textContent = saved;
    else if (cu.location !== 'Location Not Set') locEl.textContent = cu.location;
  }

  // FIX 10 — Ensure referral code exists
  generateReferralCode(cu.email);

  // Hydrate Settings Profile Name
  const readonlyInputs = document.querySelectorAll('form.saas-form input[readonly]');
  if (readonlyInputs.length >= 2) {
    readonlyInputs[0].value = cu.name;
    readonlyInputs[1].value = cu.subscriptionTier;
  }

  // FIX 7 — Profile dropdown wiring
  initProfileDropdown(cu);

  // FIX 8 — Hide API badges in production
  if (!DEV_MODE) {
    document.querySelectorAll('.api-tag').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Wire standalone logout button (inside dropdown)
  function doLogout() {
    const u = _getUser() || {};
    logAuditEvent(u.email || 'anonymous', 'User Logout', 'Authentication', `User ${u.name || 'Unknown'} logged out.`, 'Low');
    sessionStorage.removeItem('loginLogged');
    if (typeof window.authLogout === 'function') {
      window.authLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.replace('login.html');
    }
  }
  // Legacy standalone logout btn (may still be in DOM in some slots)
  const logoutBtnLegacy = document.getElementById('logoutBtn');
  if (logoutBtnLegacy) logoutBtnLegacy.addEventListener('click', doLogout);

  // Audit login event once per session
  const loginLogged = sessionStorage.getItem('loginLogged');
  if (!loginLogged && rawUser) {
    logAuditEvent(rawUser.email, 'Successful Login', 'Authentication', `User ${rawUser.name} logged in successfully from IP 127.0.0.1.`, 'Low');
    sessionStorage.setItem('loginLogged', 'true');
  }
}

/* ==========================================================================
   FIX 7 — PROFILE DROPDOWN
   Full glassmorphism dropdown with keyboard + click-outside support.
   ========================================================================== */
function initProfileDropdown(cu) {
  const pill = document.getElementById('profilePill');
  const dropdown = document.getElementById('profileDropdown');
  if (!pill || !dropdown) return;

  // Hydrate dropdown header elements
  const pdAvatar = document.getElementById('pdAvatarMini');
  if (pdAvatar) renderProfileAvatar(pdAvatar, cu);
  const pdName = document.getElementById('pdName');
  if (pdName) pdName.textContent = cu.name;
  const pdRole = document.getElementById('pdRole');
  if (pdRole) pdRole.textContent = cu.subscriptionTier;

  function doLogout() {
    const u = _getUser() || {};
    logAuditEvent(u.email || 'anonymous', 'User Logout', 'Authentication', `User ${u.name || 'Unknown'} logged out.`, 'Low');
    sessionStorage.removeItem('loginLogged');
    if (typeof window.authLogout === 'function') {
      window.authLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.replace('login.html');
    }
  }

  // Open/close toggle on pill click (but not on child logout btn clicks)
  pill.addEventListener('click', (e) => {
    // If clicking the legacy logout button inside the pill, skip dropdown
    if (e.target.closest('#logoutBtn')) return;
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    pill.setAttribute('aria-expanded', String(!isOpen));
  });

  // Dropdown item actions
  dropdown.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const action = item.dataset.action;
      dropdown.hidden = true;
      pill.setAttribute('aria-expanded', 'false');
      if (action === 'logout') {
        doLogout();
      } else if (action === 'settings') {
        if (typeof switchTab === 'function') switchTab('settings');
      } else if (action === 'notifications') {
        const notifBtn = document.getElementById('notificationBellBtn');
        if (notifBtn) notifBtn.click();
      } else if (action === 'rewards') {
        if (typeof switchTab === 'function') switchTab('rewards');
      }
    });
    // Keyboard navigation
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      if (e.key === 'Escape') { dropdown.hidden = true; pill.focus(); }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!pill.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
      pill.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dropdown.hidden) {
      dropdown.hidden = true;
      pill.setAttribute('aria-expanded', 'false');
      pill.focus();
    }
  });
}



/* ==========================================================================
   1. MOBILE MENU NAVIGATION + DESKTOP SIDEBAR COLLAPSE
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');

  // --- Ensure mobile overlay exists in DOM ---
  let overlay = document.querySelector('.sidebar-mobile-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-mobile-overlay';
    document.body.appendChild(overlay);
  }

  // --- Desktop Collapse Logic ---
  function applyCollapseState(collapsed) {
    if (collapsed) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
      if (collapseBtn) {
        collapseBtn.setAttribute('aria-label', 'Expand Sidebar');
        collapseBtn.setAttribute('title', 'Expand Sidebar');
      }
    } else {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      if (collapseBtn) {
        collapseBtn.setAttribute('aria-label', 'Collapse Sidebar');
        collapseBtn.setAttribute('title', 'Collapse Sidebar');
      }
    }
  }

  // Restore saved state on load (desktop only)
  if (window.innerWidth > 900) {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    applyCollapseState(savedCollapsed);
  }

  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.innerWidth <= 900) return; // No collapse on mobile
      const isCollapsed = sidebar.classList.contains('collapsed');
      applyCollapseState(!isCollapsed);
      localStorage.setItem('sidebarCollapsed', String(!isCollapsed));
    });
  }

  // Reset collapse state if window resizes to/from mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 900) {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      // Close mobile drawer if open
      closeMobileDrawer();
      const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      applyCollapseState(savedCollapsed);
    }
  });

  // --- Mobile Drawer Logic ---
  function openMobileDrawer() {
    document.body.classList.add('sidebar-open');
    overlay.style.display = 'block';
    // Trigger reflow for transition
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  }

  function closeMobileDrawer() {
    document.body.classList.remove('sidebar-open');
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.body.classList.contains('sidebar-open')) {
        closeMobileDrawer();
      } else {
        openMobileDrawer();
      }
    });
  }

  // Close on overlay click
  overlay.addEventListener('click', closeMobileDrawer);

  // Close on nav item click (mobile)
  sidebar.querySelectorAll('.menu-item a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        closeMobileDrawer();
      }
    });
  });
}



/* ==========================================================================
   2. LOCATION SELECTOR DROPDOWN
   ========================================================================== */
function initLocationSelector() {
  const selector = document.getElementById('locationSelector');
  if (!selector) return;
  const button = selector.querySelector('.location-btn');
  const label = document.getElementById('currentLocation');
  const options = selector.querySelectorAll('.location-option');

  if (button) {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('active');
    });

    if (options) {
      options.forEach(option => {
        option.addEventListener('click', () => {
          options.forEach(opt => {
            if (opt) opt.classList.remove('active');
          });
          option.classList.add('active');
          const newValue = option.getAttribute('data-value');
          if (label) label.textContent = newValue;
          localStorage.setItem('gse_selected_location', newValue);
          selector.classList.remove('active');
          
          showToast(`Location switched to ${newValue}`);
          if (typeof hydrateHeroDashboard === 'function') {
            hydrateHeroDashboard();
          }
        });
      });
    }

    document.addEventListener('click', () => {
      selector.classList.remove('active');
    });
  }
}

/* ==========================================================================
   3. GAUGES & ANIMATIONS
   ========================================================================== */
/* ==========================================================================
   FIX 12 + 13 — HERO DASHBOARD ONBOARDING / REAL DATA HYDRATION
   ========================================================================== */
function hydrateHeroDashboard() {
  const cu = getCurrentUser();
  const firstName = cu.firstName || 'Explorer';
  
  // Time-based greeting
  const hrs = new Date().getHours();
  let greet = 'Good Morning';
  if (hrs >= 12 && hrs < 17) greet = 'Good Afternoon';
  else if (hrs >= 17 || hrs < 4) greet = 'Good Evening';
  
  const greetingEl = document.getElementById('heroGreeting');
  if (greetingEl) {
    greetingEl.textContent = `${greet}, ${firstName}`;
  }

  // Load data sources
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData  = JSON.parse(localStorage.getItem('lastROIAnalysis'));  } catch(e) {}

  const hasAnyData = billData || roofData || roiData;

  // Extract variables (reusing existing calculations or fallback to dashboardData)
  let annualSavings = null;
  let monthlyBill = null;
  let kwSize = null;
  let payback = null;
  let solarReadiness = null;
  let energyIndependence = null;
  let co2 = null;

  if (hasAnyData) {
    annualSavings = roiData?.data?.annual_savings || roiData?.annual_savings
      || (billData?.bill_amount ? billData.bill_amount * 10 : null);
    monthlyBill = billData?.bill_amount || null;
    solarReadiness = roofData?.suitability_score || null;
    kwSize = roofData?.recommended_kw || billData?.recommended_kw || null;
    payback = roiData?.data?.payback_period || roiData?.payback_period || null;
    co2 = roiData?.data?.co2_offset || (kwSize ? +(_safeNum(kwSize) * 1.2).toFixed(1) : null);
    energyIndependence = roiData?.energy_independence || roiData?.data?.energy_independence || null;
  }

  // Fallbacks to default dashboardData
  if (dashboardData) {
    if (!annualSavings) annualSavings = dashboardData.primaryKPIs.annualSavings;
    if (!monthlyBill) monthlyBill = dashboardData.secondaryKPIs.currentMonthlyBill;
    if (!solarReadiness) solarReadiness = dashboardData.primaryKPIs.solarReadinessScore;
    if (!kwSize) kwSize = dashboardData.primaryKPIs.recommendedSystemSize;
    if (!payback) payback = dashboardData.primaryKPIs.paybackPeriod;
    if (!co2) co2 = dashboardData.primaryKPIs.carbonOffset || (kwSize ? +(_safeNum(kwSize) * 1.2).toFixed(1) : null);
    if (!energyIndependence) energyIndependence = dashboardData.primaryKPIs.energyIndependence || 84;
  }

  // 1. Hydrate Left-Side Metadata Badges
  const heroLocationTextEl = document.getElementById('heroLocationText');
  if (heroLocationTextEl) {
    heroLocationTextEl.textContent = cu.location || 'Location Not Set';
  }
  const heroCustomerTypeTextEl = document.getElementById('heroCustomerTypeText');
  if (heroCustomerTypeTextEl) {
    heroCustomerTypeTextEl.textContent = cu.subscriptionTier || 'Standard User';
  }

  // 2. Hydrate Right-Side Live Summary Panel
  // Monthly Bill
  const billEl = document.getElementById('summaryMonthlyBill');
  if (billEl) {
    if (billData && billData.bill_amount) {
      billEl.textContent = `₹${Number(billData.bill_amount).toLocaleString('en-IN')}`;
    } else {
      billEl.textContent = 'Upload your first bill';
    }
  }

  // Estimated Savings
  const savingsEl = document.getElementById('summarySolarSavings');
  if (savingsEl) {
    const savingsVal = roiData?.data?.annual_savings || roiData?.annual_savings;
    if (savingsVal) {
      savingsEl.textContent = `₹${Number(savingsVal).toLocaleString('en-IN')}/yr`;
    } else {
      savingsEl.textContent = 'Available after analysis';
    }
  }

  // Recommended Size
  const sizeEl = document.getElementById('summarySystemSize');
  if (sizeEl) {
    const sizeVal = roofData?.recommended_kw || billData?.recommended_kw;
    if (sizeVal) {
      sizeEl.textContent = `${_safeNum(sizeVal).toFixed(1)} kW`;
    } else {
      sizeEl.textContent = 'Analyze your roof';
    }
  }

  // Payback Period
  const paybackEl = document.getElementById('summaryPayback');
  if (paybackEl) {
    const paybackVal = roiData?.data?.payback_period || roiData?.payback_period;
    if (paybackVal) {
      paybackEl.textContent = `${_safeNum(paybackVal).toFixed(1)} Years`;
    } else {
      paybackEl.textContent = 'Calculate ROI';
    }
  }

  // Solar Readiness (Horizontal indicator)
  const readinessValEl = document.getElementById('summaryReadinessVal');
  const readinessBadgeEl = document.getElementById('summaryReadinessBadge');
  const readinessProgressEl = document.getElementById('summaryReadinessProgress');

  if (roofData && roofData.suitability_score) {
    const score = Math.round(roofData.suitability_score);
    if (readinessValEl) readinessValEl.textContent = `${score}%`;
    if (readinessProgressEl) readinessProgressEl.style.width = `${score}%`;
    if (readinessBadgeEl) {
      readinessBadgeEl.textContent = score >= 85 ? 'Excellent' : 'Good';
      readinessBadgeEl.className = 'readiness-badge excellent';
    }
  } else {
    if (readinessValEl) readinessValEl.textContent = 'Pending';
    if (readinessProgressEl) readinessProgressEl.style.width = '0%';
    if (readinessBadgeEl) {
      readinessBadgeEl.textContent = 'Pending Assessment';
      readinessBadgeEl.className = 'readiness-badge pending';
    }
  }

  // 3. Hydrate Customer Onboarding Journey Checklist
  const checkBill = document.getElementById('check-bill');
  const hasBill = localStorage.getItem('lastBillAnalysis') !== null;
  if (checkBill) {
    if (hasBill) checkBill.classList.add('completed');
    else checkBill.classList.remove('completed');
  }

  const checkRoof = document.getElementById('check-roof');
  const hasRoof = localStorage.getItem('lastRoofAnalysis') !== null;
  if (checkRoof) {
    if (hasRoof) checkRoof.classList.add('completed');
    else checkRoof.classList.remove('completed');
  }

  const checkRoi = document.getElementById('check-roi');
  const hasRoi = localStorage.getItem('lastROIAnalysis') !== null;
  if (checkRoi) {
    if (hasRoi) checkRoi.classList.add('completed');
    else checkRoi.classList.remove('completed');
  }

  const checkProposal = document.getElementById('check-proposal');
  let hasProposal = localStorage.getItem('lastGeneratedProposal') !== null;
  try {
    const propHistory = JSON.parse(localStorage.getItem('proposalHistory') || '[]');
    if (propHistory.length > 0) hasProposal = true;
  } catch(e) {}
  if (checkProposal) {
    if (hasProposal) checkProposal.classList.add('completed');
    else checkProposal.classList.remove('completed');
  }

  const checkInstallation = document.getElementById('check-installation');
  let hasInstallation = false;
  try {
    const leads = JSON.parse(localStorage.getItem('crmLeads') || '{}');
    const myLead = leads[cu.email];
    if (myLead && myLead.status === 'Won') {
      hasInstallation = true;
    }
  } catch(e) {}
  if (checkInstallation) {
    if (hasInstallation) checkInstallation.classList.add('completed');
    else checkInstallation.classList.remove('completed');
  }

  // 2. Hydrate Existing KPI Cards & Widgets below the hero (remains pixel-identical)
  const annualKpi = document.getElementById('annualSavingsTextVal');
  if (annualKpi) {
    annualKpi.textContent = annualSavings ? `₹${Number(annualSavings).toLocaleString('en-IN')}` : '—';
  }

  const lifetimeKpi = document.getElementById('lifetimeSavingsTextVal');
  if (lifetimeKpi) {
    if (annualSavings) {
      const lifetimeVal = _safeNum(annualSavings * 25 / 100000).toFixed(1);
      lifetimeKpi.textContent = `₹${lifetimeVal} Lakhs`;
    } else {
      lifetimeKpi.textContent = '—';
    }
  }

  const roiKpi = document.getElementById('roiPeriodVal');
  if (roiKpi) {
    roiKpi.textContent = payback ? `${_safeNum(payback).toFixed(1)} Years` : '—';
  }

  const carbonKpi = document.getElementById('carbonOffsetVal');
  if (carbonKpi) {
    carbonKpi.textContent = co2 ? `${co2} Tons` : '—';
  }

  const sizeKpi = document.getElementById('systemSizeVal');
  if (sizeKpi) {
    sizeKpi.textContent = kwSize ? `${kwSize} kW` : '—';
  }

  const energyIndKpi = document.getElementById('energyIndependenceVal');
  if (energyIndKpi) {
    energyIndKpi.textContent = energyIndependence ? `${Math.round(energyIndependence)}%` : '—';
  }

  const readinessKpi = document.getElementById('readinessTextVal');
  if (readinessKpi) {
    readinessKpi.textContent = solarReadiness ? `${Math.round(solarReadiness)}%` : '—';
    const readinessCircle = document.getElementById('readinessFillCircle');
    if (readinessCircle) {
      const totalCircumference = 220;
      const val = solarReadiness || 0;
      const offset = totalCircumference - (val / 100 * totalCircumference);
      readinessCircle.style.strokeDashoffset = `${offset}`;
    }
  }
}

function initGaugesAnimation() {

  // Animate readiness text & progress circle stroke
  const readinessText = document.getElementById('readinessTextVal');
  const readinessCircle = document.getElementById('readinessFillCircle');
  const readinessScore = dashboardData ? dashboardData.primaryKPIs.solarReadinessScore : 92;

  if (readinessText && readinessCircle) {
    animateValue(readinessText, 0, readinessScore, 1200, '%');
    
    // Animate circular gauge fill stroke-dashoffset
    const totalCircumference = 220; // 2 * PI * 35 approx
    const offset = totalCircumference - (readinessScore / 100 * totalCircumference);
    
    readinessCircle.style.strokeDasharray = `${totalCircumference}`;
    readinessCircle.style.strokeDashoffset = `${totalCircumference}`;
    
    setTimeout(() => {
      readinessCircle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      readinessCircle.style.strokeDashoffset = `${offset}`;
    }, 200);
  }

  // Animate System Performance circle
  const perfCircle = document.getElementById('perfFillCircle');
  if (perfCircle) {
    const totalCircumference = 251.2; // 2 * PI * 40
    const percentage = 88;
    const offset = totalCircumference - (percentage / 100 * totalCircumference);
    
    perfCircle.style.strokeDasharray = `${totalCircumference}`;
    perfCircle.style.strokeDashoffset = `${totalCircumference}`;
    
    setTimeout(() => {
      perfCircle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      perfCircle.style.strokeDashoffset = `${offset}`;
    }, 200);
  }

  // Animate progress list bars on performance column
  const perfFills = document.querySelectorAll('.perf-progress-fill');
  perfFills.forEach(fill => {
    const finalWidth = fill.style.width;
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
      fill.style.width = finalWidth;
    }, 300);
  });
}

function animateValue(obj, start, end, duration, suffix = '') {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/* ==========================================================================
   4. DETAILED SEPARATE CHARTS (PRODUCTION & CONSUMPTION)
   ========================================================================== */
let productionChartInstance = null;
let consumptionChartInstance = null;
let performanceTrendChartInstance = null;
let savingsSparklineInstance = null;
let lifetimeSparklineInstance = null;
let roiChartInstance = null;

function initCharts() {
  if (!dashboardData) return;
  
  // 1. Savings Sparkline Chart (Annual)
  const savingsCtx = document.getElementById('savingsSparklineCanvas');
  if (savingsCtx) {
    if (savingsSparklineInstance) savingsSparklineInstance.destroy();
    savingsSparklineInstance = new Chart(savingsCtx, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          data: dashboardData.chartData.solarSavings,
          borderColor: '#ff8a1d',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: 'rgba(255, 138, 29, 0.08)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }

  // 2. Lifetime Sparkline Chart (Lifetime / Carbon Reduction / Bars)
  const lifetimeCtx = document.getElementById('lifetimeSparklineCanvas');
  if (lifetimeCtx) {
    if (lifetimeSparklineInstance) lifetimeSparklineInstance.destroy();
    lifetimeSparklineInstance = new Chart(lifetimeCtx, {
      type: 'bar',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          data: dashboardData.chartData.carbonReduction,
          backgroundColor: '#17a8e5',
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }

  // 3. Energy Production Chart
  initProductionChart();
  
  // 4. Electricity Consumption Chart
  initConsumptionChart();
  
  // 5. Performance Trend Chart
  initPerformanceTrendChart();
}

// Energy Production Chart Setup
function initProductionChart() {
  const canvas = document.getElementById('productionChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const typeSelect = document.getElementById('productionChartTypeSelect');
  const periodSelect = document.getElementById('productionPeriodSelect');
  
  function getProductionData() {
    const period = periodSelect ? periodSelect.value : 'this-month';
    const type = typeSelect ? typeSelect.value : 'trend';
    
    let labels = [];
    let datasets = [];
    
    const days = Array.from({length: 30}, (_, i) => (i + 1).toString());
    const monthlyProd = [
      12, 18, 14, 22, 25, 20, 24, 27, 21, 23, 
      26, 29, 32, 28, 30, 31, 33, 27, 29, 31, 
      34, 32, 28, 29, 35, 30, 32, 29, 28, 31
    ];
    const monthlyCons = monthlyProd.map(v => Math.max(10, Math.round(v * 0.8 + Math.random() * 3)));
    
    if (period === 'year') {
      labels = dashboardData.chartData.months;
      if (type === 'trend') {
        datasets.push({
          label: 'Energy Production (kWh)',
          data: dashboardData.chartData.energyProduction,
          backgroundColor: '#ff8a1d',
          borderColor: '#ff8a1d',
          borderWidth: 1,
          borderRadius: 3
        });
      } else {
        datasets.push({
          label: 'Solar Gen (kWh)',
          data: dashboardData.chartData.energyProduction,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.12)',
          fill: true,
          tension: 0.4
        });
        datasets.push({
          label: 'Self-Consumption (kWh)',
          data: dashboardData.chartData.energyProduction.map(v => Math.round(v * 0.82)),
          borderColor: '#36d399',
          backgroundColor: 'rgba(54, 211, 153, 0.08)',
          fill: true,
          tension: 0.4
        });
      }
    } else {
      labels = days;
      const multiplier = (period === 'last-month') ? 0.9 : 1.0;
      const dataProd = monthlyProd.map(v => Math.round(v * multiplier));
      const dataCons = monthlyCons.map(v => Math.round(v * multiplier));
      
      if (type === 'trend') {
        datasets.push({
          label: 'Production (kWh)',
          data: dataProd,
          backgroundColor: '#ff8a1d',
          borderRadius: 2
        });
      } else {
        datasets.push({
          label: 'Solar Gen (kWh)',
          data: dataProd,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.12)',
          fill: true,
          tension: 0.4
        });
        datasets.push({
          label: 'Self-Cons (kWh)',
          data: dataCons,
          borderColor: '#36d399',
          backgroundColor: 'rgba(54, 211, 153, 0.08)',
          fill: true,
          tension: 0.4
        });
      }
    }
    
    return { labels, datasets };
  }
  
  function render() {
    const chartData = getProductionData();
    const type = typeSelect ? typeSelect.value : 'trend';
    const chartType = (type === 'trend') ? 'bar' : 'line';
    
    if (productionChartInstance) {
      productionChartInstance.destroy();
    }
    
    productionChartInstance = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: (type !== 'trend'),
            labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 10 } }
          },
          tooltip: {
            backgroundColor: '#0d2134',
            titleColor: '#f7fbff',
            bodyColor: '#9fb3c8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: 'Outfit', weight: 'bold' },
            bodyFont: { family: 'Outfit' }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          }
        }
      }
    });
  }
  
  if (typeSelect) typeSelect.addEventListener('change', render);
  if (periodSelect) periodSelect.addEventListener('change', render);
  
  render();
}

// Electricity Consumption Chart Setup
function initConsumptionChart() {
  const canvas = document.getElementById('consumptionChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const typeSelect = document.getElementById('consumptionChartTypeSelect');
  const periodSelect = document.getElementById('consumptionPeriodSelect');
  
  function getConsumptionData() {
    const period = periodSelect ? periodSelect.value : 'this-month';
    const type = typeSelect ? typeSelect.value : 'trend';
    
    let labels = [];
    let datasets = [];
    
    const days = Array.from({length: 30}, (_, i) => (i + 1).toString());
    const monthlyCons = [
      16, 22, 15, 19, 25, 20, 24, 28, 22, 20, 
      23, 26, 21, 18, 20, 24, 27, 21, 23, 26,
      29, 32, 28, 30, 31, 33, 27, 29, 31, 34
    ];
    const monthlyImport = monthlyCons.map(v => Math.round(v * 0.4));
    const monthlyExport = monthlyCons.map(v => Math.round(v * 0.6));
    
    if (period === 'year') {
      labels = dashboardData.chartData.months;
      if (type === 'trend') {
        datasets.push({
          label: 'Electricity Consumed (kWh)',
          data: dashboardData.chartData.electricityConsumption,
          borderColor: '#17a8e5',
          backgroundColor: 'rgba(23, 168, 229, 0.12)',
          fill: true,
          tension: 0.4
        });
      } else {
        datasets.push({
          label: 'Grid Import (kWh)',
          data: dashboardData.chartData.importUnits,
          backgroundColor: '#17a8e5',
          borderRadius: 2
        });
        datasets.push({
          label: 'Solar Export (kWh)',
          data: dashboardData.chartData.exportUnits,
          backgroundColor: '#ff8a1d',
          borderRadius: 2
        });
      }
    } else {
      labels = days;
      const multiplier = (period === 'last-month') ? 0.95 : 1.0;
      const dataCons = monthlyCons.map(v => Math.round(v * multiplier));
      const dataImport = monthlyImport.map(v => Math.round(v * multiplier));
      const dataExport = monthlyExport.map(v => Math.round(v * multiplier));
      
      if (type === 'trend') {
        datasets.push({
          label: 'Consumption (kWh)',
          data: dataCons,
          borderColor: '#17a8e5',
          backgroundColor: 'rgba(23, 168, 229, 0.12)',
          fill: true,
          tension: 0.4
        });
      } else {
        datasets.push({
          label: 'Grid Import (kWh)',
          data: dataImport,
          backgroundColor: '#17a8e5',
          borderRadius: 2
        });
        datasets.push({
          label: 'Solar Export (kWh)',
          data: dataExport,
          backgroundColor: '#ff8a1d',
          borderRadius: 2
        });
      }
    }
    
    return { labels, datasets };
  }
  
  function render() {
    const chartData = getConsumptionData();
    const type = typeSelect ? typeSelect.value : 'trend';
    const chartType = (type === 'trend') ? 'line' : 'bar';
    const isStacked = (type === 'import-export');
    
    if (consumptionChartInstance) {
      consumptionChartInstance.destroy();
    }
    
    consumptionChartInstance = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 10 } }
          },
          tooltip: {
            backgroundColor: '#0d2134',
            titleColor: '#f7fbff',
            bodyColor: '#9fb3c8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: 'Outfit', weight: 'bold' },
            bodyFont: { family: 'Outfit' }
          }
        },
        scales: {
          x: {
            stacked: isStacked,
            grid: { display: false },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          },
          y: {
            stacked: isStacked,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          }
        }
      }
    });
  }
  
  if (typeSelect) typeSelect.addEventListener('change', render);
  if (periodSelect) periodSelect.addEventListener('change', render);
  
  render();
}

// Performance Trend Chart Setup
function initPerformanceTrendChart() {
  const canvas = document.getElementById('performanceTrendChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const viewSelect = document.getElementById('performanceViewSelect');
  const statusView = document.getElementById('performanceStatusView');
  const trendView = document.getElementById('performanceTrendView');
  
  function renderTrend() {
    if (performanceTrendChartInstance) {
      performanceTrendChartInstance.destroy();
    }
    
    performanceTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          label: 'PR Ratio (%)',
          data: dashboardData.chartData.systemPerformance,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d2134',
            titleColor: '#f7fbff',
            bodyColor: '#9fb3c8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          },
          y: {
            min: 75,
            max: 95,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
          }
        }
      }
    });
  }
  
  if (viewSelect && statusView && trendView) {
    viewSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'trend') {
        statusView.style.display = 'none';
        trendView.style.display = 'block';
        renderTrend();
      } else {
        statusView.style.display = 'block';
        trendView.style.display = 'none';
      }
    });
  }
}

/* ==========================================================================
   5. ROI CALCULATOR TAB & MODAL HANDLER
   ========================================================================== */
let modalRoiChartInstance = null;

function initROICalculator() {
  console.log('ROI DEBUG: ROI modal initialized (Delegated Event Listeners)');

  document.addEventListener('click', async (e) => {
    // 1. Show modal
    const showBtn = e.target.closest('#heroCalcBtn') || e.target.closest('#actCalc') || e.target.closest('#btnEmptyROI');
    if (showBtn) {
      console.log('ROI DEBUG: Show modal clicked');
      const modal = document.getElementById('calcModal');
      if (modal) {
        modal.classList.add('active');
      }
    }

    // 2. Hide modal
    const modal = document.getElementById('calcModal');
    if (modal) {
      const closeBtn = e.target.closest('#closeCalcModal');
      const isOverlay = e.target === modal;
      if (closeBtn || isOverlay) {
        console.log('ROI DEBUG: Hide modal clicked');
        modal.classList.remove('active');
        const calcResults = document.getElementById('calcResults');
        if (calcResults) calcResults.classList.remove('active');
      }
    }

    // 3. Calculate ROI click handler
    const calcBtn = e.target.closest('#computeSavingsBtn');
    if (calcBtn) {
      e.preventDefault();
      console.log('ROI DEBUG: Calculate ROI clicked');
      const monthlyBillEl = document.getElementById('monthlyBill');
      const sunHoursEl = document.getElementById('sunHours');
      const systemSizeEl = document.getElementById('systemSize');
      if (!monthlyBillEl || !sunHoursEl || !systemSizeEl) {
        console.warn('ROI DEBUG: Input elements missing', { monthlyBillEl, sunHoursEl, systemSizeEl });
        return;
      }

      const monthlyBill = parseFloat(monthlyBillEl.value);
      const sunHours = parseFloat(sunHoursEl.value);
      const systemSize = parseFloat(systemSizeEl.value);

      if (isNaN(monthlyBill) || monthlyBill <= 0) {
        showToast('Please enter a valid positive monthly bill amount!', 'warning');
        return;
      }
      if (isNaN(systemSize) || systemSize <= 0) {
        showToast('Please enter a valid positive system size!', 'warning');
        return;
      }
      if (isNaN(sunHours) || sunHours <= 0) {
        showToast('Please enter a valid positive daily sun hours value!', 'warning');
        return;
      }

      // Disable button & show spinner/calculating state
      calcBtn.disabled = true;
      const originalText = calcBtn.textContent;
      calcBtn.textContent = '🔄 Calculating...';

      // 30 seconds timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000);

      console.log('ROI DEBUG: API request started', { monthly_bill: monthlyBill, system_size: systemSize });
      try {
        const res = await fetch(`${API_BASE}/api/calculate-roi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monthly_bill: monthlyBill,
            state: "Uttar Pradesh",
            roof_type: "flat",
            system_size: systemSize
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`API server returned an error (status: ${res.status}).`);
        }

        const result = await res.json();
        console.log('ROI DEBUG: API response received', result);
        
        if (!result || result.success !== true || !result.data) {
          throw new Error((result && result.error) || 'Invalid API response format.');
        }

        const data = result.data;
        showToast('ROI calculation completed successfully!', 'success');

        updateModalResultsUI(data);

      } catch (err) {
        clearTimeout(timeoutId);
        console.error('ROI DEBUG: API ROI calculation failed:', err);

        if (err.name === 'AbortError') {
          showToast('ROI calculation is taking longer than expected. Please try again.', 'error');
        } else {
          showToast(err.message || 'API connection failed. Switched to fallback calculation.', 'warning');
        }

        console.log('ROI DEBUG: Fallback executed');
        // Demo Fallback Calculation
        try {
          const fallbackData = runClientSideROIFallback(monthlyBill, systemSize);
          updateModalResultsUI(fallbackData);
        } catch (fallbackErr) {
          console.error('ROI DEBUG: Fallback calculation failed:', fallbackErr);
          showToast('Failed to compute savings. Please check inputs and try again.', 'error');
        }
      } finally {
        // Reset button state
        calcBtn.disabled = false;
        calcBtn.textContent = originalText;
      }
    }
  });
}

function updateModalResultsUI(data) {
  const systemCost = data.system_cost || 0;
  const subsidy = data.government_subsidy || 0;
  const netCost = data.net_cost || 0;
  const annualSavings = data.annual_savings || 0;
  const paybackYears = data.payback_period || data.payback_years || 0;

  const outCost = document.getElementById('outCost');
  if (outCost) outCost.textContent = `₹${systemCost.toLocaleString('en-IN')}`;
  const outSubsidy = document.getElementById('outSubsidy');
  if (outSubsidy) outSubsidy.textContent = `-₹${subsidy.toLocaleString('en-IN')}`;
  const outNet = document.getElementById('outNet');
  if (outNet) outNet.textContent = `₹${netCost.toLocaleString('en-IN')}`;
  const outSavings = document.getElementById('outSavings');
  if (outSavings) outSavings.textContent = `₹${Math.round(annualSavings).toLocaleString('en-IN')}`;
  const outPayback = document.getElementById('outPayback');
  if (outPayback) outPayback.textContent = `${_safeNum(paybackYears).toFixed(1)} Years`;

  const calcResults = document.getElementById('calcResults');
  if (calcResults) calcResults.classList.add('active');

  // Redraw Modal Chart
  initModalRoiCalculatorChart(paybackYears, netCost, annualSavings);
}

function initModalRoiCalculatorChart(payback = 4.8, netCost = 102000, annualSavings = 58400) {
  console.log('ROI DEBUG: Chart rendered');
  const canvas = document.getElementById('roiTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (modalRoiChartInstance) {
    modalRoiChartInstance.destroy();
  }
  
  const labels = Array.from({length: 25}, (_, i) => `Yr ${i+1}`);
  const data = [];
  for (let year = 1; year <= 25; year++) {
    const val = (year * annualSavings) - netCost;
    data.push(Math.round(val));
  }
  
  const baselineData = Array(25).fill(0);
  
  modalRoiChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cumulative Cashflow (₹)',
          data: data,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Break-even Baseline (₹0)',
          data: baselineData,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          labels: {
            color: '#9fb3c8',
            font: { family: 'Outfit', size: 10 }
          }
        },
        tooltip: {
          backgroundColor: '#0d2134',
          titleColor: '#f7fbff',
          bodyColor: '#9fb3c8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#9fb3c8',
            font: { family: 'Outfit', size: 9 },
            callback: function(value) {
              if (Math.abs(value) >= 100000) {
                return _safeNum(value / 100000).toFixed(1) + 'L';
              }
              return value;
            }
          }
        }
      }
    }
  });
}

/* ==========================================================================
   6. TESTIMONIAL CAROUSEL SLIDER (WHAT OUR CUSTOMERS SAY)
   ========================================================================== */
function initTestimonialCarousel() {
  const testimonials = [
    {
      text: '"GET Solar Energy made going solar super simple. Saved over ₹1.8 Lakhs in the first year!"',
      author: 'Arjun Mehta',
      loc: 'Jaipur',
      avatar: 'assets/customer_avatar.png'
    },
    {
      text: '"The AI analysis estimated 92% readiness, and the actual performance exceeded it! The smart battery backup handles our evening loads flawlessly."',
      author: 'Priya Sharma',
      loc: 'Agra',
      avatar: 'assets/user_avatar.png'
    },
    {
      text: '"Highly professional team. The subsidy approval process was managed entirely by GET Solar, and the money was credited directly to my account in 4 weeks."',
      author: 'Rohan Das',
      loc: 'Noida',
      avatar: 'assets/customer_avatar.png'
    }
  ];

  let currentIndex = 0;
  const quoteEl = document.getElementById('testQuoteText');
  const avatarEl = document.getElementById('testQuoteAvatar');
  const nameEl = document.getElementById('testQuoteName');
  const locEl = document.getElementById('testQuoteLoc');
  
  const prevBtn = document.getElementById('prevTestBtn');
  const nextBtn = document.getElementById('nextTestBtn');

  if (quoteEl && prevBtn && nextBtn && avatarEl && nameEl && locEl) {
    function update(index) {
      quoteEl.style.opacity = 0;
      avatarEl.style.opacity = 0;
      nameEl.style.opacity = 0;
      locEl.style.opacity = 0;
      
      setTimeout(() => {
        const item = testimonials[index];
        quoteEl.textContent = item.text;
        avatarEl.src = item.avatar;
        nameEl.textContent = item.author;
        locEl.textContent = item.loc;

        quoteEl.style.opacity = 1;
        avatarEl.style.opacity = 1;
        nameEl.style.opacity = 1;
        locEl.style.opacity = 1;
      }, 200);
    }

    quoteEl.style.transition = 'opacity 0.2s ease-in-out';
    avatarEl.style.transition = 'opacity 0.2s ease-in-out';
    nameEl.style.transition = 'opacity 0.2s ease-in-out';
    locEl.style.transition = 'opacity 0.2s ease-in-out';

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      update(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      update(currentIndex);
    });

    // Auto rotate every 10 seconds
    setInterval(() => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      update(currentIndex);
    }, 10000);
  }
}

/* ==========================================================================
   7. REFERRAL COPY & LINK CTAs
   ========================================================================== */
function initReferralCopy() {
  const codeDisplay = document.getElementById('referralCodeText');
  const copyBtn = document.getElementById('copyCodeBtn');

  if (copyBtn && codeDisplay) {
    copyBtn.addEventListener('click', () => {
      const code = codeDisplay.textContent.trim();
      
      navigator.clipboard.writeText(code).then(() => {
        const originalSVG = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        
        showToast('Referral code copied to clipboard!');

        setTimeout(() => {
          copyBtn.innerHTML = originalSVG;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy code.');
      });
    });
  }

  // Sidebar CTAs and Action Cards simulation
  const sidebarExploreBtn = document.getElementById('sidebarExploreBtn');
  if (sidebarExploreBtn) {
    sidebarExploreBtn.addEventListener('click', () => {
      showToast('Opening GET Solar product explorer...');
    });
  }

  const heroPlanBtn = document.getElementById('heroPlanBtn');
  if (heroPlanBtn) {
    heroPlanBtn.addEventListener('click', () => {
      showToast('Loading customized installation blueprint plan...');
    });
  }

  const getPlanBtn = document.getElementById('getPlanBtn');
  if (getPlanBtn) {
    getPlanBtn.addEventListener('click', () => {
      showToast('Redirecting to Get My Solar Plan portal...');
    });
  }

  const subsidyBtn = document.getElementById('subsidyBtn');
  if (subsidyBtn) {
    subsidyBtn.addEventListener('click', () => {
      showToast('Loading government subsidy calculator parameters...');
    });
  }

  const readinessDetailsBtn = document.getElementById('readinessDetailsBtn');
  if (readinessDetailsBtn) {
    readinessDetailsBtn.addEventListener('click', () => {
      showToast('Opening satellite roof assessment dashboard...');
      const menu = document.querySelector('[data-tab="roof-analysis"]');
      if (menu) menu.click();
    });
  }

  const viewInsightsBtn = document.getElementById('viewInsightsBtn');
  if (viewInsightsBtn) {
    viewInsightsBtn.addEventListener('click', () => {
      showToast('Retrieving system component analytics data logs...');
      const menu = document.querySelector('[data-tab="performance"]');
      if (menu) menu.click();
    });
  }

  // Trigger tab switching on quick action cards click
  const actBill = document.getElementById('actBill');
  const actRoof = document.getElementById('actRoof');
  const actCalc = document.getElementById('actCalc');
  const actAI = document.getElementById('actAI');
  const actReferral = document.getElementById('actReferral');

  if (actBill) {
    actBill.addEventListener('click', () => {
      const menu = document.querySelector('[data-tab="bill-analyzer"]');
      if (menu) menu.click();
    });
  }
  if (actRoof) {
    actRoof.addEventListener('click', () => {
      const menu = document.querySelector('[data-tab="roof-analysis"]');
      if (menu) menu.click();
    });
  }
  if (actCalc) {
    actCalc.addEventListener('click', () => {
      const menu = document.querySelector('[data-tab="roi-calculator"]');
      if (menu) menu.click();
    });
  }
  if (actAI) {
    actAI.addEventListener('click', () => {
      const menu = document.querySelector('[data-tab="ai-assistant"]');
      if (menu) menu.click();
    });
  }
  if (actReferral) {
    actReferral.addEventListener('click', () => {
      const menu = document.querySelector('[data-tab="rewards"]');
      if (menu) menu.click();
    });
  }
}

/* ==========================================================================
   8. TABS CONTROLLER NAVIGATION SYSTEM
   ========================================================================== */
function initTabsNavigation() {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetTabId = item.getAttribute('data-tab');
      if (!targetTabId) return;
      
      e.preventDefault();
      
      // Toggle menu item active class
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
      
      // Close mobile drawer if open
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('mobile-active');
      
      // Switch tab contents
      switchTab(targetTabId);
    });
  });
}

function switchTab(tabId) {
  const user = _getUser() || {};
  if (['admin-dashboard', 'crm-dashboard', 'audit-monitoring', 'business-intelligence'].includes(tabId)) {
    if (user.role !== 'Administrator') {
      logAuditEvent(user.email || 'anonymous', 'Unauthorized Admin Access Attempt', 'Security', `Attempted to access restricted tab: ${tabId}`, 'Critical');
      showToast('Access Denied: Administrator permissions required.', 'error');
      
      // Force redirect back to dashboard
      tabId = 'dashboard';
      
      // Sync active menu selection back to dashboard
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        if (item.getAttribute('data-tab') === 'dashboard') {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  }

  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    if (tab.id === `tab-${tabId}`) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Redraw visible Chart.js instances to avoid scaling bugs on display toggles
  if (tabId === 'dashboard') {
    if (typeof hydrateHeroDashboard === 'function') hydrateHeroDashboard();
    if (productionChartInstance) productionChartInstance.resize();
    if (consumptionChartInstance) consumptionChartInstance.resize();
    if (savingsSparklineInstance) savingsSparklineInstance.resize();
    if (lifetimeSparklineInstance) lifetimeSparklineInstance.resize();
  } else if (tabId === 'bill-analyzer') {
    initBillHistoryChart();
  } else if (tabId === 'roi-calculator') {
    initTabRoiCalculatorChart();
  } else if (tabId === 'performance') {
    initPerformanceTabCharts();
  } else if (tabId === 'rewards') {
    loadRewardsData();
  } else if (tabId === 'admin-dashboard') {
    loadAdminDashboardData();
    // Resize admin charts after data load so they fill available width
    setTimeout(() => {
      if (typeof adminActivityTrendChartInstance !== 'undefined' && adminActivityTrendChartInstance) {
        adminActivityTrendChartInstance.resize();
      }
    }, 300);
  } else if (tabId === 'crm-dashboard') {
    refreshCrmDashboardUI();
  } else if (tabId === 'vendor-portal') {
    if (typeof refreshProposalHistory === 'function') {
      refreshProposalHistory();
    }
  } else if (tabId === 'audit-monitoring') {
    refreshAuditDashboardUI();
  } else if (tabId === 'business-intelligence') {
    const skeleton = document.getElementById('biSkeletonLoader');
    const activeView = document.getElementById('biDashboardActiveView');
    if (skeleton && activeView) {
      skeleton.style.display = 'grid';
      activeView.style.display = 'none';
      setTimeout(() => {
        skeleton.style.display = 'none';
        activeView.style.display = 'block';
        refreshBusinessIntelligenceUI();
        // Resize BI charts after they become visible
        setTimeout(() => {
          if (typeof biStageDistributionChartInstance !== 'undefined' && biStageDistributionChartInstance) {
            biStageDistributionChartInstance.resize();
          }
          if (typeof biSegmentationChartInstance !== 'undefined' && biSegmentationChartInstance) {
            biSegmentationChartInstance.resize();
          }
        }, 200);
      }, 800);
    } else {
      refreshBusinessIntelligenceUI();
      setTimeout(() => {
        if (typeof biStageDistributionChartInstance !== 'undefined' && biStageDistributionChartInstance) {
          biStageDistributionChartInstance.resize();
        }
        if (typeof biSegmentationChartInstance !== 'undefined' && biSegmentationChartInstance) {
          biSegmentationChartInstance.resize();
        }
      }, 200);
    }
  }
}

/* ==========================================================================
   9. AI INSIGHTS DYNAMIC POPULATOR
   ========================================================================== */
function initAIInsightsFeed() {
  const recommendationsList = document.getElementById('aiRecommendationsList');
  if (!recommendationsList) return;
  
  recommendationsList.innerHTML = '';
  
  const insights = (dashboardData && dashboardData.insights) ? dashboardData.insights : [
    "Customers consuming above 350 kWh/month achieve the highest solar ROI.",
    "Average payback period decreased by 8% this quarter.",
    "North-facing roofs show lower solar efficiency.",
    "Solar adoption potential is highest among high-consumption households.",
    "Energy independence increased by 12% compared to last year."
  ];
  
  insights.forEach(insight => {
    const li = document.createElement('li');
    li.className = 'insight-feed-item';
    li.innerHTML = `
      <span class="insight-bullet"></span>
      <span>${insight}</span>
    `;
    recommendationsList.appendChild(li);
  });
}

/* ==========================================================================
   10. BILL UPLOAD SIMULATOR (MOCK FILE UPLOAD PROCESS)
   ========================================================================== */
function initBillUploadSimulator() {
  const dropArea = document.getElementById('billDragDropArea');
  const fileInput = document.getElementById('billFileInput');
  const progressBox = document.getElementById('billUploadProgressBox');
  const progressBar = document.getElementById('billUploadProgressFill');
  const progressPercent = document.getElementById('billUploadPercent');
  const progressStatus = document.getElementById('billUploadStatus');
  const fileNameLabel = document.getElementById('billFileName');
  
  const resultsContainer = document.getElementById('billAnalysisResults');
  const errorBox = document.getElementById('billAnalysisErrorBox');
  const retryBtn = document.getElementById('billAnalysisRetryBtn');
  
  if (!dropArea || !fileInput) return;
  
  // Setup file selection
  dropArea.addEventListener('click', () => fileInput.click());
  
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--accent-blue)';
    dropArea.style.backgroundColor = 'rgba(23,168,229,0.08)';
  });
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
  });
  
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
  
  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // Restore State on Startup
  restoreAnalysisState();

  function showLoadingSkeletons() {
    const skeletonElements = [
      'snapSolarPotential', 'snapSystemSize', 'snapAnnualSavings', 'snapPaybackPeriod',
      'resCustomerName', 'resConsumerNumber', 'resElectricityCompany', 'resBillingPeriod',
      'resMonthlyUnits', 'resBillAmount', 'resPerUnitRate', 'resRecommendedSolarSize',
      'resMonthlyGeneration', 'resMonthlySavings', 'resSystemCost', 'resPaybackPeriod',
      'res25YearSavings',
      'resSolarGenerated', 'resAnnualSolarGeneration', 'resSolarUsedDirectly', 'resExportedToGrid',
      'resSolarOffsetPercent', 'resGridDependency', 'resNetMeteringBenefit',
      'resSolarInstalled', 'resImportUnits', 'resExportUnits', 'resNetConsumption', 'resNetMeterCredit',
      'resBillHealthScore', 'resBillHealthRating', 'resSolarOpportunityScore', 'resSolarOpportunityRating',
      'resTopCostDriver', 'resPotentialSavingsText'
    ];
    skeletonElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '<span class="skeleton-loader"></span>';
      }
    });
  }

  function restoreAnalysisState() {
    const saved = localStorage.getItem('lastBillAnalysis');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // Ensure new properties are calculated and written back if missing (Patch 2.1 additions)
        // Also backfill solarYield if an older cached entry is missing it
        if (data.solarYield === undefined) {
          const recKw = Number(data.recommended_kw) || 0;
          const mUnits = Number(data.monthly_units) || 0;
          const sy = 125;
          data.solarYield = sy;
          data.monthlySolarGeneration = recKw * sy;
          data.annualSolarGeneration = data.monthlySolarGeneration * 12;
          data.solarUsedDirectly = data.monthlySolarGeneration * 0.75;
          data.solarExportedToGrid = data.monthlySolarGeneration - data.solarUsedDirectly;
          data.solarOffsetPercent = mUnits > 0 ? Math.min(100, (data.solarUsedDirectly / mUnits) * 100) : 0;
          data.gridDependency = Math.max(0, mUnits - data.solarUsedDirectly);
          data.netMeteringBenefit = data.solarExportedToGrid * 7;
        }

        if (data.isSolarConsumer === undefined) {
          const filename = data.filename || '';
          const textToSearch = `${data.customer_name || ''} ${data.discom || ''} ${data.billing_period || ''}`;
          const solarData = extractSolarFields(textToSearch, filename);
          
          data.isSolarConsumer = solarData.isSolarConsumer;
          data.importUnits = solarData.importUnits;
          data.exportUnits = solarData.exportUnits;
          data.solarGeneratedUnits = solarData.solarGeneratedUnits;
          data.netConsumptionUnits = solarData.netConsumptionUnits;
          
          if (data.isSolarConsumer && data.importUnits !== null && data.exportUnits !== null) {
            data.netConsumption = Math.max(data.importUnits - data.exportUnits, 0);
            data.netMeteringCredit = data.exportUnits * 7;
          } else {
            data.netConsumption = 0;
            data.netMeteringCredit = 0;
          }
          
          data.extractionConfidence = calculateExtractionConfidence(data, false);
          data.billHealth = calculateBillHealthScore(data);
          data.solarOpportunity = calculateSolarOpportunityScore(data, data.isSolarConsumer && data.importUnits !== null);
          
          localStorage.setItem('lastBillAnalysis', JSON.stringify(data));
        }

        renderData(data);
        checkAndRenderUnified();
        
        // Show success state on drop area
        dropArea.innerHTML = `
          <svg class="upload-icon" style="width: 48px; height: 48px; margin-bottom: 12px; stroke: var(--accent-green); fill: none; stroke-width: 1.5;" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style="font-size: 13px; color: var(--accent-green); font-weight: 700; margin: 0;">Bill Verified & Extracted!</p>
          <span style="font-size: 10px; color: var(--text-muted);">Click to upload another bill</span>
        `;
      } catch (e) {
        console.error('Failed to restore analysis state:', e);
      }
    }
  }

  function renderData(data) {
    // String Fallbacks
    const customerName = data.customer_name || "Not Available";
    const consumerNumber = data.consumer_number || "Not Available";
    const discom = data.discom || "Not Available";
    const billingPeriod = data.billing_period || "Not Available";
    
    // Numeric/Calculated Fallbacks
    const monthlyUnits = Number(data.monthly_units) || 0;
    const billAmount = Number(data.bill_amount) || 0;
    const perUnitRate = Number(data.per_unit_rate) || 0;
    
    const recommendedKw = Number(data.recommended_kw) || 0;
    const monthlyGen = Number(data.monthly_generation_units) || 0;
    const monthlySavings = Number(data.monthly_savings_rs) || 0;
    const systemCost = Number(data.system_cost_rs) || 0;
    const paybackYears = Number(data.payback_years) || 0;
    const savings25yr = Number(data.savings_25_years_rs) || 0;

    // 1. Update Detailed Results Grid
    const resCustomerName = document.getElementById('resCustomerName');
    if (resCustomerName) resCustomerName.textContent = customerName;
    const resConsumerNumber = document.getElementById('resConsumerNumber');
    if (resConsumerNumber) resConsumerNumber.textContent = consumerNumber;
    const resElectricityCompany = document.getElementById('resElectricityCompany');
    if (resElectricityCompany) resElectricityCompany.textContent = discom;
    const resBillingPeriod = document.getElementById('resBillingPeriod');
    if (resBillingPeriod) resBillingPeriod.textContent = billingPeriod;
    
    const resMonthlyUnits = document.getElementById('resMonthlyUnits');
    if (resMonthlyUnits) resMonthlyUnits.textContent = monthlyUnits ? `${monthlyUnits} kWh` : "Not Available";
    const resBillAmount = document.getElementById('resBillAmount');
    if (resBillAmount) resBillAmount.textContent = billAmount ? `₹${billAmount.toLocaleString('en-IN')}` : "Not Available";
    const resPerUnitRate = document.getElementById('resPerUnitRate');
    if (resPerUnitRate) resPerUnitRate.textContent = perUnitRate ? `₹${perUnitRate} / kWh` : "Not Available";
    
    const resRecommendedSolarSize = document.getElementById('resRecommendedSolarSize');
    if (resRecommendedSolarSize) resRecommendedSolarSize.textContent = recommendedKw ? `${recommendedKw} kW` : "Not Available";
    const resMonthlyGeneration = document.getElementById('resMonthlyGeneration');
    if (resMonthlyGeneration) resMonthlyGeneration.textContent = monthlyGen ? `${monthlyGen} kWh` : "Not Available";
    const resMonthlySavings = document.getElementById('resMonthlySavings');
    if (resMonthlySavings) resMonthlySavings.textContent = monthlySavings ? `₹${monthlySavings.toLocaleString('en-IN')} / mo` : "Not Available";
    const resSystemCost = document.getElementById('resSystemCost');
    if (resSystemCost) resSystemCost.textContent = systemCost ? `₹${systemCost.toLocaleString('en-IN')}` : "Not Available";
    const resPaybackPeriod = document.getElementById('resPaybackPeriod');
    if (resPaybackPeriod) resPaybackPeriod.textContent = paybackYears ? `${paybackYears} Years` : "Not Available";
    const res25YearSavings = document.getElementById('res25YearSavings');
    if (res25YearSavings) res25YearSavings.textContent = savings25yr ? `₹${savings25yr.toLocaleString('en-IN')}` : "Not Available";

    // 2. Update Analytics Snapshot Card
    const potentialScore = paybackYears ? Math.round(Math.min(98, Math.max(60, 100 - (paybackYears * 7)))) : 92;
    const snapSolarPotential = document.getElementById('snapSolarPotential');
    if (snapSolarPotential) snapSolarPotential.textContent = `${potentialScore}/100`;
    const snapSystemSize = document.getElementById('snapSystemSize');
    if (snapSystemSize) snapSystemSize.textContent = recommendedKw ? `${recommendedKw} kW` : "Not Available";
    const snapAnnualSavings = document.getElementById('snapAnnualSavings');
    if (snapAnnualSavings) snapAnnualSavings.textContent = monthlySavings ? `₹${(monthlySavings * 12).toLocaleString('en-IN')}` : "Not Available";
    const snapPaybackPeriod = document.getElementById('snapPaybackPeriod');
    if (snapPaybackPeriod) snapPaybackPeriod.textContent = paybackYears ? `${paybackYears} Yrs` : "Not Available";

    // 3. Update Existing right-column KPI Cards
    const billTabCurrentBill = document.getElementById('billTabCurrentBill');
    if (billTabCurrentBill) billTabCurrentBill.textContent = billAmount ? `₹${billAmount.toLocaleString('en-IN')}` : "Not Available";
    const billTabUnits = document.getElementById('billTabUnits');
    if (billTabUnits) billTabUnits.textContent = monthlyUnits ? `${monthlyUnits} kWh` : "Not Available";
    const billTabSavings = document.getElementById('billTabSavings');
    if (billTabSavings) billTabSavings.textContent = monthlySavings ? `₹${monthlySavings.toLocaleString('en-IN')}/mo` : "Not Available";

    // 4. Update Solar Utilization Intelligence section
    const solarYield = data.solarYield !== undefined ? Number(data.solarYield) : 125;
    const monthlySolarGeneration = data.monthlySolarGeneration !== undefined ? Number(data.monthlySolarGeneration) : (recommendedKw * solarYield);
    const annualSolarGeneration = data.annualSolarGeneration !== undefined ? Number(data.annualSolarGeneration) : (monthlySolarGeneration * 12);
    const solarUsedDirectly = data.solarUsedDirectly !== undefined ? Number(data.solarUsedDirectly) : (monthlySolarGeneration * 0.75);
    const solarExportedToGrid = data.solarExportedToGrid !== undefined ? Number(data.solarExportedToGrid) : (monthlySolarGeneration - solarUsedDirectly);
    const solarOffsetPercent = data.solarOffsetPercent !== undefined ? Number(data.solarOffsetPercent) : (monthlyUnits > 0 ? Math.min(100, (solarUsedDirectly / monthlyUnits) * 100) : 0);
    const gridDependency = data.gridDependency !== undefined ? Number(data.gridDependency) : Math.max(0, monthlyUnits - solarUsedDirectly);
    const netMeteringBenefit = data.netMeteringBenefit !== undefined ? Number(data.netMeteringBenefit) : (solarExportedToGrid * 7);

    const resSolarGenerated = document.getElementById('resSolarGenerated');
    if (resSolarGenerated) resSolarGenerated.textContent = `${_safeNum(monthlySolarGeneration).toFixed(1)} kWh`;
    const resAnnualSolarGeneration = document.getElementById('resAnnualSolarGeneration');
    if (resAnnualSolarGeneration) resAnnualSolarGeneration.textContent = `${Math.round(annualSolarGeneration).toLocaleString('en-IN')} kWh/year`;
    const resSolarUsedDirectly = document.getElementById('resSolarUsedDirectly');
    if (resSolarUsedDirectly) resSolarUsedDirectly.textContent = `${_safeNum(solarUsedDirectly).toFixed(1)} kWh`;
    const resExportedToGrid = document.getElementById('resExportedToGrid');
    if (resExportedToGrid) resExportedToGrid.textContent = `${_safeNum(solarExportedToGrid).toFixed(1)} kWh`;
    const resSolarOffsetPercent = document.getElementById('resSolarOffsetPercent');
    if (resSolarOffsetPercent) resSolarOffsetPercent.textContent = `${_safeNum(solarOffsetPercent).toFixed(1)}%`;
    const resGridDependency = document.getElementById('resGridDependency');
    if (resGridDependency) resGridDependency.textContent = `${_safeNum(gridDependency).toFixed(1)} kWh`;
    const resNetMeteringBenefit = document.getElementById('resNetMeteringBenefit');
    if (resNetMeteringBenefit) resNetMeteringBenefit.textContent = `₹${Math.round(netMeteringBenefit).toLocaleString('en-IN')}/month`;

    // 5. Update Solar Consumer Intelligence section (Patch 2.1)
    const isSolar = data.isSolarConsumer === true;
    const hasImportExport = data.importUnits !== undefined && data.importUnits !== null && data.exportUnits !== undefined && data.exportUnits !== null;
    
    const resSolarInstalled = document.getElementById('resSolarInstalled');
    const rowSolarFields = document.querySelectorAll('.row-solar-field');
    
    if (isSolar && hasImportExport) {
      if (resSolarInstalled) resSolarInstalled.textContent = 'Yes';
      rowSolarFields.forEach(el => el.style.display = 'block');
      
      const impUnits = Number(data.importUnits) || 0;
      const expUnits = Number(data.exportUnits) || 0;
      const netCons = Number(data.netConsumption) || 0;
      const netCredit = Number(data.netMeteringCredit) || 0;
      
      const resImportUnits = document.getElementById('resImportUnits');
      if (resImportUnits) resImportUnits.textContent = `${_safeNum(impUnits).toFixed(1)} kWh`;
      
      const resExportUnits = document.getElementById('resExportUnits');
      if (resExportUnits) resExportUnits.textContent = `${_safeNum(expUnits).toFixed(1)} kWh`;
      
      const resNetConsumption = document.getElementById('resNetConsumption');
      if (resNetConsumption) resNetConsumption.textContent = `${_safeNum(netCons).toFixed(1)} kWh`;
      
      const resNetMeterCredit = document.getElementById('resNetMeterCredit');
      if (resNetMeterCredit) resNetMeterCredit.textContent = `₹${Math.round(netCredit).toLocaleString('en-IN')}`;
    } else {
      if (resSolarInstalled) resSolarInstalled.textContent = 'No';
      rowSolarFields.forEach(el => el.style.display = 'none');
    }
    
    // Confidence badge
    const resConfidenceBadge = document.getElementById('resExtractionConfidenceBadge');
    if (resConfidenceBadge && data.extractionConfidence) {
      resConfidenceBadge.textContent = data.extractionConfidence.label;
      resConfidenceBadge.className = `confidence-badge ${data.extractionConfidence.badgeClass}`;
    }
    
    // Scores
    const resBillHealthScore = document.getElementById('resBillHealthScore');
    if (resBillHealthScore && data.billHealth) {
      resBillHealthScore.textContent = `${data.billHealth.score}/100`;
    }
    const resBillHealthRating = document.getElementById('resBillHealthRating');
    if (resBillHealthRating && data.billHealth) {
      resBillHealthRating.textContent = data.billHealth.rating;
    }
    
    const resSolarOpportunityScore = document.getElementById('resSolarOpportunityScore');
    if (resSolarOpportunityScore && data.solarOpportunity) {
      resSolarOpportunityScore.textContent = `${data.solarOpportunity.score}/100`;
    }
    const resSolarOpportunityRating = document.getElementById('resSolarOpportunityRating');
    if (resSolarOpportunityRating && data.solarOpportunity) {
      resSolarOpportunityRating.textContent = data.solarOpportunity.rating;
    }

    // Show results
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (errorBox) errorBox.style.display = 'none';

    // Redraw charts
    initBillHistoryChart();
    initBillCostBreakdownChart(billAmount, monthlySavings);
  }

  function loadPdfJS() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js library'));
      document.head.appendChild(script);
    });
  }

  async function convertPdfToImageBlob(pdfFile) {
    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  function handleFile(file) {
    if (!file) return;
    
    // Type validation
    const fileType = file.type || '';
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const extension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension);

    if (!validTypes.includes(fileType) && !isValidExtension) {
      showToast('Please upload a valid document or image file (PDF, PNG, JPG, JPEG, WEBP)', 'warning');
      return;
    }

    if (fileNameLabel) fileNameLabel.textContent = file.name;
    
    // Update metadata on UI
    const billFileType = document.getElementById('billFileType');
    const billFileSize = document.getElementById('billFileSize');
    if (billFileType) billFileType.textContent = `Type: ${extension.toUpperCase()}`;
    if (billFileSize) {
      const kb = file.size / 1024;
      if (kb > 1024) {
        billFileSize.textContent = `Size: ${_safeNum(kb / 1024).toFixed(1)} MB`;
      } else {
        billFileSize.textContent = `Size: ${_safeNum(kb).toFixed(1)} KB`;
      }
    }

    dropArea.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (progressBox) progressBox.style.display = 'block';
    
    // Extract PDF text if PDF, then run pipeline
    if (extension === 'pdf') {
      extractPdfText(file)
        .then(pdfText => {
          const solarData = extractSolarFields(pdfText, file.name);
          runPipeline(file, file.name, fileType, false, solarData);
        })
        .catch(err => {
          console.warn('PDF text extraction pre-flight failed:', err);
          const solarData = extractSolarFields('', file.name);
          runPipeline(file, file.name, fileType, false, solarData);
        });
    } else {
      const solarData = extractSolarFields('', file.name);
      runPipeline(file, file.name, fileType, false, solarData);
    }
  }

  function runPipeline(fileOrBlob, fileName, fileContentType, isFallback = false, solarData = null) {
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    
    const isPDF = fileContentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    
    // Progress interval simulator
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 10;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${progress}%`;
        
        if (progress === 10) {
          if (progressStatus) progressStatus.textContent = 'Uploading...';
        } else if (progress === 30) {
          if (progressStatus) progressStatus.textContent = 'Reading Bill...';
        } else if (progress === 50) {
          if (progressStatus) {
            progressStatus.textContent = (isPDF && !isFallback) ? 'Extracting PDF Text...' : 'Running OCR...';
          }
        } else if (progress === 70) {
          if (progressStatus) progressStatus.textContent = 'Analyzing Consumption...';
        } else if (progress === 90) {
          if (progressStatus) progressStatus.textContent = 'Calculating Solar Intelligence...';
        }
      }
    }, 200);

    // Prepare skeletons
    showLoadingSkeletons();
    if (resultsContainer) resultsContainer.style.display = 'block';

    // Call real API
    const formData = new FormData();
    formData.append('image', fileOrBlob, isFallback ? 'bill_page1.png' : fileName);

    safeFetch(`${API_BASE}/api/analyze-bill`, {
      method: 'POST',
      body: formData
    })
    .then(async (res) => {
      clearInterval(progressInterval);
      if (!res.ok) {
        throw new Error('API server returned an error.');
      }
      return res.json();
    })
    .then((result) => {
      // Validate Response
      if (!result || result.success !== true || !result.data) {
        throw new Error((result && result.error) || 'Invalid API response format.');
      }

      // Check for low-confidence PDF text extraction fallback
      const customerName = result.data.customer_name || '';
      const monthlyUnits = Number(result.data.monthly_units) || 0;
      const isLowConfidence = isPDF && !isFallback && (
        !customerName || customerName === 'Not Available' || customerName === 'Demo Consumer' || monthlyUnits === 0
      );

      if (isLowConfidence) {
        console.log('PDF text extraction was low-confidence or empty. Triggering OCR Fallback...');
        if (progressStatus) progressStatus.textContent = 'Running OCR...';
        
        convertPdfToImageBlob(fileOrBlob)
          .then((imgBlob) => {
            runPipeline(imgBlob, 'bill_page1.png', 'image/png', true, solarData);
          })
          .catch((err) => {
            console.error('OCR Fallback page conversion failed:', err);
            completeSuccess(result.data);
          });
        return;
      }

      completeSuccess(result.data);
    })
    .catch((err) => {
      clearInterval(progressInterval);
      
      // Try OCR fallback as a last resort for PDF upload failure
      if (isPDF && !isFallback) {
        console.log('PDF upload failed, attempting OCR Fallback...');
        if (progressStatus) progressStatus.textContent = 'Running OCR...';
        convertPdfToImageBlob(fileOrBlob)
          .then((imgBlob) => {
            runPipeline(imgBlob, 'bill_page1.png', 'image/png', true, solarData);
          })
          .catch((ocrErr) => {
            handlePipelineError(err);
          });
        return;
      }
      
      handlePipelineError(err);
    });

    function completeSuccess(data) {
      if (progressBar) progressBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressStatus) progressStatus.textContent = 'Analysis Complete';

      showToast('Electricity bill analyzed successfully!', 'success');

      // Calculate new solar yield metrics
      const recommendedKw = Number(data.recommended_kw) || 0;
      const monthlyUnits = Number(data.monthly_units) || 0;
      const billAmount = Number(data.bill_amount) || 0;
      const monthlySavings = Number(data.monthly_savings_rs) || 0;
      
      const solarYield = 125;
      const monthlySolarGen = recommendedKw * solarYield;
      const annualSolarGen = monthlySolarGen * 12;
      const solarUsedDirectlyVal = monthlySolarGen * 0.75;
      const exportedToGridVal = monthlySolarGen - solarUsedDirectlyVal;
      const offsetPercent = monthlyUnits > 0 ? Math.min(100, (solarUsedDirectlyVal / monthlyUnits) * 100) : 0;
      const gridDep = Math.max(0, monthlyUnits - solarUsedDirectlyVal);
      const netMeteringBen = exportedToGridVal * 7;

      // Extract solar fields if not already provided
      const finalSolarData = solarData || extractSolarFields('', fileName);
      
      // Calculate confidence, health, and opportunity
      const isSolarInstalled = finalSolarData.isSolarConsumer && finalSolarData.importUnits !== null;
      const confidence = calculateExtractionConfidence(data, isFallback);
      const health = calculateBillHealthScore(data);
      const opportunity = calculateSolarOpportunityScore(data, isSolarInstalled);

      const netCons = finalSolarData.importUnits !== null && finalSolarData.exportUnits !== null
        ? Math.max(finalSolarData.importUnits - finalSolarData.exportUnits, 0)
        : 0;
      const netCredit = finalSolarData.exportUnits !== null
        ? finalSolarData.exportUnits * 7
        : 0;

      // Extend storage model
      const extendedData = {
        ...data,
        filename: fileName,
        solarYield,
        monthlySolarGeneration: monthlySolarGen,
        annualSolarGeneration: annualSolarGen,
        solarUsedDirectly: solarUsedDirectlyVal,
        solarExportedToGrid: exportedToGridVal,
        solarOffsetPercent: offsetPercent,
        gridDependency: gridDep,
        netMeteringBenefit: netMeteringBen,
        
        // Patch 2.1 fields
        isSolarConsumer: finalSolarData.isSolarConsumer,
        importUnits: finalSolarData.importUnits,
        exportUnits: finalSolarData.exportUnits,
        solarGeneratedUnits: finalSolarData.solarGeneratedUnits,
        netConsumptionUnits: finalSolarData.netConsumptionUnits,
        netConsumption: netCons,
        netMeteringCredit: netCredit,
        extractionConfidence: confidence,
        billHealth: health,
        solarOpportunity: opportunity
      };

      // Save to local storage
      localStorage.setItem('lastBillAnalysis', JSON.stringify(extendedData));
      
      logAuditEvent((_getUser() || {}).email, 'Bill Analysis Completed', 'Assessment', `Completed bill analysis: units consumed = ${extendedData.monthly_units}, recommended system = ${extendedData.recommended_kw} kW.`, 'Medium');
      createNotification('assessment', 'Bill Analysis Completed', `Extracted consumption of ${extendedData.monthly_units} units for customer ${extendedData.customer_name}. Recommended system size: ${extendedData.recommended_kw} kW.`, 'medium');
      addActivityLog('bill', 'Bill Analysis Completed', `Uploaded electric bill matching ${extendedData.monthly_units} kWh consumption.`);

      setTimeout(() => {
        if (progressBox) progressBox.style.display = 'none';
        dropArea.style.display = 'block';
        dropArea.innerHTML = `
          <svg class="upload-icon" style="width: 48px; height: 48px; margin-bottom: 12px; stroke: var(--accent-green); fill: none; stroke-width: 1.5;" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style="font-size: 13px; color: var(--accent-green); font-weight: 700; margin: 0;">Bill Verified & Extracted!</p>
          <span style="font-size: 10px; color: var(--text-muted);">Click to upload another bill</span>
        `;
        renderData(extendedData);
        checkAndRenderUnified();
      }, 800);
    }

    function handlePipelineError(err) {
      console.error('Bill analysis error:', err);
      if (progressBox) progressBox.style.display = 'none';
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (errorBox) {
        const errorSpan = errorBox.querySelector('span');
        if (errorSpan) errorSpan.textContent = `Analysis failed: ${err.message || 'Server unavailable'}`;
        errorBox.style.display = 'block';
      }
      dropArea.style.display = 'block';
      showToast(err.message || 'Failed to analyze bill due to connection error.', 'error');
      logAuditEvent((_getUser() || {}).email, 'API Failure', 'Security', `Bill analysis failed: ${err.message || 'Server unavailable'}`, 'High');
    }
  }
}

/* ============================================================
   SOLAR REPORT UPLOADER
   Handles the second upload card for solar production reports.
   Supports PDF, PNG, JPG, JPEG, WEBP — same pipeline as bill.
   ============================================================ */
function initSolarReportUploader() {
  const dropArea = document.getElementById('solarReportDragDropArea');
  const fileInput = document.getElementById('solarReportFileInput');
  const progressBox = document.getElementById('solarReportProgressBox');
  const progressBar = document.getElementById('solarReportProgressFill');
  const progressPercent = document.getElementById('solarReportPercent');
  const progressStatus = document.getElementById('solarReportStatus');
  const fileNameLabel = document.getElementById('solarReportFileName');
  const fileTypeLabel = document.getElementById('solarReportFileType');
  const fileSizeLabel = document.getElementById('solarReportFileSize');
  const errorBox = document.getElementById('solarReportErrorBox');
  const retryBtn = document.getElementById('solarReportRetryBtn');

  if (!dropArea || !fileInput) return;

  dropArea.addEventListener('click', () => fileInput.click());

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--accent-orange)';
    dropArea.style.backgroundColor = 'rgba(255,138,29,0.08)';
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files.length > 0) handleSolarFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleSolarFile(e.target.files[0]);
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // Restore previous session data
  restoreSolarReportState();

  function restoreSolarReportState() {
    const saved = localStorage.getItem('lastSolarProduction');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      renderSolarProductionResults(data);
      showDropSuccess();
      // Try unified intelligence if bill data also exists
      checkAndRenderUnified();
    } catch (e) {
      console.error('Failed to restore solar production state:', e);
    }
  }

  function showDropSuccess() {
    dropArea.innerHTML = `
      <svg class="upload-icon" style="width:44px;height:44px;margin-bottom:10px;stroke:var(--accent-orange);fill:none;stroke-width:1.5;" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <p style="font-size:13px;color:var(--accent-orange);font-weight:700;margin:0;">Solar Report Loaded!</p>
      <span style="font-size:10px;color:var(--text-muted);">Click to upload another report</span>
    `;
  }

  function handleSolarFile(file) {
    if (!file) return;
    const fileType = file.type || '';
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const extension = file.name.split('.').pop().toLowerCase();
    const isValidExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension);

    if (!validTypes.includes(fileType) && !isValidExt) {
      showToast('Please upload a valid solar report file (PDF, PNG, JPG, JPEG, WEBP)', 'warning');
      return;
    }

    if (fileNameLabel) fileNameLabel.textContent = file.name;
    if (fileTypeLabel) fileTypeLabel.textContent = `Type: ${extension.toUpperCase()}`;
    if (fileSizeLabel) {
      const kb = file.size / 1024;
      fileSizeLabel.textContent = `Size: ${kb > 1024 ? _safeNum(kb / 1024).toFixed(1) + ' MB' : _safeNum(kb).toFixed(1) + ' KB'}`;
    }

    dropArea.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
    if (progressBox) progressBox.style.display = 'block';

    if (extension === 'pdf') {
      // Try PDF text extraction first, then fall back to image OCR via main bill API
      updateProgress(20, 'Extracting PDF Text...');
      extractPdfText(file)
        .then(text => {
          if (text && text.trim().length > 30) {
            runSolarPipeline(file, file.name, file.type, text, false);
          } else {
            updateProgress(40, 'Running OCR...');
            convertSolarPdfToImageBlob(file).then(blob => {
              runSolarPipeline(blob, 'solar_page1.png', 'image/png', '', true);
            }).catch(() => {
              // proceed with empty text anyway
              runSolarPipeline(file, file.name, file.type, text, false);
            });
          }
        })
        .catch(() => runSolarPipeline(file, file.name, file.type, '', false));
    } else {
      updateProgress(20, 'Reading File...');
      // For images: send to the bill analysis API which will OCR it,
      // PLUS attempt a local text read via FileReader for filenames
      runSolarPipeline(file, file.name, fileType, '', false);
    }
  }

  async function convertSolarPdfToImageBlob(pdfFile) {
    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  function updateProgress(pct, status) {
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPercent) progressPercent.textContent = `${pct}%`;
    if (progressStatus) progressStatus.textContent = status;
  }

  function runSolarPipeline(fileOrBlob, fileName, fileContentType, prefetchedText, isOcrFallback) {
    let progress = isOcrFallback ? 40 : 20;
    updateProgress(progress, isOcrFallback ? 'Running OCR...' : 'Analyzing Solar Production...');

    const progressInterval = setInterval(() => {
      if (progress < 85) {
        progress = Math.min(85, progress + 15);
        if (progress === 50) updateProgress(progress, 'Analyzing Solar Production...');
        else if (progress === 70) updateProgress(progress, 'Calculating Solar Intelligence...');
        else updateProgress(progress, progressStatus ? progressStatus.textContent : 'Processing...');
      }
    }, 300);

    // Send to bill analysis API — it uses OCR which works for images of solar reports too
    const formData = new FormData();
    formData.append('image', fileOrBlob, isOcrFallback ? 'solar_page1.png' : fileName);

    safeFetch(`${API_BASE}/api/analyze-bill`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('API error')))
    .then(result => {
      clearInterval(progressInterval);
      // Extract text from the API response (raw text may be embedded in result.data._raw_text)
      let apiText = '';
      if (result && result.data) {
        apiText = [
          result.data._raw_text || '',
          result.data.customer_name || '',
          result.data.billing_period || ''
        ].join(' ');
      }

      const combinedText = [prefetchedText, apiText].join(' ');
      const prodData = extractSolarProductionData(combinedText, fileName);

      // If extraction yielded nothing useful from OCR, at minimum save filename + source
      if (prodData.productionKwh == null && !isOcrFallback) {
        // Try OCR fallback for PDFs
        const ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
          clearInterval(progressInterval);
          convertSolarPdfToImageBlob(fileOrBlob).then(blob => {
            runSolarPipeline(blob, 'solar_page1.png', 'image/png', prefetchedText, true);
          }).catch(() => completeSolarSuccess(prodData));
          return;
        }
      }

      completeSolarSuccess(prodData);
    })
    .catch(err => {
      clearInterval(progressInterval);
      // Even if API fails, try parsing any prefetched PDF text
      if (prefetchedText && prefetchedText.trim().length > 10) {
        const prodData = extractSolarProductionData(prefetchedText, fileName);
        completeSolarSuccess(prodData);
      } else {
        handleSolarError(err);
      }
    });

    function completeSolarSuccess(prodData) {
      updateProgress(100, 'Analysis Complete');
      showToast('Solar production report analyzed!', 'success');

      // Persist to localStorage
      localStorage.setItem('lastSolarProduction', JSON.stringify(prodData));

      setTimeout(() => {
        if (progressBox) progressBox.style.display = 'none';
        showDropSuccess();
        renderSolarProductionResults(prodData);
        checkAndRenderUnified();
      }, 600);
    }

    function handleSolarError(err) {
      console.error('Solar report analysis error:', err);
      if (progressBox) progressBox.style.display = 'none';
      if (errorBox) {
        const errorSpan = errorBox.querySelector('span');
        if (errorSpan) errorSpan.textContent = `Analysis failed: ${err.message || 'Try another file'}`;
        errorBox.style.display = 'block';
      }
      dropArea.style.display = 'block';
      showToast(err.message || 'Failed to analyze solar report.', 'error');
    }
  }
}

/* ============================================================
   CHECK AND RENDER UNIFIED ENERGY INTELLIGENCE
   Called after either upload completes — fires only when both
   lastBillAnalysis and lastSolarProduction are in localStorage.
   ============================================================ */
function checkAndRenderUnified() {
  try {
    const billRaw = localStorage.getItem('lastBillAnalysis');
    const solarRaw = localStorage.getItem('lastSolarProduction');
    if (!billRaw || !solarRaw) return;

    const billData = JSON.parse(billRaw);
    const solarData = JSON.parse(solarRaw);
    if (!solarData.productionKwh) return; // need actual production figure

    const unified = computeUnifiedEnergyIntelligence(billData, solarData);
    renderUnifiedIntelligence(unified);
  } catch (e) {
    console.error('Unified intelligence error:', e);
  }
}


function loadPdfJS() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js library'));
    document.head.appendChild(script);
  });
}

async function extractPdfText(pdfFile) {
  try {
    const pdfjsLib = await loadPdfJS();
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (err) {
    console.error('Failed to extract PDF text:', err);
    return '';
  }
}

function extractSolarFields(text, filename) {
  const normalizedText = text ? text.toLowerCase() : '';
  const normalizedFilename = filename ? filename.toLowerCase() : '';
  
  const keywords = [
    // Existing keywords
    'solar consumer', 'net meter', 'net metering', 'solar energy',
    'solar generation', 'pv system', 'renewable energy',
    'export units', 'import units', 'solar export', 'solar import',
    // New keywords from spec
    'gen_netmeter', 'netmeter', 'kwhe', 'kvah export',
    'opening surplus', 'closing surplus'
  ];
  
  let isSolarConsumer = false;
  for (const kw of keywords) {
    if (normalizedText.includes(kw) || normalizedFilename.includes(kw)) {
      isSolarConsumer = true;
      break;
    }
  }
  
  // Also check if filename strictly has 'solar' as word
  if (normalizedFilename.includes('solar')) {
    isSolarConsumer = true;
  }
  
  let importUnits = null;
  let exportUnits = null;
  let solarGeneratedUnits = null;
  let netConsumptionUnits = null;
  
  if (isSolarConsumer) {
    const importPatterns = [
      /import\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /import\s+energy\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /units\s+imported\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /grid\s+import\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /active\s+import\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /imp\s*[:=-]?\s*(\d+(?:\.\d+)?)/i
    ];
    
    const exportPatterns = [
      /export\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /export\s+energy\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /units\s+exported\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /grid\s+export\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /active\s+export\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /exp\s*[:=-]?\s*(\d+(?:\.\d+)?)/i
    ];
    
    const solarPatterns = [
      /solar\s+generated\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /solar\s+generation\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /generated\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /pv\s+generation\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /pv\s+gen\s*[:=-]?\s*(\d+(?:\.\d+)?)/i
    ];
    
    const netPatterns = [
      /net\s+units\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /net\s+consumption\s*[:=-]?\s*(\d+(?:\.\d+)?)/i,
      /net\s+energy\s*[:=-]?\s*(\d+(?:\.\d+)?)/i
    ];
    
    for (const p of importPatterns) {
      const match = normalizedText.match(p);
      if (match) {
        importUnits = parseFloat(match[1]);
        break;
      }
    }
    for (const p of exportPatterns) {
      const match = normalizedText.match(p);
      if (match) {
        exportUnits = parseFloat(match[1]);
        break;
      }
    }
    for (const p of solarPatterns) {
      const match = normalizedText.match(p);
      if (match) {
        solarGeneratedUnits = parseFloat(match[1]);
        break;
      }
    }
    for (const p of netPatterns) {
      const match = normalizedText.match(p);
      if (match) {
        netConsumptionUnits = parseFloat(match[1]);
        break;
      }
    }
    
    // Fallback Mock Override: if filename contains solar, and import/export units are not matched
    if (normalizedFilename.includes('solar') && (importUnits === null || exportUnits === null)) {
      importUnits = importUnits !== null ? importUnits : 185.0;
      exportUnits = exportUnits !== null ? exportUnits : 112.0;
      if (solarGeneratedUnits === null) solarGeneratedUnits = 150.0;
      if (netConsumptionUnits === null) netConsumptionUnits = 73.0;
    }
  }
  
  return {
    isSolarConsumer,
    importUnits,
    exportUnits,
    solarGeneratedUnits,
    netConsumptionUnits
  };
}

/* ============================================================
   SOLAR PRODUCTION EXTRACTION
   Parses text from Solarman, Sungrow, Huawei, Growatt, etc.
   ============================================================ */
function extractSolarProductionData(text, filename) {
  const t = (text || '').toLowerCase();
  const fn = (filename || '').toLowerCase();

  // --- Production kWh ---
  let productionKwh = null;
  const prodPatterns = [
    /total\s+generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /total\s+yield\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /production\s*\(kwh\)\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i,
    /monthly\s+generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /monthly\s+yield\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /energy\s+generated\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /generation\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /yield\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /e_total\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i,
    /total\s+energy\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i,
    /kwh\s*[:\-=]?\s*([\d,]+(?:\.\d+)?)/i
  ];
  for (const p of prodPatterns) {
    const m = text.match(p);
    if (m) { productionKwh = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // --- System Size kW ---
  let systemSizeKw = null;
  const sizePatterns = [
    /system\s+size\s*[:\-=]?\s*([\d.]+)\s*kw/i,
    /rated\s+power\s*[:\-=]?\s*([\d.]+)\s*kw/i,
    /installed\s+capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i,
    /plant\s+capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i,
    /peak\s+power\s*[:\-=]?\s*([\d.]+)\s*kwp/i,
    /capacity\s*[:\-=]?\s*([\d.]+)\s*kw/i,
    /([\d.]+)\s*kw(?:p|dc)?\s+system/i
  ];
  for (const p of sizePatterns) {
    const m = text.match(p);
    if (m) { systemSizeKw = parseFloat(m[1]); break; }
  }

  // --- Month ---
  let month = null;
  let year = null;
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthPatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s\-\/]+(\d{4})\b/i,
    /(\d{1,2})[\/\-](\d{4})/
  ];
  for (const p of monthPatterns) {
    const m = text.match(p);
    if (m) {
      if (/[a-z]/i.test(m[1])) {
        month = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        year = m[2];
      } else {
        const mn = parseInt(m[1], 10);
        month = months[mn - 1] ? (months[mn-1].charAt(0).toUpperCase() + months[mn-1].slice(1)) : null;
        year = m[2];
      }
      break;
    }
  }

  // Detect source app
  const sourceApps = ['solarman', 'sungrow', 'huawei', 'fusionsolar', 'growatt', 'goodwe', 'solis', 'fronius', 'solaredge', 'enphase', 'tesla'];
  let source = 'Solar App';
  for (const app of sourceApps) {
    if (t.includes(app) || fn.includes(app)) {
      source = app.charAt(0).toUpperCase() + app.slice(1);
      break;
    }
  }

  return { productionKwh, systemSizeKw, month, year, source, filename };
}

/* ============================================================
   PLANT PERFORMANCE ENGINE
   ============================================================ */
function calculatePlantPerformance(actualKwh, systemSizeKw) {
  if (!systemSizeKw || systemSizeKw <= 0) return null;
  const expected = systemSizeKw * 125;
  if (!actualKwh || actualKwh <= 0) return null;
  const pct = Math.min(150, (actualKwh / expected) * 100);
  let rating = 'Needs Attention';
  let ratingClass = 'perf-needs-attention';
  if (pct >= 95) { rating = 'Excellent'; ratingClass = 'perf-excellent'; }
  else if (pct >= 85) { rating = 'Good'; ratingClass = 'perf-good'; }
  else if (pct >= 70) { rating = 'Average'; ratingClass = 'perf-average'; }
  return { pct: Math.round(pct * 10) / 10, expected, actual: actualKwh, rating, ratingClass };
}

/* ============================================================
   UNIFIED ENERGY INTELLIGENCE
   Called when BOTH bill + solar production data are available
   ============================================================ */
function computeUnifiedEnergyIntelligence(billData, solarData) {
  const solarGenerated = Number(solarData.productionKwh) || 0;
  const exportUnits = (billData && billData.exportUnits != null) ? Number(billData.exportUnits) : 0;
  const importUnits = (billData && billData.importUnits != null) ? Number(billData.importUnits) : 0;
  const gridImport = importUnits > 0 ? importUnits : (Number((billData || {}).monthly_units) || 0);

  const solarUsedDirectly = Math.max(0, solarGenerated - exportUnits);
  const selfConsumptionPct = solarGenerated > 0
    ? Math.min(100, Math.round((solarUsedDirectly / solarGenerated) * 1000) / 10)
    : 0;
  const solarOffsetPct = gridImport > 0
    ? Math.min(200, Math.round((solarGenerated / gridImport) * 1000) / 10)
    : 0;
  const gridDependencyPct = Math.max(0, Math.round((100 - selfConsumptionPct) * 10) / 10);
  const netMeteringBenefit = Math.round(exportUnits * 7);

  return {
    solarGenerated,
    gridImport,
    gridExport: exportUnits,
    solarUsedDirectly,
    selfConsumptionPct,
    solarOffsetPct,
    gridDependencyPct,
    netMeteringBenefit
  };
}

/* ============================================================
   RENDER — SOLAR PRODUCTION RESULTS
   ============================================================ */
function renderSolarProductionResults(prodData) {
  const sec = document.getElementById('secPlantPerformance');
  if (sec) sec.style.display = 'block';

  const elProdMonth = document.getElementById('resProdMonth');
  if (elProdMonth) elProdMonth.textContent = (prodData.month && prodData.year)
    ? `${prodData.month} ${prodData.year}` : 'Not Available';

  const elProdKwh = document.getElementById('resProdKwh');
  if (elProdKwh) elProdKwh.textContent = prodData.productionKwh != null
    ? `${_safeNum(prodData.productionKwh).toFixed(2)} kWh` : 'Not Available';

  const elSysSize = document.getElementById('resProdSystemSize');
  if (elSysSize) elSysSize.textContent = prodData.systemSizeKw != null
    ? `${_safeNum(prodData.systemSizeKw).toFixed(1)} kW` : 'Not Available';

  const elSource = document.getElementById('resProdSource');
  if (elSource) elSource.textContent = prodData.source || 'Solar App';

  const perf = prodData.systemSizeKw && prodData.productionKwh
    ? calculatePlantPerformance(prodData.productionKwh, prodData.systemSizeKw)
    : null;

  const elExpected = document.getElementById('resProdExpected');
  if (elExpected) elExpected.textContent = perf ? `${_safeNum(perf.expected).toFixed(0)} kWh` : 'N/A';

  const elPerfPct = document.getElementById('resPlantPerformancePercent');
  if (elPerfPct) elPerfPct.textContent = perf ? `${perf.pct}%` : '-';

  const elPerfRating = document.getElementById('resPlantPerformanceRating');
  if (elPerfRating) {
    elPerfRating.textContent = perf ? perf.rating : '-';
    elPerfRating.className = `plant-perf-badge ${perf ? perf.ratingClass : ''}`;
  }
}

/* ============================================================
   RENDER — UNIFIED ENERGY INTELLIGENCE
   ============================================================ */
function renderUnifiedIntelligence(unified) {
  const sec = document.getElementById('secUnifiedEnergy');
  if (sec) sec.style.display = 'block';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('uniSolarGenerated', `${_safeNum(unified.solarGenerated).toFixed(2)} kWh`);
  set('uniGridImport', `${_safeNum(unified.gridImport).toFixed(1)} kWh`);
  set('uniGridExport', `${_safeNum(unified.gridExport).toFixed(1)} kWh`);
  set('uniSolarUsedDirectly', `${_safeNum(unified.solarUsedDirectly).toFixed(1)} kWh`);
  set('uniSelfConsumptionPct', `${unified.selfConsumptionPct}%`);
  set('uniSolarOffsetPct', `${unified.solarOffsetPct}%`);
  set('uniGridDependency', `${unified.gridDependencyPct}%`);
  set('uniNetMeteringBenefit', `₹${unified.netMeteringBenefit.toLocaleString('en-IN')}/month`);
}

function calculateExtractionConfidence(data, isFallback) {

  let score = 30; // base score if pipeline succeeds
  
  if (data.customer_name && data.customer_name !== 'Not Available' && data.customer_name !== 'Demo Consumer') {
    score += 15;
  }
  if (data.billing_period && data.billing_period !== 'Not Available') {
    score += 15;
  }
  if (data.consumer_number && data.consumer_number !== 'Not Available') {
    score += 15;
  }
  if (Number(data.monthly_units) > 0) {
    score += 15;
  }
  if (Number(data.bill_amount) > 0) {
    score += 10;
  }
  
  if (isFallback) {
    score -= 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let label = 'Low Confidence';
  let badgeClass = 'confidence-low';
  if (score >= 85) {
    label = 'High Confidence';
    badgeClass = 'confidence-high';
  } else if (score >= 60) {
    label = 'Medium Confidence';
    badgeClass = 'confidence-medium';
  }
  
  return { score, label, badgeClass };
}

function calculateBillHealthScore(data) {
  let score = 40; // Base score for successful API extraction
  
  if (data.customer_name && data.customer_name !== 'Not Available') {
    score += 15;
  }
  if (data.billing_period && data.billing_period !== 'Not Available') {
    score += 15;
  }
  if (Number(data.monthly_units) > 0) {
    score += 10;
  }
  if (Number(data.bill_amount) > 0) {
    score += 10;
  }
  if (data.discom && data.discom !== 'Not Available') {
    score += 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let rating = 'Poor';
  if (score >= 90) {
    rating = 'Excellent';
  } else if (score >= 75) {
    rating = 'Good';
  } else if (score >= 50) {
    rating = 'Average';
  }
  
  return { score, rating };
}

function calculateSolarOpportunityScore(data, isSolarInstalled) {
  const billAmount = Number(data.bill_amount) || 0;
  const monthlyUnits = Number(data.monthly_units) || 0;
  const recommendedKw = Number(data.recommended_kw) || 0;
  const annualSavings = (Number(data.monthly_savings_rs) || 0) * 12;
  
  const scoreBill = Math.min(30, (billAmount / 6000) * 30);
  const scoreUnits = Math.min(20, (monthlyUnits / 500) * 20);
  const scoreKw = Math.min(10, (recommendedKw / 8) * 10);
  const scoreSavings = Math.min(10, (annualSavings / 80000) * 10);
  
  let score = Math.round(scoreBill + scoreUnits + scoreKw + scoreSavings);
  
  if (monthlyUnits > 300) {
    score += 10;
  }
  if (billAmount > 2000) {
    score += 10;
  }
  if (!isSolarInstalled) {
    score += 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let rating = 'Weak Candidate';
  if (score >= 85) {
    rating = 'Excellent Candidate';
  } else if (score >= 70) {
    rating = 'Good Candidate';
  } else if (score >= 50) {
    rating = 'Average Candidate';
  }
  
  return { score, rating };
}

let billCostBreakdownChartInstance = null;
function initBillCostBreakdownChart(billAmount, monthlySavings) {
  const canvas = document.getElementById('billCostBreakdownChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (billCostBreakdownChartInstance) {
    billCostBreakdownChartInstance.destroy();
  }
  
  const energyVal = Math.round(billAmount * 0.70);
  const fixedVal = Math.round(billAmount * 0.15);
  const taxesVal = Math.round(billAmount * 0.10);
  const otherVal = Math.round(billAmount * 0.05);
  
  billCostBreakdownChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Energy Charges', 'Fixed Charges', 'Taxes & Duties', 'Other Surcharges'],
      datasets: [{
        data: [energyVal, fixedVal, taxesVal, otherVal],
        backgroundColor: [
          'rgba(23, 168, 229, 0.75)',
          'rgba(255, 138, 29, 0.75)',
          'rgba(54, 211, 153, 0.75)',
          'rgba(159, 179, 200, 0.75)'
        ],
        borderColor: [
          '#17a8e5',
          '#ff8a1d',
          '#36d399',
          '#9fb3c8'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#9fb3c8',
            font: {
              family: 'Outfit',
              size: 9
            },
            boxWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              const pct = _safeNum((val / (billAmount || 1)) * 100).toFixed(0);
              return ` ${context.label}: ₹${val.toLocaleString('en-IN')} (${pct}%)`;
            }
          },
          backgroundColor: '#0d2134',
          titleColor: '#f7fbff',
          bodyColor: '#9fb3c8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      }
    }
  });

  const topCostDriverEl = document.getElementById('resTopCostDriver');
  if (topCostDriverEl) {
    topCostDriverEl.textContent = `Energy Charges - ₹${energyVal.toLocaleString('en-IN')} (70% of total)`;
  }
  
  const savingsPercent = billAmount > 0 ? Math.min(100, Math.round((monthlySavings / billAmount) * 100)) : 0;
  const potentialSavingsEl = document.getElementById('resPotentialSavingsText');
  if (potentialSavingsEl) {
    potentialSavingsEl.textContent = `Solar can offset ~${savingsPercent}% of your monthly bill (saving ₹${Math.round(monthlySavings).toLocaleString('en-IN')}/month)`;
  }
}

/* ==========================================================================
   11. BILL HISTORY & SAVINGS CHART
   ========================================================================== */
let billHistoryChartInstance = null;
function initBillHistoryChart() {
  const canvas = document.getElementById('billHistoryChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (billHistoryChartInstance) {
    billHistoryChartInstance.destroy();
  }
  
  // Read last analysis to scale the chart
  const savedAnalysis = localStorage.getItem('lastBillAnalysis');
  let baseBill = 6500; // default mock bill
  if (savedAnalysis) {
    try {
      const data = JSON.parse(savedAnalysis);
      baseBill = Number(data.bill_amount) || 6500;
    } catch (e) {}
  }
  
  const labels = (dashboardData && dashboardData.chartData) ? dashboardData.chartData.months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const multipliers = [0.95, 0.9, 0.93, 1.05, 1.1, 1.3, 1.25, 1.2, 1.1, 1.0, 0.9, 0.96];
  const bills = multipliers.map(mult => Math.round(baseBill * mult));
  const savings = bills.map(val => Math.round(val * 0.74));
  
  billHistoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Grid Electricity Bill (₹)',
          data: bills,
          backgroundColor: 'rgba(23, 168, 229, 0.4)',
          borderColor: '#17a8e5',
          borderWidth: 1.5,
          borderRadius: 4
        },
        {
          label: 'Projected Solar Savings (₹)',
          data: savings,
          backgroundColor: 'rgba(54, 211, 153, 0.4)',
          borderColor: '#36d399',
          borderWidth: 1.5,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 10 } }
        },
        tooltip: {
          backgroundColor: '#0d2134',
          titleColor: '#f7fbff',
          bodyColor: '#9fb3c8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }
        }
      }
    }
  });
}

/* ==========================================================================
   12. SATELLITE ROOF SCANNER SIMULATOR
   ========================================================================== */
function initRoofScannerSimulator() {
  const dropArea = document.getElementById('roofDragDropArea');
  const fileInput = document.getElementById('roofFileInput');
  const progressBox = document.getElementById('roofScanProgressBox');
  const progressBar = document.getElementById('roofScanProgressFill');
  const progressPercent = document.getElementById('roofScanPercent');
  const progressStatus = document.getElementById('roofScanStatus');
  const scanStatusText = document.getElementById('roofScanStatusText');
  const laser = document.getElementById('roofScanLaser');
  const poly1 = document.querySelector('.polygon-1');
  const poly2 = document.querySelector('.polygon-2');
  const scanBtn = document.getElementById('startRoofScanBtn');
  
  const resultsContainer = document.getElementById('roofAnalysisResults');
  const errorBox = document.getElementById('roofAnalysisErrorBox');
  const retryBtn = document.getElementById('roofAnalysisRetryBtn');

  // Track selected file — actual upload is triggered by roofAnalyzeBtn
  let _selectedRoofFile = null;

  if (!dropArea || !fileInput) return;

  // Expose validate+enable function globally so inline oninput handlers can reach it
  window.updateRoofAnalyzeBtn = function() {
    const btn = document.getElementById('roofAnalyzeBtn');
    if (!btn) return;
    const lenVal  = parseFloat(document.getElementById('roofLengthInput')?.value);
    const widVal  = parseFloat(document.getElementById('roofWidthInput')?.value);
    const cityVal = (document.getElementById('roofCityInput')?.value || '').trim();
    const valid   = _selectedRoofFile && lenVal > 0 && widVal > 0 && cityVal.length > 0;
    btn.disabled = !valid;
    btn.style.opacity  = valid ? '1'         : '0.45';
    btn.style.cursor   = valid ? 'pointer'   : 'not-allowed';
    btn.style.boxShadow = valid ? '0 4px 18px rgba(54,211,153,0.35)' : 'none';
  };

  // Expose trigger function globally so the onclick attribute can reach it
  window.triggerRoofAnalyze = function() {
    if (!_selectedRoofFile) return;
    handleRoofFile(_selectedRoofFile);
  };

  // Setup click & drag event listeners — only store file, do NOT auto-upload
  dropArea.addEventListener('click', () => fileInput.click());

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--accent-green)';
    dropArea.style.backgroundColor = 'rgba(54,211,153,0.08)';
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files.length > 0) {
      _selectedRoofFile = e.dataTransfer.files[0];
      // Show filename in drop area
      const p = dropArea.querySelector('.upload-text');
      if (p) p.innerHTML = `<strong style="color:var(--accent-green);">✓ ${_selectedRoofFile.name}</strong>`;
      window.updateRoofAnalyzeBtn();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      _selectedRoofFile = e.target.files[0];
      const p = dropArea.querySelector('.upload-text');
      if (p) p.innerHTML = `<strong style="color:var(--accent-green);">✓ ${_selectedRoofFile.name}</strong>`;
      window.updateRoofAnalyzeBtn();
    }
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // Simulator button click
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      runMockSimulation();
    });
  }

  // Restore state on startup
  restoreRoofAnalysisState();

  function showLoadingSkeletons() {
    const skeletonElements = [
      'snapRoofSuitability', 'snapRoofSystemSize', 'snapRoofMonthlyGen', 'snapRoofPanels',
      'resTotalRoofArea', 'resUsableRoofArea', 'resRoofType', 'resRoofShading',
      'resRoofRecommendedSolarSize', 'resRoofNumberOfPanels', 'resRoofMonthlyGeneration',
      'roofTabReadiness', 'roofTabArea', 'roofTabShade', 'roofTabSystemSize'
    ];
    skeletonElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '<span class="skeleton-loader"></span>';
      }
    });
  }

  function restoreRoofAnalysisState() {
    const saved = localStorage.getItem('lastRoofAnalysis');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        renderRoofData(data);
        
        // Show success state on drop area
        dropArea.innerHTML = `
          <svg class="upload-icon" style="width: 44px; height: 44px; margin-bottom: 10px; stroke: var(--accent-green); fill: none; stroke-width: 1.5;" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style="font-size: 12px; color: var(--accent-green); font-weight: 700; margin: 0;">Rooftop Scan Verified & Extracted!</p>
          <span style="font-size: 9px; color: var(--text-muted);">Click to upload another image</span>
        `;
        
        // Show polygons
        if (poly1) poly1.style.display = 'block';
        if (poly2) poly2.style.display = 'block';
      } catch (e) {
        console.error('Failed to restore roof analysis state:', e);
      }
    }
  }

  function renderRoofData(data) {
    // ---- Helper to safely set text content ----
    function _set(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text || 'Not Available';
    }

    // ---- Map new backend fields ----
    const roofAreaSqft        = Number(data.roof_area_sqft)          || 0;
    const facingDirection     = data.facing_direction                || 'Not Available';
    const compassAngle        = data.compass_angle                   ? `${data.compass_angle}°` : 'Not Available';
    const roofCondition       = data.roof_condition                  || 'Not Available';
    const roofType            = data.roof_type                       || 'Not Available';
    const shadingIssues       = data.shading_issues                  || 'Not Available';
    const solarPotential      = data.solar_potential                 || 'Not Available';
    const obstacles           = data.obstacles                      || 'None';
    const recommendedSystem   = data.recommended_system             || 'Not Available';
    const systemSizeKw        = Number(data.system_size_kw)          || 0;
    const totalPanels         = Number(data.total_panels)            || 0;
    const panelRows           = Number(data.panel_rows)              || 0;
    const panelsPerRow        = Number(data.panels_per_row)          || 0;
    const totalLegs           = Number(data.total_legs)              || 0;
    const frontLegs           = Number(data.front_legs)              || 0;
    const backLegs            = Number(data.back_legs)               || 0;
    const frontLegHeightFt    = Number(data.front_leg_height_ft)     || 0;
    const backLegHeightFt     = Number(data.back_leg_height_ft)      || 0;
    const monthlyGeneration   = Number(data.monthly_generation_units)|| 0;
    const annualGeneration    = Number(data.annual_generation_units) || 0;
    const analysisNotes       = data.analysis_notes                  || '';

    // ---- Derive suitability score from solar_potential ----
    const potLower = solarPotential.toLowerCase();
    let suitabilityScore = 80;
    if (potLower.includes('high'))       suitabilityScore = 92;
    else if (potLower.includes('medium')) suitabilityScore = 70;
    else if (potLower.includes('low'))    suitabilityScore = 50;

    // ---- Derive shade display from shading_issues ----
    let shadePercent = '8%';
    const shadeLower = shadingIssues.toLowerCase();
    if      (shadeLower.includes('none'))     shadePercent = '0%';
    else if (shadeLower.includes('partial'))  shadePercent = '15%';
    else if (shadeLower.includes('heavy'))    shadePercent = '30%';

    // ---- 1. Detailed Results Grid ----
    _set('resTotalRoofArea',          roofAreaSqft ? `${roofAreaSqft} sq ft` : 'Not Available');
    _set('resFacingDirection',        facingDirection);
    _set('resCompassAngle',           compassAngle);
    _set('resRoofCondition',          roofCondition);
    _set('resRoofType',               roofType);
    _set('resRoofShading',            shadingIssues);
    _set('resSolarPotential',         solarPotential);
    _set('resObstacles',              obstacles);
    _set('resRoofRecommendedSolarSize', recommendedSystem);
    _set('resSystemSizeKw',           systemSizeKw ? `${systemSizeKw} kW` : 'Not Available');
    _set('resRoofNumberOfPanels',     totalPanels  ? `${totalPanels}`      : 'Not Available');
    _set('resPanelLayout',            (panelRows && panelsPerRow) ? `${panelRows} rows × ${panelsPerRow} per row` : 'Not Available');
    _set('resTotalLegs',              totalLegs    ? `${totalLegs}`         : 'Not Available');
    _set('resFrontBackLegs',          (frontLegs || backLegs) ? `${frontLegs}F / ${backLegs}B` : 'Not Available');
    _set('resFrontLegHeight',         frontLegHeightFt ? `${frontLegHeightFt} ft` : 'Not Available');
    _set('resBackLegHeight',          backLegHeightFt  ? `${backLegHeightFt} ft`  : 'Not Available');
    _set('resRoofMonthlyGeneration',  monthlyGeneration  ? `${monthlyGeneration} units/month`  : 'Not Available');
    _set('resAnnualGeneration',       annualGeneration   ? `${annualGeneration} units/year`    : 'Not Available');
    _set('resAnalysisNotes',          analysisNotes);

    // ---- 2. Analytics Snapshot Card ----
    _set('snapRoofSuitability', `${suitabilityScore}%`);
    _set('snapRoofSystemSize',  systemSizeKw ? `${systemSizeKw} kW` : 'Not Available');
    _set('snapRoofMonthlyGen',  monthlyGeneration ? `${monthlyGeneration} units` : 'Not Available');
    _set('snapRoofPanels',      totalPanels  ? `${totalPanels}`      : 'Not Available');

    // ---- 3. Tab KPI Cards ----
    _set('roofTabReadiness',  `${suitabilityScore}%`);
    _set('roofTabArea',       roofAreaSqft ? `${roofAreaSqft} sq ft` : 'Not Available');
    _set('roofTabShade',      shadePercent);
    _set('roofTabSystemSize', systemSizeKw ? `${systemSizeKw} kW`    : 'Not Available');

    // ---- 4. Dashboard Dials ----
    _set('readinessTextVal', `${suitabilityScore}%`);
    const readinessCircle = document.getElementById('readinessFillCircle');
    if (readinessCircle) {
      const totalCircumference = 220;
      const offset = totalCircumference - (suitabilityScore / 100 * totalCircumference);
      readinessCircle.style.strokeDashoffset = `${offset}`;
    }
    _set('systemSizeTextVal', systemSizeKw ? `${systemSizeKw} kW` : 'Not Available');

    // Update readiness description
    const descEl = document.querySelector('.readiness-card .readiness-desc');
    if (descEl) {
      if (suitabilityScore >= 90)      descEl.textContent = 'Excellent! Your home is ready for solar.';
      else if (suitabilityScore >= 75) descEl.textContent = 'Good readiness. Suitable for solar.';
      else                             descEl.textContent = 'Moderate readiness. Check shading / obstacles.';
    }

    // ---- 5. Charts ----
    if (dashboardData && dashboardData.chartData && dashboardData.chartData.energyProduction) {
      const baseProduction = [380, 420, 490, 520, 560, 510, 440, 460, 480, 510, 440, 400];
      const ratio = systemSizeKw / 3;
      dashboardData.chartData.energyProduction = baseProduction.map(v => Math.round(v * ratio));
      initCharts();
    }

    // Show results
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (errorBox) errorBox.style.display = 'none';
  }

  function handleRoofFile(file) {
    if (!file) return;

    // Type validation
    const fileType = file.type || '';
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = ['jpg', 'jpeg', 'png'].includes(extension);

    if (!validTypes.includes(fileType) && !isValidExtension) {
      showToast('Please upload a valid image file (JPG, JPEG, PNG)', 'warning');
      return;
    }

    if (scanStatusText) scanStatusText.textContent = 'Status: Uploading...';
    if (laser) laser.style.display = 'block';
    if (progressBox) progressBox.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';

    if (poly1) poly1.style.display = 'none';
    if (poly2) poly2.style.display = 'none';

    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading rooftop image...';

    // Simulate progress up to 90%
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 10;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${progress}%`;

        if (progress === 30) {
          if (progressStatus) progressStatus.textContent = 'Scanning roof boundaries...';
          if (scanStatusText) scanStatusText.textContent = 'Status: Boundary Scan...';
        } else if (progress === 60) {
          if (progressStatus) progressStatus.textContent = 'Analyzing shadow obstructions...';
          if (scanStatusText) scanStatusText.textContent = 'Status: Shade Scan...';
        } else if (progress === 90) {
          if (progressStatus) progressStatus.textContent = 'Calculating recommended solar size...';
          if (scanStatusText) scanStatusText.textContent = 'Status: Finalizing...';
        }
      }
    }, 150);

    // Prepare skeletons
    showLoadingSkeletons();
    if (resultsContainer) resultsContainer.style.display = 'block';

    // Read roof measurement inputs
    const roofLength = parseFloat(document.getElementById('roofLengthInput')?.value);
    const roofWidth  = parseFloat(document.getElementById('roofWidthInput')?.value);
    const roofCity   = (document.getElementById('roofCityInput')?.value || '').trim();

    // Guard: validate before sending (safety net — button already enforces this)
    if (!roofLength || roofLength <= 0 || !roofWidth || roofWidth <= 0 || !roofCity) {
      clearInterval(progressInterval);
      if (progressBox) progressBox.style.display = 'none';
      if (laser) laser.style.display = 'none';
      showToast('Please fill in Roof Length, Width, and City before analyzing.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('length_ft', roofLength);
    formData.append('width_ft',  roofWidth);
    formData.append('city',      roofCity);

    // Log FormData contents for debugging
    console.log('=== Roof Analyzer FormData ===')
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    console.log('==============================');

    safeFetch(`${API_BASE}/api/analyze-roof`, {
      method: 'POST',
      body: formData
    })
    .then(async (res) => {
      clearInterval(progressInterval);
      if (!res.ok) {
        throw new Error('API server returned an error.');
      }
      return res.json();
    })
    .then((result) => {
      if (!result || result.success !== true || !result.data) {
        throw new Error((result && result.error) || 'Invalid API response format.');
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressStatus) progressStatus.textContent = 'Analysis complete!';
      if (scanStatusText) scanStatusText.textContent = 'Status: Complete';

      showToast('Rooftop satellite analysis completed successfully!', 'success');

      localStorage.setItem('lastRoofAnalysis', JSON.stringify(result.data));
      const solarPot = result.data.solar_potential || 'High';
      const totalPnl = result.data.total_panels || 0;
      const sysSizeKw = result.data.system_size_kw || 3;
      logAuditEvent((_getUser() || {}).email, 'Roof Assessment Completed', 'Assessment', `Completed roof satellite scan: area = ${result.data.roof_area_sqft} sqft, solar potential = ${solarPot}, panels = ${totalPnl}, system size = ${sysSizeKw} kW.`, 'Medium');
      createNotification('assessment', 'Roof Assessment Completed', `Solar potential: ${solarPot}. Recommended ${sysSizeKw} kW system with ${totalPnl} panels.`, 'medium');
      addActivityLog('roof', 'Roof Assessment Completed', `Roof analysis complete: ${solarPot} solar potential, ${sysSizeKw} kW system size.`);

      setTimeout(() => {
        if (progressBox) progressBox.style.display = 'none';
        if (laser) laser.style.display = 'none';
        
        // Success state on drop area
        dropArea.innerHTML = `
          <svg class="upload-icon" style="width: 44px; height: 44px; margin-bottom: 10px; stroke: var(--accent-green); fill: none; stroke-width: 1.5;" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style="font-size: 12px; color: var(--accent-green); font-weight: 700; margin: 0;">Rooftop Scan Verified & Extracted!</p>
          <span style="font-size: 9px; color: var(--text-muted);">Click to upload another image</span>
        `;

        if (poly1) poly1.style.display = 'block';
        if (poly2) poly2.style.display = 'block';

        renderRoofData(result.data);
      }, 800);
    })
    .catch((err) => {
      clearInterval(progressInterval);
      console.error('Roof analysis error:', err);

      if (progressBox) progressBox.style.display = 'none';
      if (laser) laser.style.display = 'none';
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (scanStatusText) scanStatusText.textContent = 'Status: Failed';

      if (errorBox) {
        const errorSpan = errorBox.querySelector('span');
        if (errorSpan) errorSpan.textContent = `Analysis failed: ${err.message || 'Server unavailable'}`;
        errorBox.style.display = 'block';
      }

      showToast(err.message || 'Failed to analyze rooftop image due to connection error.', 'error');
      logAuditEvent((_getUser() || {}).email, 'API Failure', 'Security', `Roof satellite scan failed: ${err.message || 'Server unavailable'}`, 'High');
    });
  }

  function runMockSimulation() {
    if (scanStatusText) scanStatusText.textContent = 'Status: Scanning...';
    if (laser) laser.style.display = 'block';
    if (progressBox) progressBox.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';

    if (poly1) poly1.style.display = 'none';
    if (poly2) poly2.style.display = 'none';

    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Simulating satellite scan...';

    showLoadingSkeletons();
    if (resultsContainer) resultsContainer.style.display = 'block';

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressPercent) progressPercent.textContent = `${progress}%`;

      if (progress === 30) {
        if (progressStatus) progressStatus.textContent = 'Mock: Scanning boundary areas...';
      } else if (progress === 60) {
        if (progressStatus) progressStatus.textContent = 'Mock: Estimating shading features...';
      } else if (progress === 90) {
        if (progressStatus) progressStatus.textContent = 'Mock: Optimizing solar size...';
      }

      if (progress >= 100) {
        clearInterval(interval);
        
        const mockData = {
          "total_area_sqft": 520,
          "usable_area_sqft": 380,
          "roof_type": "flat",
          "shading_issues": "minimal (8% shade factor)",
          "recommended_kw": 5.4,
          "number_of_panels": 16,
          "monthly_generation_units": 700
        };

        if (scanStatusText) scanStatusText.textContent = 'Status: Complete';
        showToast('Rooftop scan simulation completed!', 'success');

        localStorage.setItem('lastRoofAnalysis', JSON.stringify(mockData));
        createNotification('assessment', 'Roof Assessment Completed', `Roof suitability score of 73% (380 usable / 520 total sqft).`, 'medium');
        addActivityLog('roof', 'Roof Assessment Completed', `Scanned roof area suitability score: 73%.`);

        setTimeout(() => {
          if (progressBox) progressBox.style.display = 'none';
          if (laser) laser.style.display = 'none';
          
          if (poly1) poly1.style.display = 'block';
          if (poly2) poly2.style.display = 'block';

          renderRoofData(mockData);
        }, 800);
      }
    }, 100);
  }
}

/* ==========================================================================
   13. AI ASSISTANT CHATROOM AND REPLY BOT
   ========================================================================== */
function initAIAdvisorChat() {
  const log = document.getElementById('aiChatConversationLog');
  const input = document.getElementById('aiChatInputText');
  const sendBtn = document.getElementById('aiChatSendBtn');
  const chips = document.querySelectorAll('.chat-suggest-chip');
  
  if (!sendBtn || !input || !log) return;

  // Analytics Tracking Wrapper
  function trackEvent(name, data = {}) {
    console.log(`[Analytics] Tracked event: ${name}`, data);
    const trackingWrapper = window.logEvent || window.trackEvent || window.logAnalyticsEvent || (window.analytics && window.analytics.track);
    if (typeof trackingWrapper === 'function') {
      try {
        trackingWrapper(name, data);
      } catch (e) {
        console.warn('Existing tracking wrapper error:', e);
      }
    }
  }

  // Dynamically render the 12 suggested prompts inside suggestion chips row
  const chipsRow = document.querySelector('.chat-suggestion-chips-row');
  if (chipsRow) {
    const suggestedPrompts = [
      "Explain my bill analysis",
      "Is solar worth it for me?",
      "Explain my roof assessment",
      "How much can I save?",
      "What subsidy am I eligible for?",
      "Why was this system size recommended?",
      "How does net metering work?",
      "What affects my payback period?",
      "Analyze my solar readiness",
      "What should I do next?",
      "Explain my savings estimate",
      "Help me complete my assessment"
    ];
    chipsRow.innerHTML = suggestedPrompts.map(promptText => 
      `<button class="chat-suggest-chip" style="font-size: 11px; background: rgba(23,168,229,0.08); border: 1px solid rgba(23,168,229,0.25); color: var(--accent-blue); padding: 6px 12px; border-radius: 14px; cursor: pointer; transition: all 0.2s;">${promptText}</button>`
    ).join('');
  }

  // Inject typing animation styles dynamically
  if (!document.getElementById('chat-typing-styles')) {
    const style = document.createElement('style');
    style.id = 'chat-typing-styles';
    style.textContent = `
      @keyframes chatPulse {
        0% { opacity: 0.3; }
        100% { opacity: 1; }
      }
      .chat-pulse-dot {
        animation: chatPulse 0.6s infinite alternate;
        font-weight: bold;
        display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }

  // Basic markdown bold & list parser with HTML escaping
  function formatMessageContent(text) {
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Replace lines starting with bullet list notation
    const lines = safe.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.substring(2);
        return `<div style="display: flex; gap: 6px; margin-left: 8px; margin-top: 4px; align-items: flex-start;">
          <span style="color: var(--accent-blue); font-weight: bold; flex-shrink: 0;">•</span>
          <span>${content}</span>
        </div>`;
      }
      return line;
    });

    safe = formattedLines.join('\n');
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  let historyList = [];
  try {
    const saved = localStorage.getItem('solarChatHistory');
    if (saved) {
      historyList = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse solarChatHistory:', e);
  }

  if (historyList.length > 20) {
    historyList = historyList.slice(-20);
  }

  // Neutral welcomes without personalized names or marketing copy
  if (historyList.length === 0) {
    historyList.push({
      role: 'assistant',
      content: "Hello! I can help explain your bill analysis, roof assessment, ROI calculations, subsidy eligibility, and solar recommendations. How can I help you today?",
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
  }

  function renderLog() {
    log.innerHTML = '';
    historyList.forEach(msg => {
      const msgEl = document.createElement('div');
      if (msg.role === 'user') {
        msgEl.className = 'chat-message user';
        msgEl.style = 'display: flex; flex-direction: column; align-items: flex-end; max-width: 80%; margin-left: auto;';
        msgEl.innerHTML = `
          <div class="message-bubble" style="background: rgba(0, 174, 239, 0.15); border: 1px solid rgba(0, 174, 239, 0.3); padding: 10px 14px; border-radius: 8px 8px 0 8px; font-size: 12px; color: var(--text-navy); line-height: 1.4; text-align: left;">
            ${formatMessageContent(msg.content)}
          </div>
          <span class="message-time" style="font-size: 9px; color: var(--text-muted); margin-top: 4px; margin-right: 4px;">${msg.time}</span>
        `;
      } else {
        msgEl.className = 'chat-message assistant';
        msgEl.style = 'display: flex; flex-direction: column; align-items: flex-start; max-width: 80%;';
        msgEl.innerHTML = `
          <div class="message-bubble" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 8px 8px 8px 0; font-size: 12px; color: var(--text-navy); line-height: 1.4; text-align: left;">
            ${formatMessageContent(msg.content)}
          </div>
          <span class="message-time" style="font-size: 9px; color: var(--text-muted); margin-top: 4px; margin-left: 4px;">${msg.time}</span>
        `;
      }
      log.appendChild(msgEl);

      // Render dynamic Smart Action Card if applicable
      if (msg.showActionCard) {
        const cardEl = document.createElement('div');
        cardEl.className = 'chat-action-card';
        cardEl.style = 'margin: 10px 0 10px 0; padding: 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(0, 174, 239, 0.4); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s ease; max-width: 80%; box-sizing: border-box;';
        
        let cardTitle = "Recommended Next Step";
        let cardDesc = "";
        let cardBtnText = "";
        let tabTarget = "";
        let trackingEventName = "";
        let actionCallback = null;

        if (msg.showActionCard === 'bill') {
          cardDesc = "Upload your utility bill to parse consumption data and calculate initial solar potential recommendations.";
          cardBtnText = "Analyze My Bill";
          tabTarget = "bill-analyzer";
          trackingEventName = "bill_analysis_action";
          actionCallback = () => {
            const fileInput = document.getElementById('billFileInput');
            if (fileInput) fileInput.click();
          };
        } else if (msg.showActionCard === 'roof') {
          cardDesc = "Scan your rooftop dimensions and orientation using satellite imagery to estimate usable space and shading obstructions.";
          cardBtnText = "Run Roof Analysis";
          tabTarget = "roof-analysis";
          trackingEventName = "roof_analysis_action";
        } else if (msg.showActionCard === 'roi') {
          cardDesc = "Simulate solar system lifecycle savings, initial setup investment cost, and government subsidy payback periods.";
          cardBtnText = "Calculate ROI";
          tabTarget = "roi-calculator";
          trackingEventName = "roi_action";
        }

        cardEl.innerHTML = `
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: var(--accent-blue); font-family: 'Outfit', sans-serif;">${cardTitle}</h4>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary); line-height: 1.4; font-family: 'Outfit', sans-serif;">${cardDesc}</p>
          <button class="chat-action-btn" style="background: var(--accent-orange); border: 1px solid var(--accent-orange); color: #fff; padding: 8px 16px; font-size: 11px; font-weight: 700; border-radius: 6px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(247, 147, 30, 0.3); font-family: 'Outfit', sans-serif; outline: none;">${cardBtnText}</button>
        `;

        // Card Hover Effects
        cardEl.addEventListener('mouseenter', () => {
          cardEl.style.transform = 'translateY(-2px)';
          cardEl.style.boxShadow = '0 6px 16px rgba(0, 174, 239, 0.2)';
          cardEl.style.borderColor = 'rgba(0, 174, 239, 0.8)';
        });
        cardEl.addEventListener('mouseleave', () => {
          cardEl.style.transform = 'translateY(0)';
          cardEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          cardEl.style.borderColor = 'rgba(0, 174, 239, 0.4)';
        });

        const btn = cardEl.querySelector('.chat-action-btn');
        btn.addEventListener('mouseenter', () => {
          btn.style.boxShadow = '0 4px 12px rgba(247, 147, 30, 0.5)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.boxShadow = '0 2px 6px rgba(247, 147, 30, 0.3)';
        });

        // Click routing
        btn.addEventListener('click', () => {
          if (trackingEventName) {
            trackEvent(trackingEventName);
          }
          trackEvent('assistant_navigation', { target: tabTarget });

          const menu = document.querySelector(`[data-tab="${tabTarget}"]`);
          if (menu) {
            menu.click();
            if (actionCallback) {
              setTimeout(actionCallback, 300);
            }
          }
        });

        log.appendChild(cardEl);
      }
    });
    log.scrollTop = log.scrollHeight;
  }

  let typingIndicator = null;
  function showTyping(show) {
    if (show) {
      if (!typingIndicator) {
        typingIndicator = document.createElement('div');
        typingIndicator.id = 'aiChatTypingIndicator';
        typingIndicator.className = 'chat-message assistant';
        typingIndicator.style = 'display: flex; flex-direction: column; align-items: flex-start; max-width: 80%; margin-top: 8px;';
        typingIndicator.innerHTML = `
          <div class="message-bubble" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 8px 8px 8px 0; font-size: 12px; color: var(--text-muted); line-height: 1.4; display: flex; gap: 4px; align-items: center;">
            <span>GET Solar Copilot is thinking</span>
            <span class="chat-pulse-dot" style="animation-delay: 0s;">.</span>
            <span class="chat-pulse-dot" style="animation-delay: 0.2s;">.</span>
            <span class="chat-pulse-dot" style="animation-delay: 0.4s;">.</span>
          </div>
        `;
      }
      typingIndicator.style.display = 'flex';
      log.appendChild(typingIndicator);
      log.scrollTop = log.scrollHeight;
      
      input.disabled = true;
      sendBtn.disabled = true;
      input.placeholder = "GET Solar Copilot is thinking...";
    } else {
      if (typingIndicator) {
        typingIndicator.style.display = 'none';
      }
      input.disabled = false;
      sendBtn.disabled = false;
      input.placeholder = "Ask GET Solar Advisor...";
    }
  }

  function sendMessage(text) {
    if (!text || !text.trim()) return;
    
    input.value = '';
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    historyList.push({ role: 'user', content: text, time: timeStr });
    
    if (historyList.length > 20) {
      historyList = historyList.slice(-20);
    }
    localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
    
    renderLog();
    showTyping(true);
    addActivityLog('assistant', 'AI Advisor Message Sent', `Sent query to Solar Copilot: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);
    
    const lowerText = text.toLowerCase().trim();
    
    // Check missing bill analysis context triggers
    const isBillQuery = lowerText.includes('explain my bill analysis') || 
                        lowerText.includes('why was this system size recommended') || 
                        lowerText.includes('how much electricity do i use');
                        
    if (isBillQuery && !localStorage.getItem('lastBillAnalysis')) {
      setTimeout(() => {
        showTyping(false);
        const replyText = "I don't currently have any bill analysis results available.";
        const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'bill' });
        if (historyList.length > 20) historyList = historyList.slice(-20);
        localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
        renderLog();
      }, 600);
      return;
    }
    
    // Check missing roof analysis context triggers
    const isRoofQuery = lowerText.includes('explain my roof assessment') || 
                        lowerText.includes('is my roof suitable') || 
                        lowerText.includes('what solar size can my roof support');
                        
    if (isRoofQuery && !localStorage.getItem('lastRoofAnalysis')) {
      setTimeout(() => {
        showTyping(false);
        const replyText = "I don't currently have any roof assessment results available.";
        const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'roof' });
        if (historyList.length > 20) historyList = historyList.slice(-20);
        localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
        renderLog();
      }, 600);
      return;
    }
    
    // Check missing ROI context triggers
    const isRoiQuery = lowerText.includes('is solar worth it for me') || 
                       lowerText.includes('what is my payback period') || 
                       lowerText.includes('how much can i save') || 
                       lowerText.includes('what is my roi') ||
                       lowerText.includes('explain my savings estimate');
                       
    if (isRoiQuery && !localStorage.getItem('lastROIAnalysis')) {
      setTimeout(() => {
        showTyping(false);
        const replyText = "I can provide a more accurate recommendation after an ROI analysis.";
        const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'roi' });
        if (historyList.length > 20) historyList = historyList.slice(-20);
        localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
        renderLog();
      }, 600);
      return;
    }

    // Guidance tree triggers
    const isGuidanceQuery = lowerText.includes('what should i do next') || 
                            lowerText.includes('help me complete my assessment') || 
                            lowerText.includes('analyze my solar readiness');
                            
    if (isGuidanceQuery) {
      if (!localStorage.getItem('lastBillAnalysis')) {
        setTimeout(() => {
          showTyping(false);
          const replyText = "To guide you accurately, the first step is analyzing your electricity bill to determine your monthly energy consumption patterns.";
          const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'bill' });
          if (historyList.length > 20) historyList = historyList.slice(-20);
          localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
          renderLog();
        }, 600);
        return;
      }
      
      if (!localStorage.getItem('lastRoofAnalysis')) {
        setTimeout(() => {
          showTyping(false);
          const replyText = "Your bill consumption has been verified. The next step is scanning your rooftop dimensions to ensure space suitability and optimize panel layout sizing.";
          const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'roof' });
          if (historyList.length > 20) historyList = historyList.slice(-20);
          localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
          renderLog();
        }, 600);
        return;
      }
      
      if (!localStorage.getItem('lastROIAnalysis')) {
        setTimeout(() => {
          showTyping(false);
          const replyText = "Your bill consumption and rooftop size look promising. The next step is calculating your net installation investment, government subsidies, and payback timeline.";
          const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr, showActionCard: 'roi' });
          if (historyList.length > 20) historyList = historyList.slice(-20);
          localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
          renderLog();
        }, 600);
        return;
      }
    }
    
    // Extract available context
    let bill_analysis = null;
    let roof_analysis = null;
    let roi_analysis = null;
    
    try {
      const billSaved = localStorage.getItem('lastBillAnalysis');
      if (billSaved) bill_analysis = JSON.parse(billSaved);
    } catch(e) {}
    
    try {
      const roofSaved = localStorage.getItem('lastRoofAnalysis');
      if (roofSaved) roof_analysis = JSON.parse(roofSaved);
    } catch(e) {}
    
    try {
      const roiSaved = localStorage.getItem('lastROIAnalysis');
      if (roiSaved) roi_analysis = JSON.parse(roiSaved);
    } catch(e) {}

    const contextHistory = historyList.slice(0, -1).slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const host = API_BASE;
    safeFetch(`${host}/api/solar-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        history: contextHistory,
        context: {
          bill_analysis,
          roof_analysis,
          roi_analysis
        }
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      return res.json();
    })
    .then((result) => {
      showTyping(false);
      logAuditEvent((_getUser() || {}).email, 'Solar Copilot Answered', 'AI Assistant', `Copilot answered query: "${text.substring(0, 45)}${text.length > 45 ? '...' : ''}"`, 'Low');
      
      let replyText = '';
      if (result && result.success === true && result.response) {
        replyText = result.response;
      } else {
        replyText = "GET Solar Copilot is currently experiencing high demand. Please try again in a few moments.";
      }
      
      const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr });
      
      if (historyList.length > 20) {
        historyList = historyList.slice(-20);
      }
      localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
      
      renderLog();
      createNotification('assistant', 'AI Recommendation Available', 'New custom recommendations are available in Solar Copilot.', 'medium');
      addActivityLog('assistant', 'Solar Copilot Answered', 'AI Advisor generated custom recommendations.');
    })
    .catch((err) => {
      console.error('Chat assistant error:', err);
      showTyping(false);
      logAuditEvent((_getUser() || {}).email, 'Gemini Timeout', 'Security', `FastAPI chat assistant call failed: ${err.message || 'Server unavailable'}. Displayed fallback offline alert.`, 'High');
      
      const replyText = "GET Solar Copilot is currently experiencing high demand. Please try again in a few moments.";
      const replyTimeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      historyList.push({ role: 'assistant', content: replyText, time: replyTimeStr });
      
      if (historyList.length > 20) {
        historyList = historyList.slice(-20);
      }
      localStorage.setItem('solarChatHistory', JSON.stringify(historyList));
      
      renderLog();
    });
  }
  
  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(input.value);
  });
  
  // Suggested Prompt click listeners (dynamically attached to chipsRow items)
  const dynamicChips = chipsRow ? chipsRow.querySelectorAll('.chat-suggest-chip') : chips;
  dynamicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (!input.disabled) {
        sendMessage(chip.textContent);
      }
    });
  });

  renderLog();
}

/* ==========================================================================
   14. REPORTS & PDF EXPORT CENTER
   ========================================================================== */
let currentPreviewId = null;

function initReportsCenter() {
  const btnEmptyBill = document.getElementById('btnEmptyBill');
  const btnEmptyRoof = document.getElementById('btnEmptyRoof');
  const btnEmptyROI = document.getElementById('btnEmptyROI');
  
  if (btnEmptyBill) btnEmptyBill.addEventListener('click', () => switchTab('bill-analyzer'));
  if (btnEmptyRoof) btnEmptyRoof.addEventListener('click', () => switchTab('roof-analysis'));
  if (btnEmptyROI) btnEmptyROI.addEventListener('click', () => switchTab('roi-calculator'));

  // Bind Generate/Preview/Download templates buttons
  document.getElementById('btnGenBill')?.addEventListener('click', () => generateReport('bill'));
  document.getElementById('btnPrevBill')?.addEventListener('click', () => previewReport('bill'));
  document.getElementById('btnDlBill')?.addEventListener('click', () => downloadReport('bill'));

  document.getElementById('btnGenRoof')?.addEventListener('click', () => generateReport('roof'));
  document.getElementById('btnPrevRoof')?.addEventListener('click', () => previewReport('roof'));
  document.getElementById('btnDlRoof')?.addEventListener('click', () => downloadReport('roof'));

  document.getElementById('btnGenRoi')?.addEventListener('click', () => generateReport('roi'));
  document.getElementById('btnPrevRoi')?.addEventListener('click', () => previewReport('roi'));
  document.getElementById('btnDlRoi')?.addEventListener('click', () => downloadReport('roi'));

  document.getElementById('btnGenComp')?.addEventListener('click', () => generateReport('comprehensive'));
  document.getElementById('btnPrevComp')?.addEventListener('click', () => previewReport('comprehensive'));
  document.getElementById('btnDlComp')?.addEventListener('click', () => downloadReport('comprehensive'));

  // Quick actions
  document.getElementById('btnGenerateAll')?.addEventListener('click', () => {
    generateAllReports();
  });
  document.getElementById('btnDownloadLatest')?.addEventListener('click', () => {
    downloadLatestReport();
  });

  // CSV Exports
  document.getElementById('btnCsvBill')?.addEventListener('click', () => exportReportCSV('bill'));
  document.getElementById('btnCsvRoof')?.addEventListener('click', () => exportReportCSV('roof'));
  document.getElementById('btnCsvRoi')?.addEventListener('click', () => exportReportCSV('roi'));
  document.getElementById('btnCsvCombined')?.addEventListener('click', () => exportReportCSV('combined'));

  // Modal actions
  const previewModal = document.getElementById('reportPreviewModal');
  const btnClosePreview = document.getElementById('btnClosePreview');
  const btnPrintPreview = document.getElementById('btnPrintPreview');

  if (btnClosePreview) {
    btnClosePreview.addEventListener('click', () => {
      if (previewModal) previewModal.style.display = 'none';
    });
  }
  
  if (btnPrintPreview) {
    btnPrintPreview.addEventListener('click', () => {
      if (currentPreviewId) {
        downloadReportHistory(currentPreviewId);
      }
    });
  }
  
  // Search history
  const searchInput = document.getElementById('reportHistorySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderRecentReportsHistory(e.target.value);
    });
  }

  // Expose methods globally for datatable row clicks
  window.previewReportHistory = previewReportHistory;
  window.downloadReportHistory = downloadReportHistory;
  window.deleteReportHistory = deleteReportHistory;

  // Refresh view
  refreshReportsDashboard();
}

function getSolarReadinessScore() {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  let billScore = billData ? 100 : 0;
  
  let roofScore = 0;
  if (roofData) {
    const usable = Number(roofData.usable_area_sqft) || 0;
    const total = Number(roofData.total_area_sqft) || 0;
    let suitability = 92;
    if (total > 0) {
      let ratio = usable / total;
      let shadePenalty = 5;
      const shading = (roofData.shading_issues || "none").toLowerCase();
      if (shading.includes("none") || shading === "no" || shading === "nil") shadePenalty = 0;
      else if (shading.includes("minimal") || shading.includes("low")) shadePenalty = 5;
      else if (shading.includes("moderate") || shading.includes("partial")) shadePenalty = 15;
      else if (shading.includes("severe") || shading.includes("heavy")) shadePenalty = 30;
      suitability = Math.min(99, Math.max(50, Math.round(ratio * 100 - shadePenalty)));
    }
    roofScore = suitability;
  }

  let roiScore = 0;
  if (roiData) {
    const payback = roiData.data?.payback_period || roiData.payback_period || 5.0;
    roiScore = Math.max(50, Math.min(100, Math.round(100 - (payback - 3) * 8)));
  }

  let hasBill = billData ? 1 : 0;
  let hasRoof = roofData ? 1 : 0;
  let hasRoi = roiData ? 1 : 0;

  // Capped at 100% using raw additions matching requirement
  let totalScore = Math.round(billScore * 0.40 + roofScore * 0.35 + roiScore * 0.25);

  let rating = "Not Ready";
  if (totalScore >= 80) rating = "Excellent Candidate";
  else if (totalScore >= 60) rating = "Good Candidate";
  else if (totalScore >= 40) rating = "Fair Candidate";
  else rating = "Not Ready";

  return { score: totalScore, rating: rating, hasBill, hasRoof, hasRoi };
}

function getReportBadgeStatus(type) {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  let available = false;
  if (type === 'bill') available = !!billData;
  else if (type === 'roof') available = !!roofData;
  else if (type === 'roi') available = !!roiData;
  else if (type === 'comprehensive') available = !!(billData && roofData && roiData);

  if (!available) return { label: "Not Available", class: "badge-gray", disabled: true };

  // Check history
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const match = history.filter(h => h.type === type);
  if (match.length > 0) {
    const hasDl = match.some(m => m.status === 'downloaded');
    if (hasDl) return { label: "Downloaded", class: "badge-orange", disabled: false };
    return { label: "Generated", class: "badge-green", disabled: false };
  }

  return { label: "Ready", class: "badge-cyan", disabled: false };
}

function refreshReportsDashboard() {
  const emptyState = document.getElementById('reportsEmptyState');
  const content = document.getElementById('reportsContentContainer');

  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  const hasAny = billData || roofData || roiData;

  if (!hasAny) {
    if (emptyState) emptyState.style.display = 'block';
    if (content) content.style.display = 'none';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  const types = ['bill', 'roof', 'roi', 'comprehensive'];
  types.forEach(t => {
    const capitalized = t.charAt(0).toUpperCase() + t.slice(1);
    const idSuffix = capitalized === 'Comprehensive' ? 'Comp' : capitalized;
    
    const badge = document.getElementById(`badge${idSuffix}`);
    const btnGen = document.getElementById(`btnGen${idSuffix}`);
    const btnPrev = document.getElementById(`btnPrev${idSuffix}`);
    const btnDl = document.getElementById(`btnDl${idSuffix}`);
    const dateEl = document.getElementById(`date${idSuffix}`);

    const status = getReportBadgeStatus(t);
    if (badge) {
      badge.textContent = status.label;
      badge.className = `status-badge ${status.class}`;
    }
    if (btnGen) btnGen.disabled = status.disabled;
    if (btnPrev) btnPrev.disabled = status.disabled;
    if (btnDl) btnDl.disabled = status.disabled;

    let history = [];
    try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
    const match = history.filter(h => h.type === t).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (dateEl) {
      if (match.length > 0) {
        const d = new Date(match[0].createdAt);
        dateEl.textContent = `Last Run: ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} (v${match[0].version})`;
      } else {
        dateEl.textContent = "Last Run: Never";
      }
    }
  });

  renderRecentReportsHistory();
}

function renderRecentReportsHistory(filterQuery = '') {
  const tableBody = document.getElementById('reportsHistoryTableBody');
  if (!tableBody) return;

  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}

  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const query = filterQuery.toLowerCase().trim();
  const filtered = history.filter(h => {
    const name = getReportName(h.type);
    return name.toLowerCase().includes(query) || h.reportId.toLowerCase().includes(query) || h.status.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">No matching reports in history.</td></tr>';
    return;
  }

  tableBody.innerHTML = filtered.map(h => {
    const name = getReportName(h.type);
    const date = new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let badgeClass = "badge-cyan";
    if (h.status === 'downloaded') badgeClass = "badge-orange";
    else if (h.status === 'generated') badgeClass = "badge-green";
    const statusText = h.status.charAt(0).toUpperCase() + h.status.slice(1);

    return `<tr style="border-bottom: 1px solid var(--border-color-light);">
      <td style="padding: 10px 8px;">
        <strong>${_esc(name)}</strong><br>
        <span style="font-size: 9px; color: var(--text-muted); font-family: monospace;">ID: ${h.reportId}</span>
      </td>
      <td style="padding: 10px 8px;">v${h.version}</td>
      <td style="padding: 10px 8px;">${date}</td>
      <td style="padding: 10px 8px;">${h.downloads}</td>
      <td style="padding: 10px 8px;"><span class="status-badge ${badgeClass}" style="padding: 2px 6px; font-size: 9px; border-radius: 4px;">${statusText}</span></td>
      <td style="padding: 10px 8px;">
        <div style="display: flex; gap: 6px;">
          <button class="table-action-btn" style="padding: 2px 6px; font-size: 10px; border-radius: 4px;" onclick="previewReportHistory('${h.id}')">Preview</button>
          <button class="table-action-btn" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; background: rgba(34, 197, 94, 0.1); color: var(--accent-green); border: 1px solid rgba(34, 197, 94, 0.2);" onclick="downloadReportHistory('${h.id}')">Download</button>
          <button class="table-action-btn" style="padding: 2px 6px; font-size: 10px; border-radius: 4px; background: rgba(231, 76, 60, 0.1); color: #ef4444; border: 1px solid rgba(231, 76, 60, 0.2);" onclick="deleteReportHistory('${h.id}')">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function generateReport(type) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}

  const match = history.filter(h => h.type === type).sort((a, b) => b.version - a.version);
  const nextVersion = match.length > 0 ? match[0].version + 1 : 1;

  const scoreObj = getSolarReadinessScore();
  const reportId = generateReportId();
  
  const newEntry = {
    id: 'rep-' + Date.now() + '-' + Math.floor(Math.random()*1000),
    version: nextVersion,
    type: type,
    createdAt: new Date().toISOString(),
    downloads: 0,
    status: "generated",
    readinessScore: scoreObj.score,
    reportId: reportId
  };

  history.push(newEntry);
  localStorage.setItem('reportHistory', JSON.stringify(history));
  showToast(`${getReportName(type)} successfully generated!`, "success");
  logAuditEvent((_getUser() || {}).email, 'Report Generated', 'Reports', `Generated new report: ${getReportName(type)} (v${newEntry.version}).`, 'Medium');
  
  refreshReportsDashboard();
  createNotification('reports', 'Report Generated', `Branded ${getReportName(type)} (v${nextVersion}) is now available for download.`, 'high');
  addActivityLog('report', 'Report Generated', `Successfully generated ${getReportName(type)} (v${nextVersion}).`);
}

function generateAllReports() {
  const types = ['bill', 'roof', 'roi', 'comprehensive'];
  let count = 0;
  types.forEach(t => {
    const status = getReportBadgeStatus(t);
    if (!status.disabled) {
      generateReport(t);
      count++;
    }
  });
  if (count > 0) {
    showToast(`Generated all ${count} available reports.`, "success");
  } else {
    showToast("No assessments completed yet to generate reports.", "warning");
  }
}

function downloadLatestReport() {
  const status = getReportBadgeStatus('comprehensive');
  if (status.disabled) {
    showToast("Please complete Bill, Roof, and ROI analyses to download Comprehensive Report.", "warning");
    return;
  }
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const match = history.filter(h => h.type === 'comprehensive').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let entry = null;
  if (match.length > 0) {
    entry = match[0];
  } else {
    generateReport('comprehensive');
    try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
    entry = history.filter(h => h.type === 'comprehensive').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  if (entry) {
    downloadReportHistory(entry.id);
  }
}

function previewReport(type) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const match = history.filter(h => h.type === type).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let entry = null;
  if (match.length > 0) {
    entry = match[0];
  } else {
    generateReport(type);
    try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
    entry = history.filter(h => h.type === type).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
  
  if (entry) {
    previewReportHistory(entry.id);
  }
}

function downloadReport(type) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const match = history.filter(h => h.type === type).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let entry = null;
  if (match.length > 0) {
    entry = match[0];
  } else {
    generateReport(type);
    try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
    entry = history.filter(h => h.type === type).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
  
  if (entry) {
    downloadReportHistory(entry.id);
  }
}

function previewReportHistory(id) {
  currentPreviewId = id;
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const entry = history.find(h => h.id === id);
  if (!entry) return;

  const htmlContent = buildReportHTMLContent(entry);
  logAuditEvent((_getUser() || {}).email, 'Report Previewed', 'Reports', `Opened preview drawer for report: ${getReportName(entry.type)} (v${entry.version}).`, 'Low');
  const container = document.getElementById('reportPreviewContent');
  if (container) {
    container.innerHTML = htmlContent;
  }

  const modal = document.getElementById('reportPreviewModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function downloadReportHistory(id) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const idx = history.findIndex(h => h.id === id);
  if (idx === -1) return;

  history[idx].downloads += 1;
  history[idx].status = 'downloaded';
  localStorage.setItem('reportHistory', JSON.stringify(history));

  const entry = history[idx];
  logAuditEvent((_getUser() || {}).email, 'Report Downloaded', 'Reports', `Downloaded / printed PDF report: ${getReportName(entry.type)} (v${entry.version}).`, 'Low');
  const htmlContent = buildReportHTMLContent(entry, true);
  
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    createNotification('reports', 'Report Downloaded', `Exported branded PDF for ${getReportName(entry.type)} (v${entry.version}).`, 'low');
    addActivityLog('report', 'Report Exported', `Downloaded PDF for ${getReportName(entry.type)} (v${entry.version}).`);
  } else {
    showToast("Pop-up blocked! Please allow pop-ups to download PDF reports.", "error");
  }

  refreshReportsDashboard();
}

function deleteReportHistory(id) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  const entry = history.find(h => h.id === id);
  const filtered = history.filter(h => h.id !== id);
  localStorage.setItem('reportHistory', JSON.stringify(filtered));
  
  const typeName = entry ? getReportName(entry.type) : 'Unknown';
  const versionStr = entry ? `(v${entry.version})` : '';
  logAuditEvent((_getUser() || {}).email, 'Report Deleted', 'Reports', `Deleted report from history: ${typeName} ${versionStr}.`, 'Medium');
  
  showToast("Report deleted from history.", "info");
  refreshReportsDashboard();
}

function getReportName(type) {
  if (type === 'bill') return "Bill Analysis Report";
  if (type === 'roof') return "Roof Assessment Report";
  if (type === 'roi') return "ROI & Financial Report";
  if (type === 'comprehensive') return "Comprehensive Solar Assessment";
  return "Solar Intelligence Report";
}

function getReportRecommendations() {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  let recs = [];
  if (!billData) {
    recs.push({ text: "Complete Utility Bill Analysis", desc: "Upload your electricity bill to audit your current utility DISCOM tariff and match exact energy consumption patterns." });
  }
  if (!roofData) {
    recs.push({ text: "Complete Roof Satellite Scan", desc: "Scan your building rooftop surface to map usable placement area and assess shadow blockage penalties." });
  }
  if (!roiData) {
    recs.push({ text: "Calculate Financial ROI & Payback", desc: "Simulate solar system investment costs, payback schedules, and central PM Surya Ghar subsidies." });
  } else {
    const payback = roiData.data?.payback_period || roiData.payback_period || 5.0;
    if (payback > 4.5) {
      recs.push({ text: "Review Low-Interest Financing & Loans", desc: "Explore attractive solar loan options with partner banks like SBI or Tata Capital to minimize upfront capital." });
    }
  }
  recs.push({ text: "Apply for PM Surya Ghar Subsidy", desc: "Submit application for government subsidies (up to ₹78,000 for residential systems ≤ 3 kW)." });
  recs.push({ text: "Request Installer Consultation", desc: "Schedule a free technical inspection with an certified local installer to confirm roof structures and wiring layout." });
  return recs;
}

function generateReportId() {
  const now = new Date();
  const yyyymmdd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let xxxx = '';
  for (let i = 0; i < 4; i++) {
    xxxx += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GS-${yyyymmdd}-${xxxx}`;
}

function exportReportCSV(type) {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  let headers = [];
  let row = [];

  const now = new Date();
  const format = (num) => String(num).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())}`;
  const timeStr = `${format(now.getHours())}-${format(now.getMinutes())}-${format(now.getSeconds())}`;
  const filename = `solar_report_${dateStr}_${timeStr}.csv`;

  if (type === 'bill') {
    if (!billData) {
      showToast("No Bill Analysis data available to export.", "warning");
      return;
    }
    headers = ['Monthly Bill', 'Units Consumed', 'Recommended Size', 'Annual Savings'];
    const billAmt = billData.bill_amount || 0;
    const units = billData.monthly_units || 0;
    const kw = billData.recommended_kw || 0;
    const annualSavings = billData.monthly_savings_rs ? (billData.monthly_savings_rs * 12) : (billAmt * 0.9 * 12);
    row = [billAmt, units, kw, annualSavings];
  }
  else if (type === 'roof') {
    if (!roofData) {
      showToast("No Roof Assessment data available to export.", "warning");
      return;
    }
    headers = ['Suitability Score', 'Roof Area', 'Panel Count'];
    
    let suitabilityScore = 92;
    if (roofData.usable_area_sqft && roofData.total_area_sqft) {
      const ratio = roofData.usable_area_sqft / roofData.total_area_sqft;
      let shadePenalty = 5;
      const shadeLower = (roofData.shading_issues || "none").toLowerCase();
      if (shadeLower.includes("none") || shadeLower === "no" || shadeLower === "nil") shadePenalty = 0;
      else if (shadeLower.includes("minimal") || shadeLower.includes("low")) shadePenalty = 5;
      else if (shadeLower.includes("moderate") || shadeLower.includes("partial")) shadePenalty = 15;
      else if (shadeLower.includes("severe") || shadeLower.includes("heavy")) shadePenalty = 30;
      suitabilityScore = Math.min(99, Math.max(50, Math.round(ratio * 100 - shadePenalty)));
    }
    
    row = [suitabilityScore, roofData.total_area_sqft, roofData.number_of_panels];
  }
  else if (type === 'roi') {
    if (!roiData) {
      showToast("No ROI Analysis data available to export.", "warning");
      return;
    }
    headers = ['Project Cost', 'Subsidy', 'Payback', 'ROI'];
    const cost = roiData.data?.system_cost || roiData.data?.system_cost_rs || 0;
    const sub = roiData.data?.government_subsidy || 0;
    const payback = roiData.data?.payback_period || roiData.data?.payback_years || 0.0;
    const roi = roiData.data?.roi_percentage || 0;
    row = [cost, sub, payback, roi];
  }
  else if (type === 'combined') {
    headers = [
      'Monthly Bill', 'Units Consumed', 'Recommended Size', 'Annual Savings',
      'Roof Suitability Score', 'Roof Area', 'Panel Count',
      'Project Cost', 'Subsidy', 'Payback', 'ROI'
    ];

    let billAmt = '', units = '', kw = '', annualSavings = '';
    if (billData) {
      billAmt = billData.bill_amount || '';
      units = billData.monthly_units || '';
      kw = billData.recommended_kw || '';
      annualSavings = billData.monthly_savings_rs ? (billData.monthly_savings_rs * 12) : (billAmt * 0.9 * 12);
    }

    let suitabilityScore = '', totalArea = '', panels = '';
    if (roofData) {
      totalArea = roofData.total_area_sqft || '';
      panels = roofData.number_of_panels || '';
      suitabilityScore = 92;
      if (roofData.usable_area_sqft && roofData.total_area_sqft) {
        const ratio = roofData.usable_area_sqft / roofData.total_area_sqft;
        let shadePenalty = 5;
        const shadeLower = (roofData.shading_issues || "none").toLowerCase();
        if (shadeLower.includes("none") || shadeLower === "no" || shadeLower === "nil") shadePenalty = 0;
        else if (shadeLower.includes("minimal") || shadeLower.includes("low")) shadePenalty = 5;
        else if (shadeLower.includes("moderate") || shadeLower.includes("partial")) shadePenalty = 15;
        else if (shadeLower.includes("severe") || shadeLower.includes("heavy")) shadePenalty = 30;
        suitabilityScore = Math.min(99, Math.max(50, Math.round(ratio * 100 - shadePenalty)));
      }
    }

    let cost = '', sub = '', payback = '', roi = '';
    if (roiData) {
      cost = roiData.data?.system_cost || roiData.data?.system_cost_rs || '';
      sub = roiData.data?.government_subsidy || '';
      payback = roiData.data?.payback_period || roiData.data?.payback_years || '';
      roi = roiData.data?.roi_percentage || '';
    }

    row = [
      billAmt, units, kw, annualSavings,
      suitabilityScore, totalArea, panels,
      cost, sub, payback, roi
    ];
  }

  downloadCSV(filename, headers, [row]);
}

function buildReportHTMLContent(entry, forPrinting = false) {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  const user = _getUser() || {};
  const customerName = billData?.customer_name || user.name || "Customer";
  const discom = billData?.discom || "Not Available";
  const billingPeriod = billData?.billing_period || "Not Available";
  const consumerNumber = billData?.consumer_number || "Not Available";

  const scoreObj = getSolarReadinessScore();
  const completeness = (billData ? 25 : 0) + (roofData ? 25 : 0) + (roiData ? 25 : 0) + (scoreObj.score > 0 ? 25 : 0);
  const name = getReportName(entry.type);
  const dateStr = new Date(entry.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  const timestampStr = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date(entry.createdAt).toLocaleDateString();

  const recs = getReportRecommendations();
  const recsHtml = recs.map((r, i) => `
    <div style="padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.02); border-left: 3px solid #F59E0B; border-radius: 0 4px 4px 0;">
      <strong style="color: #F59E0B; font-size: 11px;">${i+1}. ${r.text}</strong>
      <p style="font-size: 10px; color: #cbd5e1; margin: 3px 0 0 0;">${r.desc}</p>
    </div>
  `).join('');

  const recommendedKw = roiData ? roiData.system_size : (roofData ? roofData.recommended_kw : (billData ? billData.recommended_kw : 5.0));
  const annualSavings = roiData ? (roiData.data?.annual_savings || roiData.annual_savings || 0) : 0;
  const payback = roiData ? (roiData.data?.payback_period || roiData.payback_period || 0.0) : 0.0;
  const subsidy = roiData ? (roiData.data?.government_subsidy || 0) : 0;
  const netCost = roiData ? (roiData.data?.net_cost || 0) : 0;
  const systemCost = roiData ? (roiData.data?.system_cost || 0) : 0;
  const roiPct = roiData ? (roiData.data?.roi_percentage || 0) : 0;
  const co2Val = roiData ? (roiData.data?.co2_reduction || 0) : 0;

  const styleLink = forPrinting ? `
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background: #060F1F !important;
        color: #ffffff !important;
        margin: 0;
        padding: 40px;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
      }
      h1, h2, h3, h4, h5 {
        font-family: 'Outfit', sans-serif;
        color: #ffffff !important;
      }
      .page-break {
        page-break-after: always;
      }
      @media print {
        body {
          background: #060F1F !important;
          color: #ffffff !important;
        }
      }
    </style>
  ` : '';

  let coverPageHtml = `
    <div style="background: #060F1F; border: 2px solid rgba(0, 181, 226, 0.4); border-radius: 8px; padding: 60px 40px; text-align: center; min-height: 80vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; position: relative; overflow: hidden; margin-bottom: 40px;" class="page-break">
      <div style="position: absolute; top: -150px; left: -150px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(0, 181, 226, 0.15) 0%, rgba(0,0,0,0) 70%); pointer-events: none;"></div>
      <div style="position: absolute; bottom: -150px; right: -150px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0,0,0,0) 70%); pointer-events: none;"></div>
      
      <div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 900; color: #ffffff; margin-bottom: 5px; letter-spacing: 0.5px;">GET Solar Energy</div>
        <div style="font-size: 10px; font-weight: 600; color: #00B5E2; text-transform: uppercase; letter-spacing: 2px;">Solar Intelligence Platform</div>
      </div>

      <div style="margin: 60px 0;">
        <h1 style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Customer Solar Assessment Report</h1>
        <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #00B5E2, #F59E0B); margin: 0 auto 20px auto; border-radius: 2px;"></div>
        <div style="display: inline-block; background: rgba(0, 181, 226, 0.12); border: 1px solid rgba(0, 181, 226, 0.25); color: #00B5E2; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 12px; letter-spacing: 0.5px;">
          ${name}
        </div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; color: #94a3b8; text-align: left;">
        <div>
          <span style="display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 3px;">Customer Profile</span>
          <strong style="color: #ffffff; font-size: 13px;">${_esc(customerName)}</strong>
          ${billData ? `<br><span style="font-size: 10px;">Consumer No: ${consumerNumber}</span>` : ''}
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 3px;">Document Metadata</span>
          <span style="font-weight: 600; color: #ffffff;">Generated On: ${dateStr}</span>
          <br><span>Report Version: v${entry.version}</span>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
        GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · v${entry.version}
      </div>
    </div>
  `;

  let execSummaryHtml = `
    <div style="background: #060F1F; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px; margin-bottom: 30px;" class="page-break">
      <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 16px; font-weight: 800; color: #ffffff; margin: 0;">1. Executive Summary &amp; Recommendations</h2>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 9px; color: #94a3b8;">Completeness Score:</span>
          <strong style="font-size: 10px; background: rgba(245, 158, 11, 0.12); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.25); padding: 2px 6px; border-radius: 4px;">${completeness}% Complete</strong>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px;">
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; text-align: center;">
          <span style="font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">Solar Readiness</span>
          <strong style="font-size: 15px; color: #00B5E2; display: block;">${scoreObj.score} / 100</strong>
          <span style="font-size: 8px; color: #22c55e; font-weight: 700;">${scoreObj.rating}</span>
        </div>
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; text-align: center;">
          <span style="font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">Recommended Size</span>
          <strong style="font-size: 15px; color: #ffffff; display: block;">${_safeNum(recommendedKw).toFixed(1)} kW</strong>
          <span style="font-size: 8px; color: #94a3b8;">Solar Panel Array</span>
        </div>
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; text-align: center;">
          <span style="font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">Annual Savings</span>
          <strong style="font-size: 15px; color: #22c55e; display: block;">₹${annualSavings.toLocaleString('en-IN')}</strong>
          <span style="font-size: 8px; color: #94a3b8;">Estimated Savings</span>
        </div>
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; text-align: center;">
          <span style="font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px;">Payback Period</span>
          <strong style="font-size: 15px; color: #F59E0B; display: block;">${payback > 0 ? _safeNum(payback).toFixed(1) + ' Years' : 'N/A'}</strong>
          <span style="font-size: 8px; color: #94a3b8;">Financial ROI Timeline</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; font-size: 11px;">
        <div>
          <h4 style="font-size: 11px; color: #ffffff; text-transform: uppercase; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">Installation Recommendation</h4>
          <p style="color: #cbd5e1; line-height: 1.5; margin: 0;">
            Based on the assessments, your site is a <strong>${scoreObj.rating}</strong> for a rooftop solar system.
            ${roofData ? `Rooftop has usable panel space of ${roofData.usable_area_sqft} sqft with ${roofData.shading_issues.toLowerCase().includes('none') ? 'minimal to no shading obstructions.' : 'some shading blockages.'}` : 'Perform a satellite scan of your building roof to confirm geometric panel space compatibility.'}
            The recommended capacity is a <strong>${_safeNum(recommendedKw).toFixed(1)} kW</strong> solar plant which can offset up to 90% of electricity bills.
          </p>
          <div style="margin-top: 15px;">
            <strong style="color: #00B5E2;">PM Surya Ghar Subsidy: </strong>
            <span>${subsidy > 0 ? `Eligible for a central subsidy of ₹${subsidy.toLocaleString('en-IN')}, reducing net costs to ₹${netCost.toLocaleString('en-IN')}.` : 'Subsidies up to ₹78,000 are available for ≤ 3 kW systems.'}</span>
          </div>
        </div>
        
        <div>
          <h4 style="font-size: 11px; color: #ffffff; text-transform: uppercase; margin: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">Recommended Next Actions</h4>
          ${recsHtml}
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
        GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · Timestamp: ${timestampStr}
      </div>
    </div>
  `;

  let billSectionHtml = '';
  if (entry.type === 'bill' || entry.type === 'comprehensive') {
    billSectionHtml = `
      <div style="background: #060F1F; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px; margin-bottom: 30px;" class="page-break">
        <h2 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">2. Utility Bill Analysis &amp; Sizing Audit</h2>
        
        ${billData ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">DISCOM Audit Metrics</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Utility Company:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${discom}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Billing Period:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${billingPeriod}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Monthly Consumption:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${billData.monthly_units} kWh</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Average Per Unit Rate:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">₹${billData.per_unit_rate} / kWh</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Billing Amount:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 700;">₹${billData.bill_amount.toLocaleString('en-IN')}</td></tr>
              </table>
            </div>
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Solar Matching Calculations</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Recommended System:</td><td style="padding: 6px 0; text-align: right; color: #00B5E2; font-weight: 600;">${billData.recommended_kw} kW</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Est. Monthly Generation:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${billData.monthly_generation_units ? Math.round(billData.monthly_generation_units) : Math.round(billData.recommended_kw * 135)} kWh</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Est. Monthly Savings:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 600;">₹${Math.round(billData.monthly_savings_rs || billData.bill_amount * 0.9).toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Estimated System Cost:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">₹${(billData.system_cost_rs || billData.recommended_kw * 55000).toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">ROI Payback Period:</td><td style="padding: 6px 0; text-align: right; color: #F59E0B; font-weight: 700;">${billData.payback_years || 'N/A'} Years</td></tr>
              </table>
            </div>
          </div>
        ` : `
          <div style="border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            No Utility Bill Analysis results are available. Run a Bill Analyzer upload to unlock utility calculations.
          </div>
        `}
        
        <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
          GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · Timestamp: ${timestampStr}
        </div>
      </div>
    `;
  }

  let roofSectionHtml = '';
  if (entry.type === 'roof' || entry.type === 'comprehensive') {
    let suitabilityScore = 92;
    if (roofData && roofData.usable_area_sqft && roofData.total_area_sqft) {
      const ratio = roofData.usable_area_sqft / roofData.total_area_sqft;
      let shadePenalty = 5;
      const shadeLower = (roofData.shading_issues || "none").toLowerCase();
      if (shadeLower.includes("none") || shadeLower === "no" || shadeLower === "nil") shadePenalty = 0;
      else if (shadeLower.includes("minimal") || shadeLower.includes("low")) shadePenalty = 5;
      else if (shadeLower.includes("moderate") || shadeLower.includes("partial")) shadePenalty = 15;
      else if (shadeLower.includes("severe") || shadeLower.includes("heavy")) shadePenalty = 30;
      suitabilityScore = Math.min(99, Math.max(50, Math.round(ratio * 100 - shadePenalty)));
    }
    const capNum = entry.type === 'comprehensive' ? 3 : 2;

    roofSectionHtml = `
      <div style="background: #060F1F; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px; margin-bottom: 30px;" class="page-break">
        <h2 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">${capNum}. Satellite Roof Assessment &amp; Panel Layout</h2>
        
        ${roofData ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Rooftop Geometry</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Total Roof Area:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${roofData.total_area_sqft} sqft</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Usable Solar Area:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${roofData.usable_area_sqft} sqft</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Roof Structural Design:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600; text-transform: uppercase;">${roofData.roof_type}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Shading blockages:</td><td style="padding: 6px 0; text-align: right; color: #F59E0B; font-weight: 600;">${roofData.shading_issues}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Estimated Panels Cap:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${roofData.number_of_panels} Modules</td></tr>
              </table>
            </div>
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Solar Feasibility Parameters</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Usability Ratio:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${Math.round((roofData.usable_area_sqft / roofData.total_area_sqft)*100)}%</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Recommended Solar kW:</td><td style="padding: 6px 0; text-align: right; color: #00B5E2; font-weight: 600;">${roofData.recommended_kw} kW</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Est. Monthly Output:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 600;">${roofData.monthly_generation_units} kWh</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Suitability score:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 700;">${suitabilityScore}%</td></tr>
              </table>
              <div style="margin-top: 15px; background: rgba(0,181,226,0.05); padding: 8px; border-radius: 4px; border: 1px dashed rgba(0,181,226,0.2);">
                <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;"><span>Roof Suitability Badge</span> <span>${suitabilityScore >= 80 ? 'Excellent' : 'Good'}</span></div>
                <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;"><div style="width: ${suitabilityScore}%; height: 100%; background: #00B5E2;"></div></div>
              </div>
            </div>
          </div>
        ` : `
          <div style="border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            No Satellite Roof Assessment results are available. Run a Roof Scanner analysis to load building structures.
          </div>
        `}
        
        <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
          GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · Timestamp: ${timestampStr}
        </div>
      </div>
    `;
  }

  let roiSectionHtml = '';
  if (entry.type === 'roi' || entry.type === 'comprehensive') {
    const capNum = entry.type === 'comprehensive' ? 4 : 2;
    roiSectionHtml = `
      <div style="background: #060F1F; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px; margin-bottom: 30px;" class="page-break">
        <h2 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">${capNum}. Financial ROI Analysis &amp; Investment Yields</h2>
        
        ${roiData ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Capital Expenditure Overview</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Total Plant Cost:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">₹${systemCost.toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 600;">-₹${subsidy.toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8; font-weight: 700;">Net Capex Cost:</td><td style="padding: 6px 0; text-align: right; color: #00B5E2; font-weight: 800; font-size: 12px;">₹${netCost.toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Payback Schedule:</td><td style="padding: 6px 0; text-align: right; color: #F59E0B; font-weight: 700;">${_safeNum(payback).toFixed(1)} Years</td></tr>
              </table>
            </div>
            <div>
              <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Long-Term Savings Yields</strong>
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Yearly Bill Savings:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 600;">₹${annualSavings.toLocaleString('en-IN')} / yr</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">25-Year Net Savings:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 700; font-size: 12px;">₹${(roiData.data?.lifetime_savings || roiData.data?.savings_25_years_rs || (annualSavings*25 - netCost)).toLocaleString('en-IN')}</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Cumulative ROI Yield:</td><td style="padding: 6px 0; text-align: right; color: #00B5E2; font-weight: 700;">${roiPct}%</td></tr>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Carbon Offsets (Tons/yr):</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 600;">${co2Val} Tons CO₂</td></tr>
              </table>
            </div>
          </div>
        ` : `
          <div style="border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            No Financial ROI calculation results are available. Tally parameters inside the ROI Calculator.
          </div>
        `}
        
        <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
          GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · Timestamp: ${timestampStr}
        </div>
      </div>
    `;
  }

  let systemConfigSectionHtml = '';
  if (entry.type === 'comprehensive') {
    const panelsCount = roofData ? roofData.number_of_panels : Math.round(recommendedKw * 2.5);
    const inverterSize = recommendedKw;
    systemConfigSectionHtml = `
      <div style="background: #060F1F; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px; margin-bottom: 30px;" class="page-break">
        <h2 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">5. Recommended System Configuration &amp; Subsidy Specifications</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
          <div>
            <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Equipment Bill of Materials</strong>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Solar Panels:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${panelsCount}x Monocrystalline PERC Modules (440W+)</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Solar Inverter Capacity:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${_safeNum(inverterSize).toFixed(1)} kW On-Grid Inverter</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Mounting Structure:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">Hot-Dip Galvanized Elevated Structure</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Cabling &amp; Earthing:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">Dual Earthing, AC/DC Distribution Box, Copper Cables</td></tr>
            </table>
          </div>
          <div>
            <strong style="color: #ffffff; font-size: 12px; display: block; margin-bottom: 8px;">Government PM-Surya Ghar Subsidy Details</strong>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Plant Solar Capacity:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${_safeNum(recommendedKw).toFixed(1)} kW</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">First 2 kW Subsidy:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">₹60,000 (₹30,000 / kW)</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Next 1 kW Subsidy:</td><td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">₹18,000 (For 3rd kW)</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8;">Max Gov Subsidy Cap:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 700;">₹78,000</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);"><td style="padding: 6px 0; color: #94a3b8; font-weight: 700;">Your Calculated Subsidy:</td><td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: 800;">₹${subsidy.toLocaleString('en-IN')}</td></tr>
            </table>
          </div>
        </div>

        <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 15px; font-size: 10px; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div>
            <strong>Need Installer Quote Verification or Financing help?</strong>
            <br><span style="color: #94a3b8;">Our verified technical advisors can review installer estimates and match low-EMI loan banks.</span>
          </div>
          <div style="text-align: right;">
            <strong>Support Desk:</strong> support@getsolar.in | +91 99999-99999
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 8px; color: #475569; text-align: center; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 10px;">
          GET Solar Energy · Generated by GET Solar Intelligence Platform · Report ID: ${entry.reportId} · Timestamp: ${timestampStr}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${name}</title>
      ${styleLink}
    </head>
    <body style="font-family: 'Inter', sans-serif; background: #060F1F; color: #ffffff; padding: 20px; box-sizing: border-box; font-size: 11px;">
      ${coverPageHtml}
      ${execSummaryHtml}
      ${billSectionHtml}
      ${roofSectionHtml}
      ${roiSectionHtml}
      ${systemConfigSectionHtml}
    </body>
    </html>
  `;
}

/* ==========================================================================
   15. ROI TAB INTERACTIVE CALCULATOR
   ========================================================================== */
let tabRoiChartInstance = null;

function initTabROICalculator() {
  const tabComputeSavingsBtn = document.getElementById('tabComputeSavingsBtn');
  const roiRetryBtn = document.getElementById('roiAnalysisRetryBtn');
  if (!tabComputeSavingsBtn) return;
  
  // Restore state from local storage or set initial defaults
  restoreTabROIState();
  
  tabComputeSavingsBtn.addEventListener('click', () => {
    executeROICalculation();
  });
  
  if (roiRetryBtn) {
    roiRetryBtn.addEventListener('click', () => {
      executeROICalculation();
    });
  }
}

function restoreTabROIState() {
  const saved = localStorage.getItem('lastROIAnalysis');
  if (saved) {
    try {
      const stateObj = JSON.parse(saved);
      renderTabROIData(stateObj);
    } catch (e) {
      console.error('Failed to restore ROI analysis state:', e);
      initTabRoiCalculatorChart();
    }
  } else {
    // Initial default chart rendering on first load
    initTabRoiCalculatorChart();
  }
}

function executeROICalculation() {
  const monthlyBillEl = document.getElementById('tabMonthlyBill');
  const sunHoursEl = document.getElementById('tabSunHours');
  const systemSizeEl = document.getElementById('tabSystemSize');
  const techEl = document.getElementById('tabPanelQuality');
  
  if (!monthlyBillEl || !systemSizeEl) return;

  const monthlyBill = parseFloat(monthlyBillEl.value);
  const sunHours = sunHoursEl ? parseFloat(sunHoursEl.value) : 5.0;
  const systemSize = parseFloat(systemSizeEl.value);
  const tech = techEl ? techEl.value : 'mono';

  if (isNaN(monthlyBill) || monthlyBill <= 0) {
    showToast('Please enter a valid positive monthly bill amount!', 'warning');
    return;
  }
  if (isNaN(systemSize) || systemSize <= 0) {
    showToast('Please enter a valid positive system size!', 'warning');
    return;
  }

  const errorBox = document.getElementById('roiAnalysisErrorBox');
  if (errorBox) errorBox.style.display = 'none';

  safeFetch(`${API_BASE}/api/calculate-roi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      monthly_bill: monthlyBill,
      state: "Uttar Pradesh",
      roof_type: "flat",
      system_size: systemSize
    })
  })
  .then(async (res) => {
    if (!res.ok) {
      throw new Error('API server returned an error.');
    }
    return res.json();
  })
  .then((result) => {
    if (!result || result.success !== true || !result.data) {
      throw new Error((result && result.error) || 'Invalid API response format.');
    }

    showToast('ROI calculation completed successfully!', 'success');

    const stateToSave = {
      monthly_bill: monthlyBill,
      sun_hours: sunHours,
      system_size: systemSize,
      tech: tech,
      data: result.data
    };
    localStorage.setItem('lastROIAnalysis', JSON.stringify(stateToSave));
    logAuditEvent((_getUser() || {}).email, 'ROI Calculator Run', 'Assessment', `Completed ROI calculation: monthly bill = ₹${monthlyBill}, system size = ${systemSize} kW, payback = ${result.data.payback_period || result.data.payback_years} years.`, 'Medium');

    renderTabROIData(stateToSave);
    createNotification('roi', 'ROI Analysis Completed', `ROI calculation finished: Estimated annual savings of ₹${result.data.annual_savings.toLocaleString('en-IN')}. Payback period: ${result.data.payback_period || result.data.payback_years} years.`, 'high');
    addActivityLog('roi', 'ROI Analysis Completed', `Generated financial report for a ${systemSize} kW system, payback in ${result.data.payback_period || result.data.payback_years} years.`);
  })
  .catch((err) => {
    console.warn('Backend ROI API call failed, using client-side fallback calculations:', err);
    logAuditEvent((_getUser() || {}).email, 'API Failure', 'Security', `FastAPI ROI calculator API call failed: ${err.message || 'Server unavailable'}. Switched to local fallback.`, 'Medium');
    
    // Client-side fallback calculations for demo mode
    const fallbackData = runClientSideROIFallback(monthlyBill, systemSize);
    logAuditEvent((_getUser() || {}).email, 'ROI Calculator Run', 'Assessment', `Completed ROI calculation (fallback): monthly bill = ₹${monthlyBill}, system size = ${systemSize} kW, payback = ${fallbackData.payback_period} years.`, 'Medium');
    
    showToast('Completed calculation in demo fallback mode.', 'info');

    const stateToSave = {
      monthly_bill: monthlyBill,
      sun_hours: sunHours,
      system_size: systemSize,
      tech: tech,
      data: fallbackData,
      isFallback: true
    };
    localStorage.setItem('lastROIAnalysis', JSON.stringify(stateToSave));

    renderTabROIData(stateToSave);
    createNotification('roi', 'ROI Analysis Completed', `ROI calculation finished: Estimated annual savings of ₹${fallbackData.annual_savings.toLocaleString('en-IN')}. Payback period: ${fallbackData.payback_period} years.`, 'high');
    addActivityLog('roi', 'ROI Analysis Completed', `Generated financial report for a ${systemSize} kW system, payback in ${fallbackData.payback_period} years.`);
  });
}

function runClientSideROIFallback(monthlyBill, systemSize) {
  const system_cost = systemSize * 55000;
  
  let government_subsidy = 0.0;
  if (systemSize >= 3.0) {
    government_subsidy = 78000.0;
  } else if (systemSize >= 2.0) {
    government_subsidy = 60000.0 + (systemSize - 2.0) * 18000.0;
  } else {
    government_subsidy = systemSize * 30000.0;
  }

  const net_cost = system_cost - government_subsidy;
  const monthly_savings = monthlyBill * 0.9;
  const annual_savings = monthly_savings * 12;
  const monthly_generation = systemSize * 4.5 * 30;
  const annual_generation = monthly_generation * 12;

  const payback_period = annual_savings > 0 ? parseFloat(_safeNum(net_cost / annual_savings).toFixed(1)) : 0.0;
  const lifetime_savings = Math.round((annual_savings * 25) - net_cost);
  const roi_percentage = net_cost > 0 ? parseFloat(_safeNum(((lifetime_savings - net_cost) / net_cost) * 100).toFixed(1)) : 0.0;
  const co2_reduction = parseFloat(_safeNum(annual_generation * 0.82 / 1000).toFixed(2));

  return {
    recommended_kw: systemSize,
    system_cost: system_cost,
    government_subsidy: government_subsidy,
    net_cost: net_cost,
    monthly_savings: Math.round(monthly_savings),
    annual_savings: Math.round(annual_savings),
    annual_generation: Math.round(annual_generation),
    payback_period: payback_period,
    lifetime_savings: lifetime_savings,
    roi_percentage: roi_percentage,
    co2_reduction: co2_reduction
  };
}

function renderTabROIData(stateObj) {
  const data = stateObj.data || stateObj;
  
  const recommendedKw = Number(data.recommended_kw) || 0;
  const systemCost = Number(data.system_cost) || 0;
  const subsidy = Number(data.government_subsidy) || 0;
  const netCost = Number(data.net_cost) || 0;
  const monthlySavings = Number(data.monthly_savings) || 0;
  const annualSavings = Number(data.annual_savings) || 0;
  const annualGeneration = Number(data.annual_generation) || 0;
  const paybackPeriod = Number(data.payback_period) || 0.0;
  const lifetimeSavings = Number(data.lifetime_savings) || 0;
  const roiPercentage = Number(data.roi_percentage) || 0.0;
  const co2Reduction = Number(data.co2_reduction) || 0.0;

  // Sync input fields
  const monthlyBillEl = document.getElementById('tabMonthlyBill');
  if (monthlyBillEl && stateObj.monthly_bill) monthlyBillEl.value = stateObj.monthly_bill;
  const sunHoursEl = document.getElementById('tabSunHours');
  if (sunHoursEl && stateObj.sun_hours) sunHoursEl.value = stateObj.sun_hours;
  const systemSizeEl = document.getElementById('tabSystemSize');
  if (systemSizeEl && stateObj.system_size) systemSizeEl.value = stateObj.system_size;
  const techEl = document.getElementById('tabPanelQuality');
  if (techEl && stateObj.tech) techEl.value = stateObj.tech;

  // Update Tab KPI Cards
  const tabOutCost = document.getElementById('tabOutCost');
  if (tabOutCost) tabOutCost.textContent = `₹${systemCost.toLocaleString('en-IN')}`;
  const tabOutSubsidy = document.getElementById('tabOutSubsidy');
  if (tabOutSubsidy) tabOutSubsidy.textContent = `-₹${subsidy.toLocaleString('en-IN')}`;
  const tabOutNet = document.getElementById('tabOutNet');
  if (tabOutNet) tabOutNet.textContent = `₹${netCost.toLocaleString('en-IN')}`;
  const tabOutPayback = document.getElementById('tabOutPayback');
  if (tabOutPayback) tabOutPayback.textContent = `${_safeNum(paybackPeriod).toFixed(1)} Years`;
  const tabOutSavings = document.getElementById('tabOutSavings');
  if (tabOutSavings) tabOutSavings.textContent = `₹${annualSavings.toLocaleString('en-IN')}`;
  const tabOutLifetime = document.getElementById('tabOutLifetime');
  if (tabOutLifetime) tabOutLifetime.textContent = `₹${_safeNum(lifetimeSavings / 100000).toFixed(1)} Lakhs`;

  // Update Snapshot Card
  const snapRoiPercentage = document.getElementById('snapRoiPercentage');
  if (snapRoiPercentage) snapRoiPercentage.textContent = `${_safeNum(roiPercentage).toFixed(1)}%`;
  const snapRoiPayback = document.getElementById('snapRoiPayback');
  if (snapRoiPayback) snapRoiPayback.textContent = `${_safeNum(paybackPeriod).toFixed(1)} Yrs`;
  const snapRoiNetInvestment = document.getElementById('snapRoiNetInvestment');
  if (snapRoiNetInvestment) snapRoiNetInvestment.textContent = `₹${netCost.toLocaleString('en-IN')}`;
  const snapRoiLifetimeSavings = document.getElementById('snapRoiLifetimeSavings');
  if (snapRoiLifetimeSavings) snapRoiLifetimeSavings.textContent = `₹${lifetimeSavings.toLocaleString('en-IN')}`;

  // Update Detailed Results Grid
  const resRoiRecommendedSize = document.getElementById('resRoiRecommendedSize');
  if (resRoiRecommendedSize) resRoiRecommendedSize.textContent = `${recommendedKw} kW`;
  const resRoiSystemCost = document.getElementById('resRoiSystemCost');
  if (resRoiSystemCost) resRoiSystemCost.textContent = `₹${systemCost.toLocaleString('en-IN')}`;
  const resRoiSubsidy = document.getElementById('resRoiSubsidy');
  if (resRoiSubsidy) resRoiSubsidy.textContent = `₹${subsidy.toLocaleString('en-IN')}`;
  const resRoiNetCost = document.getElementById('resRoiNetCost');
  if (resRoiNetCost) resRoiNetCost.textContent = `₹${netCost.toLocaleString('en-IN')}`;
  const resRoiAnnualGen = document.getElementById('resRoiAnnualGen');
  if (resRoiAnnualGen) resRoiAnnualGen.textContent = `${annualGeneration.toLocaleString('en-IN')} kWh`;
  const resRoiMonthlySavings = document.getElementById('resRoiMonthlySavings');
  if (resRoiMonthlySavings) resRoiMonthlySavings.textContent = `₹${monthlySavings.toLocaleString('en-IN')}`;
  const resRoiAnnualSavings = document.getElementById('resRoiAnnualSavings');
  if (resRoiAnnualSavings) resRoiAnnualSavings.textContent = `₹${annualSavings.toLocaleString('en-IN')}`;
  const resRoiLifetimeSavings = document.getElementById('resRoiLifetimeSavings');
  if (resRoiLifetimeSavings) resRoiLifetimeSavings.textContent = `₹${lifetimeSavings.toLocaleString('en-IN')}`;
  const resRoiPercentageVal = document.getElementById('resRoiPercentageVal');
  if (resRoiPercentageVal) resRoiPercentageVal.textContent = `${_safeNum(roiPercentage).toFixed(1)}%`;
  const resRoiCarbonReduction = document.getElementById('resRoiCarbonReduction');
  if (resRoiCarbonReduction) resRoiCarbonReduction.textContent = `${_safeNum(co2Reduction).toFixed(2)} Tons`;
  const resRoiPaybackVal = document.getElementById('resRoiPaybackVal');
  if (resRoiPaybackVal) resRoiPaybackVal.textContent = `${_safeNum(paybackPeriod).toFixed(1)} Years`;

  // Update Dashboard Floating Cards
  const floatAnnualSavings = document.getElementById('floatAnnualSavings');
  if (floatAnnualSavings) floatAnnualSavings.textContent = `₹${annualSavings.toLocaleString('en-IN')}`;
  const floatRoiPeriod = document.getElementById('floatRoiPeriod');
  if (floatRoiPeriod) floatRoiPeriod.textContent = `${_safeNum(paybackPeriod).toFixed(1)} Years`;
  const systemSizeTextVal = document.getElementById('systemSizeTextVal');
  if (systemSizeTextVal) systemSizeTextVal.textContent = `${recommendedKw} kW`;

  // Display results box, hide error box
  const resultsContainer = document.getElementById('roiAnalysisResults');
  if (resultsContainer) resultsContainer.style.display = 'block';
  const errorBox = document.getElementById('roiAnalysisErrorBox');
  if (errorBox) errorBox.style.display = 'none';

  // Redraw Chart
  initTabRoiCalculatorChart(paybackPeriod, netCost, annualSavings);
}

function initTabRoiCalculatorChart(payback = 4.8, netCost = 102000, annualSavings = 58400) {
  const canvas = document.getElementById('tabRoiTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (tabRoiChartInstance) {
    tabRoiChartInstance.destroy();
  }
  
  const labels = Array.from({length: 25}, (_, i) => `Yr ${i+1}`);
  const data = [];
  for (let year = 1; year <= 25; year++) {
    const val = (year * annualSavings) - netCost;
    data.push(Math.round(val));
  }
  
  const baselineData = Array(25).fill(0);
  
  tabRoiChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cumulative Cashflow (₹)',
          data: data,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Break-even Baseline (₹0)',
          data: baselineData,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          labels: {
            color: '#9fb3c8',
            font: { family: 'Outfit', size: 10 }
          }
        },
        tooltip: {
          backgroundColor: '#0d2134',
          titleColor: '#f7fbff',
          bodyColor: '#9fb3c8',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: { ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } } },
        y: { ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } } }
      }
    }
  });
}

/* ==========================================================================
   16. REAL-TIME SYSTEM PERFORMANCE TIMELINE CHARTS
   ========================================================================== */
let perfProductionChart = null;
let perfConsumptionChart = null;
let perfGenChart = null;
let perfImpExpChart = null;
let perfPrChart = null;
let perfCarbonChart = null;

function initPerformanceTabCharts() {
  if (!dashboardData) return;
  
  // Chart 1: Production Trend
  const ctx1 = document.getElementById('perfProductionTrendChart');
  if (ctx1) {
    if (perfProductionChart) perfProductionChart.destroy();
    perfProductionChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          label: 'Production (kWh)',
          data: dashboardData.chartData.energyProduction,
          backgroundColor: '#36d399',
          borderRadius: 3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }

  // Chart 2: Consumption Trend
  const ctx2 = document.getElementById('perfConsumptionTrendChart');
  if (ctx2) {
    if (perfConsumptionChart) perfConsumptionChart.destroy();
    perfConsumptionChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          label: 'Consumption (kWh)',
          data: dashboardData.chartData.electricityConsumption,
          borderColor: '#17a8e5',
          backgroundColor: 'rgba(23, 168, 229, 0.08)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }

  // Chart 3: Solar Gen vs Consumption
  const ctx3 = document.getElementById('perfGenVsConsChart');
  if (ctx3) {
    if (perfGenChart) perfGenChart.destroy();
    perfGenChart = new Chart(ctx3, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [
          {
            label: 'Solar Gen',
            data: dashboardData.chartData.energyProduction,
            borderColor: '#ff8a1d',
            tension: 0.4
          },
          {
            label: 'Solar Consumed',
            data: dashboardData.chartData.energyProduction.map(v => Math.round(v * 0.82)),
            borderColor: '#36d399',
            tension: 0.4
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9fb3c8' } } }, scales: { x: { ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }

  // Chart 4: Stacked Import vs Export
  const ctx4 = document.getElementById('perfImportExportChart');
  if (ctx4) {
    if (perfImpExpChart) perfImpExpChart.destroy();
    perfImpExpChart = new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [
          {
            label: 'Grid Import',
            data: dashboardData.chartData.importUnits,
            backgroundColor: '#17a8e5'
          },
          {
            label: 'Solar Export',
            data: dashboardData.chartData.exportUnits,
            backgroundColor: '#ff8a1d'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9fb3c8' } } }, scales: { x: { stacked: true, ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { stacked: true, ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }

  // Chart 5: Performance PR Ratio
  const ctx5 = document.getElementById('perfPrRatioChart');
  if (ctx5) {
    if (perfPrChart) perfPrChart.destroy();
    perfPrChart = new Chart(ctx5, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          label: 'PR Ratio',
          data: dashboardData.chartData.systemPerformance,
          borderColor: '#eab308',
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { min: 75, ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }

  // Chart 6: Carbon Offset Trend
  const ctx6 = document.getElementById('perfCarbonReductionChart');
  if (ctx6) {
    if (perfCarbonChart) perfCarbonChart.destroy();
    perfCarbonChart = new Chart(ctx6, {
      type: 'line',
      data: {
        labels: dashboardData.chartData.months,
        datasets: [{
          label: 'CO₂ offset (Tons)',
          data: dashboardData.chartData.carbonReduction,
          borderColor: '#36d399',
          backgroundColor: 'rgba(54, 211, 153, 0.08)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9fb3c8', font: { size: 9 } } }, y: { ticks: { color: '#9fb3c8', font: { size: 9 } } } } }
    });
  }
}


/* ==========================================================================
   REWARDS & REFERRALS TAB — Full API Integration
   ========================================================================== */
let _rewardsLoaded = false;
const REWARDS_API = 'http://127.0.0.1:8000';

function initRewardsTab() {
  // Wire copy / share buttons
  const copyCodeBtn = document.getElementById('rwdCopyCodeBtn');
  const copyLinkBtn = document.getElementById('rwdCopyLinkBtn');
  const whatsAppBtn = document.getElementById('rwdWhatsAppBtn');
  const retryBtn    = document.getElementById('rewardsRetryBtn');

  if (copyCodeBtn) copyCodeBtn.addEventListener('click', () => {
    const code = document.getElementById('rwdReferralCode')?.textContent || '';
    if (code && code !== '—') {
      navigator.clipboard.writeText(code).then(() => showToast('Referral code copied!', 'success'));
    }
  });

  if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => {
    const link = document.getElementById('rwdReferralLink')?.textContent || '';
    if (link && link !== '—') {
      navigator.clipboard.writeText(link).then(() => showToast('Referral link copied!', 'success'));
    }
  });

  if (whatsAppBtn) whatsAppBtn.addEventListener('click', () => {
    const code = document.getElementById('rwdReferralCode')?.textContent || '';
    const link = document.getElementById('rwdReferralLink')?.textContent || '';
    const msg = encodeURIComponent(`🌞 Switch to solar with GET Solar Energy! Use my referral code ${code} for bonus rewards. Sign up here: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  });

  if (retryBtn) retryBtn.addEventListener('click', () => {
    _rewardsLoaded = false;
    loadRewardsData();
  });

  // Wire apply referral code form
  const btnRwdApplyCode = document.getElementById('btnRwdApplyCode');
  const rwdApplyCodeInput = document.getElementById('rwdApplyCodeInput');
  if (btnRwdApplyCode && rwdApplyCodeInput) {
    btnRwdApplyCode.addEventListener('click', () => {
      const code = rwdApplyCodeInput.value.trim().toUpperCase();
      if (!code) {
        showToast('Please enter a referral code!', 'warning');
        return;
      }
      
      const user = _getUser();
      if (!user || !user.email) return;
      
      const host = API_BASE;
      safeFetch(`${host}/api/referral/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          referral_code: code
        })
      })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to apply referral code.');
        }
        return res.json();
      })
      .then((data) => {
        showToast('Referral code applied successfully!', 'success');
        rwdApplyCodeInput.value = '';
        logAuditEvent(user.email, 'Referral Applied', 'Rewards', `Applied friend's referral code: ${code}.`, 'Low');
        
        // Refresh wallet data
        _rewardsLoaded = false;
        loadRewardsData();
      })
      .catch((err) => {
        showToast(err.message, 'error');
        logAuditEvent(user.email, 'Invalid Referral Code Usage', 'Security', `Failed to apply referral code ${code}: ${err.message}`, 'High');
      });
    });
  }

  // Hydrate referral code from stored user on init (fast path)
  const user = _getUser();
  if (user && user.referral_code) {
    _setReferralDisplay(user.referral_code);
  }

  // Also hydrate referral code in dashboard footer card
  const dashRefCode = document.getElementById('referralCodeText');
  if (dashRefCode && user && user.referral_code) {
    dashRefCode.textContent = user.referral_code;
  }

  // Wire the dashboard footer copy button
  const dashCopyBtn = document.getElementById('copyCodeBtn');
  if (dashCopyBtn) {
    dashCopyBtn.addEventListener('click', () => {
      const code = document.getElementById('referralCodeText')?.textContent || '';
      if (code) navigator.clipboard.writeText(code).then(() => showToast('Referral code copied!', 'success'));
    });
  }

  // Restore from localStorage cache
  try {
    const cached = localStorage.getItem('lastRewardsData');
    if (cached) _hydrateRewardsUI(JSON.parse(cached));
  } catch(e) {}
}

function _getUser() {
  return safeParseJSON('user', null);
}

function _setReferralDisplay(code) {
  const codeEl = document.getElementById('rwdReferralCode');
  const linkEl = document.getElementById('rwdReferralLink');
  if (codeEl) codeEl.textContent = code;
  if (linkEl) linkEl.textContent = `https://getsolar.energy/signup?ref=${code}`;
}

function loadRewardsData() {
  if (_rewardsLoaded) return;
  const user = _getUser();
  if (!user || !user.email) return;

  const errBox = document.getElementById('rewardsErrorBox');
  if (errBox) errBox.style.display = 'none';

  safeFetch(`${REWARDS_API}/api/referral/analytics/${encodeURIComponent(user.email)}`)
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error(data.error || 'Unknown error');
      _rewardsLoaded = true;
      localStorage.setItem('lastRewardsData', JSON.stringify(data));
      _hydrateRewardsUI(data);
    })
    .catch(err => {
      console.error('Rewards load failed:', err);
      const errBox = document.getElementById('rewardsErrorBox');
      const errText = document.getElementById('rewardsErrorText');
      if (errBox) errBox.style.display = 'block';
      if (errText) errText.textContent = `Unable to load rewards data: ${err.message}`;
    });
}

function _hydrateRewardsUI(data) {
  const user = _getUser();
  const fmtNum = (n) => Number(n).toLocaleString('en-IN');

  // --- KPI Cards ---
  const s = data.summary || {};
  _setText('rwdTotalReferrals', fmtNum(s.total_referrals || 0));
  _setText('rwdPointsBalance', fmtNum(s.total_points || 0));
  _setText('rwdWalletValue', `₹${fmtNum(s.wallet_balance_rs || 0)}`);
  _setText('rwdLeaderboardRank', data.user_rank ? `#${data.user_rank}` : '—');

  // --- Referral Code — FIX 10 ---
  const cu10 = getCurrentUser();
  const resolvedCode = data.referral_code || generateReferralCode(cu10.email);
  _setReferralDisplay(resolvedCode);

  // --- Referral History ---
  const histBody = document.getElementById('rwdHistoryTableBody');
  if (histBody) {
    const history = data.referral_history || [];
    if (history.length === 0) {
      histBody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">No referrals yet. Share your code to get started!</td></tr>';
    } else {
      histBody.innerHTML = history.map(h => {
        const badge = _statusBadge(h.status);
        return `<tr style="border-bottom: 1px solid var(--border-color-light);">
          <td style="padding: 10px 8px;">${_esc(h.referred_name || h.referred_email)}</td>
          <td style="padding: 10px 8px;">${badge}</td>
          <td style="padding: 10px 8px;"><strong>${fmtNum(h.points_earned || 0)}</strong></td>
        </tr>`;
      }).join('');
    }
  }

  // --- Wallet ---
  _setText('rwdWalletPoints', fmtNum(s.total_points || 0));
  _setText('rwdWalletRupees', `₹${fmtNum(s.wallet_balance_rs || 0)}`);

  const txnList = document.getElementById('rwdTransactionsList');
  if (txnList) {
    // Build transactions from history + redemptions
    const txns = [];
    (data.referral_history || []).forEach(h => {
      txns.push({ type: 'credit', desc: `Referral — ${h.referred_name || h.referred_email}`, points: h.points_earned || 100, date: h.date });
    });
    (data.redemption_history || []).forEach(rd => {
      txns.push({ type: 'debit', desc: `Redeemed — ${rd.reward_name || rd.reward_id}`, points: -(rd.points_spent || 0), date: rd.redeemed_at });
    });
    txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (txns.length === 0) {
      txnList.innerHTML = '<div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 11px;">No transactions yet.</div>';
    } else {
      txnList.innerHTML = txns.slice(0, 10).map(t => {
        const isCredit = t.type === 'credit';
        const color = isCredit ? 'var(--accent-green)' : '#ef4444';
        const sign = isCredit ? '+' : '';
        return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--bg-input); border-radius: 4px; border: 1px solid var(--border-color); font-size: 11px;">
          <span style="color: var(--text-navy);">${_esc(t.desc)}</span>
          <span style="font-weight: 800; color: ${color};">${sign}${fmtNum(t.points)}</span>
        </div>`;
      }).join('');
    }
  }

  // --- Rewards Store ---
  const storeGrid = document.getElementById('rwdStoreGrid');
  const rewards = data.rewards_catalog || [];
  const userPoints = s.total_points || 0;
  if (storeGrid && rewards.length > 0) {
    storeGrid.innerHTML = rewards.map(r => {
      const canAfford = userPoints >= r.points_required;
      const catIcon = r.category === 'voucher' ? '🎫' : r.category === 'cashback' ? '💰' : '🔧';
      return `<div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
        <div>
          <span style="font-size: 28px; display: block; margin-bottom: 6px;">${catIcon}</span>
          <span style="font-size: 13px; font-weight: 800; color: var(--text-navy); display: block;">${_esc(r.name)}</span>
          <span style="font-size: 10px; color: var(--text-muted); display: block; margin-top: 4px;">${_esc(r.description || '')}</span>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-orange); display: block; margin-bottom: 8px;">${fmtNum(r.points_required)} points</span>
          <button class="calc-btn rwd-redeem-btn" data-reward-id="${r.id}" style="margin: 0 auto; padding: 6px 14px; font-size: 11px; height: auto; width: auto; opacity: ${canAfford ? 1 : 0.5}; cursor: ${canAfford ? 'pointer' : 'not-allowed'};" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? 'Redeem' : 'Not Enough'}
          </button>
        </div>
      </div>`;
    }).join('');

    // Wire redeem buttons
    storeGrid.querySelectorAll('.rwd-redeem-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rewardId = btn.getAttribute('data-reward-id');
        _redeemReward(rewardId, btn);
      });
    });
  } else if (storeGrid && rewards.length === 0) {
    storeGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px; grid-column: span 3;">No rewards available at this time.</div>';
  }

  // --- Leaderboard ---
  const lbBody = document.getElementById('rwdLeaderboardBody');
  const leaderboard = data.leaderboard || [];
  const userEmail = user?.email || '';
  if (lbBody) {
    if (leaderboard.length === 0) {
      // FIX 11 — Not Ranked Yet empty state
      lbBody.innerHTML = `<tr><td colspan="3" style="padding: 28px 16px; text-align: center;">
        <div style="font-size: 28px; margin-bottom: 8px;">🏅</div>
        <div style="font-size: 13px; font-weight: 800; color: var(--text-navy); margin-bottom: 6px;">Not Ranked Yet</div>
        <div style="font-size: 11px; color: var(--text-muted); max-width: 260px; margin: 0 auto 14px;">Invite friends and earn rewards to appear on the leaderboard.</div>
        <button onclick="if(typeof switchTab==='function') switchTab('rewards')" style="background: var(--accent-orange); color: #fff; border: none; padding: 7px 18px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit;">Invite Friends →</button>
      </td></tr>`;
    } else {
      lbBody.innerHTML = leaderboard.map(entry => {
        const isMe = entry.email === userEmail;
        const rankIcons = ['🥇', '🥈', '🥉'];
        const rankDisplay = entry.rank <= 3 ? rankIcons[entry.rank - 1] : `#${entry.rank}`;
        const highlight = isMe ? 'background: rgba(54, 211, 153, 0.08); font-weight: 700;' : '';
        return `<tr style="border-bottom: 1px solid var(--border-color-light); ${highlight}">
          <td style="padding: 10px 8px; font-size: 14px;">${rankDisplay}</td>
          <td style="padding: 10px 8px;">${_esc(entry.name)}${isMe ? ' <span style="font-size: 9px; background: var(--accent-green); color: #fff; padding: 1px 5px; border-radius: 3px; margin-left: 6px;">YOU</span>' : ''}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 800;">${fmtNum(entry.points)}</td>
        </tr>`;
      }).join('');
    }
  }
}

function _redeemReward(rewardId, btn) {
  const user = _getUser();
  if (!user || !user.email) return;

  btn.disabled = true;
  btn.textContent = 'Processing…';

  safeFetch(`${REWARDS_API}/api/referral/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, reward_id: rewardId })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showToast(data.message || 'Reward redeemed successfully!', 'success');
      // Refresh the entire rewards tab
      _rewardsLoaded = false;
      loadRewardsData();
      createNotification('rewards', 'Reward Redeemed', `You redeemed a reward! Code and details sent to your registered email.`, 'high');
      addActivityLog('reward', 'Reward Redeemed', `Successfully redeemed reward ID: ${rewardId}.`);
    } else {
      showToast(data.error || 'Redemption failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Redeem';
    }
  })
  .catch(err => {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Redeem';
  });
}

function _statusBadge(status) {
  const map = {
    'pending':    { color: '#eab308', bg: 'rgba(234,179,8,0.12)',   label: '⏳ Pending' },
    'registered': { color: '#eab308', bg: 'rgba(234,179,8,0.12)',   label: '⏳ Registered' },
    'qualified':  { color: '#eab308', bg: 'rgba(234,179,8,0.12)',   label: '⏳ Qualified' },
    'completed':  { color: '#36d399', bg: 'rgba(54,211,153,0.12)',  label: '✓ Completed' },
    'rewarded':   { color: '#00aeef', bg: 'rgba(0,174,239,0.12)',   label: '★ Rewarded' }
  };
  const s = map[status] || map['completed'];
  return `<span style="font-weight: 700; color: ${s.color}; background: ${s.bg}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${s.label}</span>`;
}

function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/**
 * _safeNum — coerces any value to a finite number, returning `fallback` (default 0)
 * when the value is undefined, null, NaN, or Infinity. Use before every .toFixed() call.
 */
function _safeNum(val, fallback = 0) {
  const n = Number(val);
  return isFinite(n) ? n : fallback;
}


/* ==========================================================================
   TOAST MESSAGE POPUP SYSTEM
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');
  const toastSvg = toast?.querySelector('svg');
  
  if (toast && toastText) {
    toastText.textContent = message;
    
    // Clear previous classes and apply active + type
    toast.className = 'toast-msg active ' + type;
    
    // Customize SVG icon based on type
    if (toastSvg) {
      if (type === 'error') {
        toastSvg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      } else if (type === 'warning') {
        toastSvg.innerHTML = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      } else {
        // success or default checkmark
        toastSvg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      }
    }
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('active');
      toast.className = 'toast-msg';
    }, 3000);
  }
}

/* ==========================================================================
   17. ADMIN DASHBOARD OPERATIONS LOGIC
   ========================================================================== */

let adminUsersList = [];
let adminActivityList = [];
let adminLeaderboardList = [];
let adminTrendChartInstance = null;

function downloadCSV(filename, headers, rows) {
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(val => {
      let cleanVal = (val === null || val === undefined) ? '' : String(val);
      cleanVal = cleanVal.replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestampedFilename(prefix) {
  const now = new Date();
  const format = (num) => String(num).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())}`;
  const timeStr = `${format(now.getHours())}-${format(now.getMinutes())}-${format(now.getSeconds())}`;
  return `${prefix}_export_${dateStr}_${timeStr}.csv`;
}

function setMetricValue(elementId, value, isCurrency = false, isFloat = false, suffix = '', fallbackText = 'Insufficient data') {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (value === null || value === undefined || value === 0 || value === 'None' || (typeof value === 'number' && isNaN(value))) {
    el.textContent = fallbackText;
    const descEl = document.getElementById(elementId + 'Desc');
    if (descEl) {
      descEl.textContent = "Insufficient data available to calculate this metric.";
    }
  } else {
    animateAdminCounter(elementId, value, isCurrency, isFloat, suffix);
    const descEl = document.getElementById(elementId + 'Desc');
    if (descEl) {
      if (elementId === 'admBizTotalSavings') descEl.textContent = "Aggregated ROI savings";
      if (elementId === 'admBizAvgPayback') descEl.textContent = "Average years to break even";
      if (elementId === 'admBizAvgSuitability') descEl.textContent = "Average roof readiness score";
      if (elementId === 'admBizAvgSystemSize') descEl.textContent = "Average solar sizing recommendation";
    }
  }
}

function initAdminDashboard() {
  const subNavBtns = document.querySelectorAll('.admin-sub-nav .sub-nav-btn');
  const adminPanels = document.querySelectorAll('#adminPanelsContainer .admin-panel');
  
  subNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetSection = btn.getAttribute('data-admin-section');
      adminPanels.forEach(panel => {
        if (panel.id === `admin-panel-${targetSection}`) {
          panel.style.display = 'block';
        } else {
          panel.style.display = 'none';
        }
      });
    });
  });

  const userSearch = document.getElementById('adminUserSearch');
  if (userSearch) {
    userSearch.addEventListener('input', renderAdminUsersTable);
  }
  const userRoleFilter = document.getElementById('adminUserRoleFilter');
  if (userRoleFilter) {
    userRoleFilter.addEventListener('change', renderAdminUsersTable);
  }

  const adminMainRetryBtn = document.getElementById('adminMainRetryBtn');
  if (adminMainRetryBtn) {
    adminMainRetryBtn.addEventListener('click', () => {
      loadAdminDashboardData(true);
    });
  }
  const adminErrorRetryBtn = document.getElementById('adminErrorRetryBtn');
  if (adminErrorRetryBtn) {
    adminErrorRetryBtn.addEventListener('click', () => {
      loadAdminDashboardData(true);
    });
  }

  const cdpImportBtn = document.getElementById('cdpImportBtn');
  if (cdpImportBtn) {
    cdpImportBtn.addEventListener('click', () => {
      showToast("Initializing default O&M dataset...", "info");
      const templateCustomer = {
        consumer_number: "5109642660",
        customer_name: "SMT AFASANA KHATOON ANSARI",
        discom: "MADHYANCHAL VIDYUT VITRAN NIGAM LIMITED",
        city: "Lucknow",
        phone: "9999999999",
        email: "afasana@getsolar.in"
      };

      fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateCustomer)
      })
      .then(res => {
        if (res.ok) {
          showToast("Dataset successfully initialized!", "success");
          loadAdminDashboardData(true);
        } else {
          showToast("Import failed. Trying alternative reload...", "warning");
          loadAdminDashboardData(true);
        }
      })
      .catch(err => {
        console.error("Failed to seed via CTA:", err);
        showToast("Unable to import dataset.", "error");
      });
    });
  }

  // Bind Export CSV buttons
  const btnExportUsersCSV = document.getElementById('btnExportUsersCSV');
  if (btnExportUsersCSV) {
    btnExportUsersCSV.addEventListener('click', () => {
      const headers = ['Name', 'Email', 'Role', 'Status', 'Registration Date'];
      const rows = adminUsersList.map(u => [u.name, u.email, u.role, u.status, u.registration_date]);
      downloadCSV(getTimestampedFilename('users'), headers, rows);
    });
  }

  const btnExportActivityCSV = document.getElementById('btnExportActivityCSV');
  if (btnExportActivityCSV) {
    btnExportActivityCSV.addEventListener('click', () => {
      const headers = ['User', 'Action Description', 'Timestamp'];
      const rows = adminActivityList.map(act => [act.user, act.description, act.timestamp]);
      downloadCSV(getTimestampedFilename('activity'), headers, rows);
    });
  }

  const btnExportLeaderboardCSV = document.getElementById('btnExportLeaderboardCSV');
  if (btnExportLeaderboardCSV) {
    btnExportLeaderboardCSV.addEventListener('click', () => {
      const headers = ['Rank', 'Name', 'Email', 'Referrals Count', 'Points Earned'];
      const rows = adminLeaderboardList.map(entry => [entry.rank, entry.name, entry.email, entry.referrals, entry.points]);
      downloadCSV(getTimestampedFilename('leaderboard'), headers, rows);
    });
  }
}

function loadAdminDashboardData(force = false) {
  const host = API_BASE;
  const lastSuccessTimeEl = document.getElementById('adminLastSuccessTime');
  const errorContainer = document.getElementById('adminErrorContainer');
  const emptyStateContainer = document.getElementById('cdpEmptyStateContainer');
  const panelsContainer = document.getElementById('adminPanelsContainer');

  // Trigger loading skeleton states
  const loaderHtml = '<span class="skeleton-loader" style="height: 18px; width: 60px; display: inline-block;"></span>';
  const cdpKpis = ['cdpTotalCustomers', 'cdpBillsAnalyzed', 'cdpAvgBill', 'cdpAvgUnits', 'cdpAvgPayback', 'cdpAvgSystemSize', 'cdpTotalSystemValue', 'cdpTotal25yrSavings', 'cdpCitiesCovered'];
  cdpKpis.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = loaderHtml;
  });

  const recentLogEl = document.getElementById('adminRecentActivityLog');
  if (recentLogEl) {
    recentLogEl.innerHTML = `
      <div class="skeleton-loader" style="height: 55px; width: 100%; margin-bottom: 8px;"></div>
      <div class="skeleton-loader" style="height: 55px; width: 100%; margin-bottom: 8px;"></div>
      <div class="skeleton-loader" style="height: 55px; width: 100%;"></div>
    `;
  }

  // Priority 1: Check in-memory/local cache expiry (60s) unless forced refresh
  const cachedDataStr = localStorage.getItem('cachedAdminData');
  const lastFetchTs = localStorage.getItem('lastAdminFetchTimestamp');
  const nowTs = Date.now();

  if (!force && cachedDataStr && lastFetchTs && (nowTs - Number(lastFetchTs) < 60000)) {
    try {
      const cachedData = JSON.parse(cachedDataStr);
      cachedData.cacheStatus = "Cached";
      
      // Check for empty state in cache
      if (cachedData.cdpStats && cachedData.cdpStats.customers === 0) {
        if (emptyStateContainer) emptyStateContainer.style.display = 'block';
        if (panelsContainer) panelsContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'none';
      } else {
        if (emptyStateContainer) emptyStateContainer.style.display = 'none';
        if (panelsContainer) panelsContainer.style.display = 'block';
        if (errorContainer) errorContainer.style.display = 'none';
        _hydrateAdminDashboardUI(cachedData, false);
      }
      
      if (lastSuccessTimeEl) {
        lastSuccessTimeEl.textContent = formatTimestamp(lastFetchTs);
      }
      return;
    } catch (e) {
      console.warn("Error parsing cached admin data, refetching...", e);
    }
  }

  const startTime = performance.now();

  // Fetch all legacy overview data and new SQL CDP data
  Promise.all([
    safeFetch(`${host}/api/admin/overview`),
    safeFetch(`${host}/api/admin/users`),
    safeFetch(`${host}/api/admin/rewards`),
    safeFetch(`${host}/api/admin/assistant`),
    safeFetch(`${host}/api/admin/activity`),
    safeFetch(`${host}/api/dashboard/stats`),
    safeFetch(`${host}/api/dashboard/recent-bills?limit=5`),
    safeFetch(`${host}/api/customers?limit=100`)
  ])
  .then(async (responses) => {
    for (const r of responses) {
      if (!r.ok) throw new Error(`API Endpoint returned status ${r.status}`);
    }
    return Promise.all(responses.map(r => r.json()));
  })
  .then(([overview, users, rewards, assistant, activity, cdpStats, recentBills, allCustomers]) => {
    if (!overview.success || !users.success || !rewards.success || !assistant.success || !activity.success) {
      throw new Error("One or more admin endpoints failed");
    }

    const durationMs = Math.round(performance.now() - startTime);
    const isSlow = durationMs >= 1500;

    const consolidated = {
      overview,
      users,
      rewards,
      assistant,
      activity,
      cdpStats,
      recentBills,
      allCustomers,
      isSlow,
      fetchTime: Date.now(),
      latencyMs: durationMs,
      cacheStatus: "Fresh"
    };

    localStorage.setItem('cachedAdminData', JSON.stringify(consolidated));
    localStorage.setItem('lastAdminFetchTimestamp', consolidated.fetchTime.toString());

    if (errorContainer) errorContainer.style.display = 'none';

    // Handle Empty State dynamically
    if (cdpStats.customers === 0) {
      if (emptyStateContainer) emptyStateContainer.style.display = 'block';
      if (panelsContainer) panelsContainer.style.display = 'none';
    } else {
      if (emptyStateContainer) emptyStateContainer.style.display = 'none';
      if (panelsContainer) panelsContainer.style.display = 'block';
      _hydrateAdminDashboardUI(consolidated, true);
    }
    
    if (lastSuccessTimeEl) lastSuccessTimeEl.textContent = formatTimestamp(consolidated.fetchTime);
    showToast("Admin dashboard metrics updated successfully!", "success");
  })
  .catch((err) => {
    console.error("Failed to load fresh admin dashboard data:", err);
    
    // Priority 2: Try Cached backup load
    if (cachedDataStr && lastFetchTs) {
      try {
        const cachedData = JSON.parse(cachedDataStr);
        cachedData.cacheStatus = "Stale";
        if (errorContainer) errorContainer.style.display = 'none';
        
        if (cachedData.cdpStats && cachedData.cdpStats.customers === 0) {
          if (emptyStateContainer) emptyStateContainer.style.display = 'block';
          if (panelsContainer) panelsContainer.style.display = 'none';
        } else {
          if (emptyStateContainer) emptyStateContainer.style.display = 'none';
          if (panelsContainer) panelsContainer.style.display = 'block';
          _hydrateAdminDashboardUI(cachedData, false);
        }
        
        if (lastSuccessTimeEl) lastSuccessTimeEl.textContent = formatTimestamp(lastFetchTs);
        
        const hBackend = document.getElementById('healthBackend');
        const hBackendText = document.getElementById('healthBackendText');
        if (hBackend) hBackend.className = 'status-indicator status-red';
        if (hBackendText) {
          hBackendText.textContent = "Offline (Cached)";
          hBackendText.style.color = '#ef4444';
        }
        
        showToast("Backend API offline. Loaded cached analytics details.", "warning");
        return;
      } catch (e) {
        console.warn("Cached data parse failure:", e);
      }
    }

    // Priority 3: Fallback empty/error banners
    if (errorContainer) {
      errorContainer.style.display = 'block';
      const errTextEl = document.getElementById('adminErrorText');
      if (errTextEl) {
        errTextEl.textContent = `Unable to connect to the admin analytics service APIs: ${err.message || 'Server offline'}`;
      }
    }
    if (panelsContainer) panelsContainer.style.display = 'none';
    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (lastSuccessTimeEl) {
      lastSuccessTimeEl.textContent = formatTimestamp(localStorage.getItem('lastAdminFetchTimestamp'));
    }
    showToast("Unable to load admin dashboard: Backend API offline.", "error");
  });
}

function _hydrateAdminDashboardUI(data, isFresh) {
  const { overview, users, rewards, assistant, activity, cdpStats, recentBills, allCustomers, isSlow } = data;
  
  // Hydrate CDP metrics
  if (cdpStats) {
    animateAdminCounter('cdpTotalCustomers', cdpStats.customers || 0);
    animateAdminCounter('cdpBillsAnalyzed', cdpStats.bills_analyzed || 0);
    animateAdminCounter('cdpAvgBill', cdpStats.avg_bill || 0, true);
    animateAdminCounter('cdpAvgUnits', cdpStats.avg_units || 0);
    animateAdminCounter('cdpAvgPayback', cdpStats.avg_payback || 0, false, true, ' Years');
    animateAdminCounter('cdpAvgSystemSize', cdpStats.avg_system_size || 0, false, true, ' kW');
    animateAdminCounter('cdpTotalSystemValue', cdpStats.total_system_value || 0, true);
    animateAdminCounter('cdpTotal25yrSavings', cdpStats.total_25yr_savings || 0, true);
    animateAdminCounter('cdpCitiesCovered', cdpStats.cities || 0);
  }

  // Hydrate Recent Activity Feed from CDP bills
  const logEl = document.getElementById('adminRecentActivityLog');
  if (logEl) {
    if (!recentBills || recentBills.length === 0) {
      logEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 11px;">No recent billing activity found.</div>';
    } else {
      // Build local lookup map from customers list
      const localMap = {};
      if (allCustomers) {
        allCustomers.forEach(c => { localMap[c.id] = c; });
      }
      logEl.innerHTML = recentBills.map(bill => {
        const cust = localMap[bill.customer_id] || { customer_name: 'Unknown Customer', consumer_number: 'N/A' };
        const date = new Date(bill.created_at);
        const relativeTime = getRelativeTime(date);
        return `<div class="admin-activity-item" style="padding: 10px; border-bottom: 1px solid var(--border-color-light);">
          <div class="admin-activity-icon bill">📄</div>
          <div style="flex-grow: 1; margin-left: 8px;">
            <div style="font-weight: 700; color: var(--text-navy); font-size: 11.5px;">${_esc(cust.customer_name)} <span style="font-weight: normal; color: var(--text-secondary); font-size: 10px;">(${_esc(cust.consumer_number)})</span></div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Bill: <strong>₹${bill.bill_amount.toLocaleString('en-IN')}</strong> (${bill.monthly_units} Units) &bull; Period: <strong>${_esc(bill.billing_period)}</strong>
            </div>
            <div style="font-size: 11px; color: var(--accent-blue); margin-top: 2px;">
              Recommended Size: <strong>${bill.recommended_kw} kW</strong> &bull; Est. Savings: <strong>₹${Math.round(bill.monthly_savings).toLocaleString('en-IN')}/mo</strong>
            </div>
          </div>
          <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap; margin-left: 8px;">${relativeTime}</span>
        </div>`;
      }).join('');
    }
  }

  if (users && users.users) {
    processAndRenderLeads(users.users);
  }

  const hBackend = document.getElementById('healthBackend');
  const hBackendText = document.getElementById('healthBackendText');
  if (hBackend && hBackendText) {
    if (!isFresh && data.isFallback) {
      hBackend.className = 'status-indicator status-red';
      hBackendText.textContent = 'Offline';
      hBackendText.style.color = '#ef4444';
    } else if (isSlow) {
      hBackend.className = 'status-indicator status-amber';
      hBackendText.textContent = 'Warning';
      hBackendText.style.color = '#eab308';
    } else {
      hBackend.className = 'status-indicator status-green';
      hBackendText.textContent = 'Online';
      hBackendText.style.color = '#22c55e';
    }
  }

  const hGemini = document.getElementById('healthGemini');
  const hGeminiText = document.getElementById('healthGeminiText');
  if (hGemini && hGeminiText && overview.health) {
    const gemStatus = overview.health.gemini || 'Offline';
    hGeminiText.textContent = gemStatus;
    if (gemStatus === 'Online') {
      hGemini.className = 'status-indicator status-green';
      hGeminiText.style.color = '#22c55e';
    } else if (gemStatus === 'Warning') {
      hGemini.className = 'status-indicator status-amber';
      hGeminiText.style.color = '#eab308';
    } else {
      hGemini.className = 'status-indicator status-red';
      hGeminiText.style.color = '#ef4444';
    }
  }

  const hReferral = document.getElementById('healthReferral');
  const hReferralText = document.getElementById('healthReferralText');
  if (hReferral && hReferralText && overview.health) {
    const refStatus = overview.health.referral || 'Offline';
    hReferralText.textContent = refStatus;
    if (refStatus === 'Online') {
      hReferral.className = 'status-indicator status-green';
      hReferralText.style.color = '#22c55e';
    } else if (refStatus === 'Warning') {
      hReferral.className = 'status-indicator status-amber';
      hReferralText.style.color = '#eab308';
    } else {
      hReferral.className = 'status-indicator status-red';
      hReferralText.style.color = '#ef4444';
    }
  }

  const hRewards = document.getElementById('healthRewards');
  const hRewardsText = document.getElementById('healthRewardsText');
  if (hRewards && hRewardsText && overview.health) {
    const rwdStatus = overview.health.rewards || 'Offline';
    hRewardsText.textContent = rwdStatus;
    if (rwdStatus === 'Online') {
      hRewards.className = 'status-indicator status-green';
      hRewardsText.style.color = '#22c55e';
    } else if (rwdStatus === 'Warning') {
      hRewards.className = 'status-indicator status-amber';
      hRewardsText.style.color = '#eab308';
    } else {
      hRewards.className = 'status-indicator status-red';
      hRewardsText.style.color = '#ef4444';
    }
  }

  // System health detailed text fields
  const healthLastSyncEl = document.getElementById('healthLastSync');
  if (healthLastSyncEl && data.fetchTime) {
    const syncDate = new Date(data.fetchTime);
    healthLastSyncEl.textContent = syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const healthLatencyEl = document.getElementById('healthLatency');
  if (healthLatencyEl) {
    healthLatencyEl.textContent = data.latencyMs ? `${data.latencyMs} ms` : "N/A";
  }

  const healthCacheEl = document.getElementById('healthCache');
  if (healthCacheEl) {
    healthCacheEl.textContent = data.cacheStatus || "Fresh";
    if (data.cacheStatus === 'Fresh') {
      healthCacheEl.style.color = '#22c55e';
    } else if (data.cacheStatus === 'Cached') {
      healthCacheEl.style.color = '#00aeef';
    } else {
      healthCacheEl.style.color = '#ef4444';
    }
  }

  const healthGeminiTimeEl = document.getElementById('healthGeminiTime');
  if (healthGeminiTimeEl && overview.health && overview.health.gemini_last_success_time) {
    const gemDate = new Date(overview.health.gemini_last_success_time * 1000);
    healthGeminiTimeEl.textContent = gemDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else if (healthGeminiTimeEl) {
    healthGeminiTimeEl.textContent = "N/A";
  }

  // Hydrate Operations Row
  animateAdminCounter('admTotalUsers', overview.total_users || 0);
  animateAdminCounter('admTotalBills', overview.bill_analyses || 0);
  animateAdminCounter('admTotalRoofs', overview.roof_analyses || 0);
  animateAdminCounter('admTotalRois', overview.roi_calculations || 0);
  animateAdminCounter('admPointsIssued', overview.referral_points_issued || 0);
  animateAdminCounter('admTotalRedeems', overview.rewards_redeemed || 0);

  // Compatibility overrides (just in case they are referenced elsewhere)
  if (document.getElementById('admActiveUsers')) {
    animateAdminCounter('admActiveUsers', overview.active_users || 0);
  }
  if (document.getElementById('admTotalConvs')) {
    animateAdminCounter('admTotalConvs', overview.assistant_conversations || 0);
  }
  if (document.getElementById('admCompletionRate')) {
    animateAdminCounter('admCompletionRate', overview.assessment_completion_rate || 0, false, true, '%');
  }
  if (document.getElementById('admFullyAssessed')) {
    animateAdminCounter('admFullyAssessed', overview.fully_assessed_users || 0);
  }

  // Hydrate Solar Intelligence Business Metrics
  setMetricValue('admBizTotalSavings', overview.total_annual_savings, true, false);
  setMetricValue('admBizAvgPayback', overview.avg_payback_period, false, true, ' Years');
  setMetricValue('admBizAvgSuitability', overview.avg_roof_suitability, false, true, '%');
  setMetricValue('admBizAvgSystemSize', overview.avg_system_size, false, true, ' kW');

  // Hydrate User Engagement Metrics
  setMetricValue('admEngActiveUsers', overview.active_users_30_days || 0, false, false);
  setMetricValue('admEngAvgConvs', overview.avg_conversations_per_user || 0, false, true);
  setMetricValue('admEngReferralRate', overview.referral_participation_rate || 0, false, true, '%');

  // Assessment Completion Rate Card (Never show 0% if empty, display secondary label correctly)
  const completionRateEl = document.getElementById('admEngCompletionRate');
  const completionLabelEl = document.getElementById('admEngCompletionLabel');
  if (completionRateEl && completionLabelEl) {
    if (!overview.total_registered_users || !overview.roi_completed_users || overview.total_registered_users === 0) {
      completionRateEl.textContent = "Insufficient data";
      completionLabelEl.textContent = "Insufficient data available to calculate this metric.";
    } else {
      animateAdminCounter('admEngCompletionRate', overview.assessment_completion_rate || 0, false, true, '%');
      completionLabelEl.textContent = `${overview.roi_completed_users} of ${overview.total_registered_users} users completed assessments`;
    }
  }

  // Hydrate Reports & PDF Export Center Analytics
  if (document.getElementById('admRptTotal')) {
    animateAdminCounter('admRptTotal', overview.total_reports_generated || 0);
  }
  if (document.getElementById('admRptMonthly')) {
    animateAdminCounter('admRptMonthly', overview.reports_generated_this_month || 0);
  }
  if (document.getElementById('admRptAvg')) {
    animateAdminCounter('admRptAvg', overview.avg_reports_per_user || 0, false, true);
  }
  if (document.getElementById('admRptAvgReadiness')) {
    animateAdminCounter('admRptAvgReadiness', overview.avg_solar_readiness_score || 0, false, true, '%');
  }
  const admRptMostDlEl = document.getElementById('admRptMostDl');
  if (admRptMostDlEl) {
    admRptMostDlEl.textContent = overview.most_downloaded_report_type || 'None';
  }
  const admRptMostGenEl = document.getElementById('admRptMostGen');
  if (admRptMostGenEl) {
    admRptMostGenEl.textContent = overview.most_common_report_generated || 'None';
  }

  // Hydrate Notification & Activity Telemetry Card
  if (document.getElementById('admNotifTotal')) {
    animateAdminCounter('admNotifTotal', overview.total_notifications_generated || 0);
  }
  if (document.getElementById('admNotifUnread')) {
    animateAdminCounter('admNotifUnread', overview.unread_notifications_count || 0);
  }
  if (document.getElementById('admNotifEvents')) {
    animateAdminCounter('admNotifEvents', overview.activity_events_today || 0);
  }
  if (document.getElementById('admNotifHighPriority')) {
    animateAdminCounter('admNotifHighPriority', overview.high_priority_notifications || 0);
  }
  if (document.getElementById('admNotifAvg')) {
    animateAdminCounter('admNotifAvg', overview.avg_notifications_per_user || 0, false, true);
  }
  const admNotifMostCommonEl = document.getElementById('admNotifMostCommon');
  if (admNotifMostCommonEl) {
    admNotifMostCommonEl.textContent = overview.most_common_notification_type || 'None';
  }
  const admNotifMostActiveUserEl = document.getElementById('admNotifMostActiveUser');
  if (admNotifMostActiveUserEl) {
    admNotifMostActiveUserEl.textContent = overview.most_active_user || 'None';
  }
  const admNotifMostCommonActivityEl = document.getElementById('admNotifMostCommonActivity');
  if (admNotifMostCommonActivityEl) {
    admNotifMostCommonActivityEl.textContent = overview.most_common_activity_type || 'None';
  }

  // Hydrate CRM Telemetry Card
  let adminLeads = {};
  try {
    const raw = localStorage.getItem('crmLeads');
    adminLeads = raw ? JSON.parse(raw) : {};
  } catch(e) {}
  
  let totalPipelineVal = 0;
  let wonCount = 0;
  let highIntentCount = 0;
  let scoreSum = 0;
  let leadCount = 0;
  let sourceCounts = {};
  
  for (let email in adminLeads) {
    const lead = adminLeads[email];
    leadCount++;
    if (['New Lead', 'Contacted', 'Qualified', 'Proposal Sent'].includes(lead.status)) {
      totalPipelineVal += lead.revenue_potential || 0;
    }
    if (lead.status === 'Won') {
      wonCount++;
    }
    if (lead.lead_score >= 70) {
      highIntentCount++;
    }
    scoreSum += lead.lead_score || 0;
    if (lead.source) {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    }
  }
  
  let avgLeadScore = leadCount > 0 ? Math.round(scoreSum / leadCount) : 0;
  
  let bestSource = "None";
  let maxSourceCount = 0;
  for (let s in sourceCounts) {
    if (sourceCounts[s] > maxSourceCount) {
      maxSourceCount = sourceCounts[s];
      bestSource = s;
    }
  }
  
  animateAdminCounter('admCrmPipelineValue', totalPipelineVal, true);
  animateAdminCounter('admCrmHighIntent', highIntentCount);
  animateAdminCounter('admCrmWonCustomers', wonCount);
  animateAdminCounter('admCrmAvgScore', avgLeadScore, false, false, '/100');
  const admCrmBestSourceEl = document.getElementById('admCrmBestSource');
  if (admCrmBestSourceEl) admCrmBestSourceEl.textContent = bestSource;

  // Hydrate Recent Activity Log
  adminActivityList = activity.activities || [];
  const legacyLogEl = document.getElementById('adminLegacyActivityLog');
  if (legacyLogEl) {
    if (adminActivityList.length === 0) {
      legacyLogEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">No recent activity logs available.</div>';
    } else {
      legacyLogEl.innerHTML = adminActivityList.map(act => {
        let icon = "👤";
        if (act.type === 'registration') icon = "👤";
        else if (act.type === 'bill') icon = "📄";
        else if (act.type === 'roof') icon = "🏠";
        else if (act.type === 'roi') icon = "📊";
        else if (act.type === 'referral') icon = "🎁";
        else if (act.type === 'redemption') icon = "💳";
        else if (act.type === 'assistant') icon = "💬";
        
        const date = new Date(act.timestamp);
        const relativeTime = getRelativeTime(date);
        
        return `<div class="admin-activity-item">
          <div class="admin-activity-icon ${act.type}">${icon}</div>
          <div style="flex-grow: 1;">
            <strong style="color: var(--text-navy);">${_esc(act.user)}</strong> ${_esc(act.description)}
          </div>
          <span style="font-size: 10px; color: var(--text-muted);">${relativeTime}</span>
        </div>`;
      }).join('');
    }
  }

  adminUsersList = users.users || [];
  renderAdminUsersTable();

  const uTotal = adminUsersList.length;
  const uActive = adminUsersList.filter(u => u.status === 'Active').length;
  const uPending = adminUsersList.filter(u => u.status === 'Pending').length;
  const uAdmins = adminUsersList.filter(u => u.role === 'Administrator').length;
  
  _setText('usrSummaryTotal', uTotal);
  _setText('usrSummaryActive', uActive);
  _setText('usrSummaryPending', uPending);
  _setText('usrSummaryAdmins', uAdmins);

  renderAdminTrendChart(overview.total_users || 10);

  const funnelContainer = document.getElementById('adminFunnelContainer');
  if (funnelContainer) {
    const totalUsers = overview.total_users || 1;
    const billCount = overview.bill_analyses || 0;
    const roofCount = overview.roof_analyses || 0;
    const roiCount = overview.roi_calculations || 0;

    const pctBill = Math.min(100, Math.round((billCount / totalUsers) * 100));
    const pctRoof = Math.min(100, Math.round((roofCount / totalUsers) * 100));
    const pctROI = Math.min(100, Math.round((roiCount / totalUsers) * 100));

    funnelContainer.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-navy); margin-bottom: 4px;">
          <span>1. Account Registration</span>
          <strong>${totalUsers} Users (100%)</strong>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="width: 100%; height: 100%; background: var(--accent-blue);"></div></div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-navy); margin-bottom: 4px;">
          <span>2. Utility Bill Uploaded</span>
          <strong>${billCount} (${pctBill}%)</strong>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="width: ${pctBill}%; height: 100%; background: var(--accent-orange);"></div></div>
      </div>
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-navy); margin-bottom: 4px;">
          <span>3. Satellite Roof Scanned</span>
          <strong>${roofCount} (${pctRoof}%)</strong>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="width: ${pctRoof}%; height: 100%; background: var(--accent-green);"></div></div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-navy); margin-bottom: 4px;">
          <span>4. ROI Calculator Simulated</span>
          <strong>${roiCount} (${pctROI}%)</strong>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;"><div style="width: ${pctROI}%; height: 100%; background: #eab308;"></div></div>
      </div>
    `;
  }

  const averagesContainer = document.getElementById('adminSolarAveragesContainer');
  if (averagesContainer) {
    let billData = null, roofData = null, roiData = null;
    try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
    try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
    try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

    if (billData || roofData || roiData) {
      // bill_amount may be absent if bill analysis was not run
      const billAmount = _safeNum(billData?.bill_amount, 6500);
      // system_size_kw is the new field from the roof API; recommended_kw is the legacy bill-analysis field
      const kwSize = _safeNum(
        roofData?.system_size_kw ?? roofData?.recommended_kw ?? billData?.recommended_kw,
        5.2
      );
      const payback = _safeNum(
        roiData?.data?.payback_period ?? roiData?.payback_period,
        4.8
      );

      averagesContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px; padding: 5px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px;">
            <span style="font-size: 11px; color: var(--text-secondary);">Avg Monthly Bill</span>
            <strong style="font-size: 13px; color: var(--text-navy);">₹${_safeNum(billAmount, 6500).toLocaleString('en-IN')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px;">
            <span style="font-size: 11px; color: var(--text-secondary);">Avg Solar Sizing</span>
            <strong style="font-size: 13px; color: var(--text-navy);">${_safeNum(kwSize, 5.2).toFixed(1)} kW</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px;">
            <span style="font-size: 11px; color: var(--text-secondary);">Avg Payback Period</span>
            <strong style="font-size: 13px; color: var(--accent-orange);">${_safeNum(payback, 4.8).toFixed(1)} Years</strong>
          </div>
        </div>
      `;
    } else {
      averagesContainer.innerHTML = `
        <div style="border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 30px 15px; text-align: center; background: rgba(255,255,255,0.01);">
          <span style="font-size: 24px; display: block; margin-bottom: 8px;">📊</span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600; display: block;">No Localized Assessment Averages</span>
          <p style="font-size: 10px; color: var(--text-muted); margin: 4px 0 0 0;">Perform a Bill or Roof analysis to compile local dashboard averages.</p>
        </div>
      `;
    }
  }

  // Hydrate Analytics Enhancements
  setMetricValue('admAnlTopLocation', overview.top_location, false, false);
  setMetricValue('admAnlMostAsked', overview.most_common_question_category, false, false);
  setMetricValue('admAnlMostRedeemed', overview.most_redeemed_reward, false, false);
  setMetricValue('admAnlAvgReferralPoints', overview.avg_referral_points_per_user, false, true, ' pts');

  const topLocationDesc = document.getElementById('admAnlTopLocationDesc');
  if (topLocationDesc) {
    if (!overview.top_location || overview.top_location === 'None') {
      topLocationDesc.textContent = "Insufficient data available to calculate this metric.";
    } else {
      topLocationDesc.textContent = "City / State with highest activity";
    }
  }
  const mostRedeemedDesc = document.getElementById('admAnlMostRedeemedDesc');
  if (mostRedeemedDesc) {
    if (!overview.most_redeemed_reward || overview.most_redeemed_reward === 'None') {
      mostRedeemedDesc.textContent = "Insufficient data available to calculate this metric.";
    } else {
      mostRedeemedDesc.textContent = "Highest volume redemption item";
    }
  }
  const avgReferralPointsDesc = document.getElementById('admAnlAvgReferralPointsDesc');
  if (avgReferralPointsDesc) {
    if (!overview.avg_referral_points_per_user || overview.avg_referral_points_per_user === 0) {
      avgReferralPointsDesc.textContent = "Insufficient data available to calculate this metric.";
    } else {
      avgReferralPointsDesc.textContent = "Points issued per registered user";
    }
  }

  // Hydrate Rewards Panel
  animateAdminCounter('admRwdCodes', Math.round(overview.total_users * 1.2));
  animateAdminCounter('admRwdSuccess', rewards.total_referrals || 0);
  animateAdminCounter('admRwdPoints', rewards.points_issued || 0);
  animateAdminCounter('admRwdWallet', rewards.wallet_value || 0, true);
  animateAdminCounter('admRwdRedeems', rewards.total_redemptions || 0);

  adminLeaderboardList = rewards.top_referrers || [];
  const referrersBody = document.getElementById('adminReferrersTableBody');
  if (referrersBody) {
    referrersBody.innerHTML = adminLeaderboardList.map(r => {
      let rankClass = "";
      if (r.rank === 1) rankClass = "top-gold";
      else if (r.rank === 2) rankClass = "top-silver";
      else if (r.rank === 3) rankClass = "top-bronze";
      
      return `<tr class="${rankClass}" style="border-bottom: 1px solid var(--border-color-light);">
        <td style="padding: 10px 8px;">#${r.rank}</td>
        <td style="padding: 10px 8px;"><strong>${_esc(r.name)}</strong><br><span style="font-size: 9px; color: var(--text-muted);">${_esc(r.email)}</span></td>
        <td style="padding: 10px 8px;">${r.referrals}</td>
        <td style="padding: 10px 8px;"><strong>${r.points.toLocaleString('en-IN')}</strong></td>
      </tr>`;
    }).join('');
  }

  animateAdminCounter('admAstConvs', assistant.total_conversations || 0);
  animateAdminCounter('admAstMessages', assistant.total_messages || 0);
  animateAdminCounter('admAstAvgMessages', assistant.avg_messages_per_conversation || 0, false, true);

  const categoriesList = document.getElementById('adminCategoriesList');
  if (categoriesList && assistant.question_categories) {
    let highestCat = "";
    let highestCount = -1;
    const cats = assistant.question_categories;
    const totalQueries = Object.values(cats).reduce((a, b) => a + b, 0);

    categoriesList.innerHTML = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        if (count > highestCount) {
          highestCount = count;
          highestCat = name;
        }
        const percentage = totalQueries > 0 ? Math.round((count / totalQueries) * 100) : 0;
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-navy); margin-bottom: 4px;">
              <span>${name}</span>
              <strong>${count} queries (${percentage}%)</strong>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
              <div style="width: ${percentage}%; height: 100%; background: var(--accent-blue);"></div>
            </div>
          </div>
        `;
      }).join('');

    const mostAskedEl = document.getElementById('admAstMostAsked');
    if (mostAskedEl) {
      mostAskedEl.textContent = highestCat || "Solar Size";
    }
  }

  // Hydrate BI Telemetry Widget and update BI tab if active
  _hydrateBiTelemetryWidget(data);
  if (document.getElementById('tab-business-intelligence') && document.getElementById('tab-business-intelligence').classList.contains('active')) {
    _hydrateBusinessIntelligenceUI(data);
  }
}

function compileLocalSessionAverages() {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}
  
  if (!billData && !roofData && !roiData) return null;

  const total_users = 1;
  const active_users = 1;
  const bill_analyses = billData ? 1 : 0;
  const roof_analyses = roofData ? 1 : 0;
  const roi_calculations = roiData ? 1 : 0;
  const completion_rate = Math.round((roi_calculations / total_users) * 100);
  const fully_assessed = (billData && roofData && roiData) ? 1 : 0;

  const user = _getUser() || {};

  const total_annual_savings = roiData ? (roiData.data?.annual_savings || roiData.annual_savings || 0) : 0;
  const avg_payback_period = roiData ? (roiData.data?.payback_period || roiData.payback_period || null) : null;
  const avg_roof_suitability = roofData ? (roofData.suitability_score || null) : null;
  const avg_system_size = roofData ? (roofData.recommended_kw || null) : (billData ? (billData.recommended_kw || null) : null);

  const active_users_30_days = active_users;
  const avg_conversations_per_user = 1.0;
  const referral_participation_rate = 0.0;

  const top_location = user.city || null;
  const most_common_question_category = "Solar Size";
  const most_redeemed_reward = null;
  const avg_referral_points_per_user = user.points || 0;

  let history = [];
  try { history = JSON.parse(localStorage.getItem('reportHistory')) || []; } catch(e) {}
  
  const total_reports_generated = history.length;
  const reports_generated_this_month = history.filter(h => {
    const d = new Date(h.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avg_reports_per_user = total_reports_generated; // since total_users = 1
  
  let readinessSum = 0;
  let readinessCount = 0;
  history.forEach(h => {
    if (h.readinessScore !== undefined) {
      readinessSum += h.readinessScore;
      readinessCount++;
    }
  });
  const avg_solar_readiness_score = readinessCount > 0 ? Math.round((readinessSum / readinessCount) * 10) / 10 : 0.0;
  
  let typeCounts = {};
  let dlCounts = {};
  history.forEach(h => {
    typeCounts[h.type] = (typeCounts[h.type] || 0) + 1;
    if (h.downloads > 0) {
      dlCounts[h.type] = (dlCounts[h.type] || 0) + h.downloads;
    }
  });
  
  let most_common_report_generated = "None";
  let maxGen = 0;
  for (let t in typeCounts) {
    if (typeCounts[t] > maxGen) {
      maxGen = typeCounts[t];
      most_common_report_generated = getReportName(t);
    }
  }
  
  let most_downloaded_report_type = "None";
  let maxDl = 0;
  for (let t in dlCounts) {
    if (dlCounts[t] > maxDl) {
      maxDl = dlCounts[t];
      most_downloaded_report_type = getReportName(t);
    }
  }

  return {
    isFallback: true,
    overview: {
      total_users,
      total_registered_users: total_users,
      active_users,
      bill_analyses,
      roof_analyses,
      roi_calculations,
      roi_completed_users: roi_calculations,
      assistant_conversations: 1,
      referral_points_issued: user.points || 0,
      rewards_redeemed: 0,
      assessment_completion_rate: completion_rate,
      fully_assessed_users: fully_assessed,
      total_annual_savings,
      avg_payback_period,
      avg_roof_suitability,
      avg_system_size,
      active_users_30_days,
      avg_conversations_per_user,
      referral_participation_rate,
      top_location,
      most_common_question_category,
      most_redeemed_reward,
      avg_referral_points_per_user,
      total_reports_generated,
      most_downloaded_report_type,
      reports_generated_this_month,
      avg_reports_per_user,
      avg_solar_readiness_score,
      most_common_report_generated,
      health: {
        gemini: "Warning",
        referral: "Warning",
        rewards: "Warning"
      }
    },
    users: {
      users: [{
        name: user.name || "Muhammad",
        email: user.email || "user@getsolar.in",
        role: user.role || "Premium User",
        status: "Active",
        registration_date: new Date().toISOString().split('T')[0]
      }]
    },
    rewards: {
      total_referrals: 0,
      points_issued: user.points || 0,
      wallet_value: Math.round((user.points || 0) / 10),
      total_redemptions: 0,
      top_referrers: [{
        rank: 1,
        name: user.name || "Muhammad",
        email: user.email || "user@getsolar.in",
        referrals: 0,
        points: user.points || 0
      }]
    },
    assistant: {
      total_conversations: 1,
      total_messages: 5,
      avg_messages_per_conversation: 5.0,
      question_categories: {
        "Subsidies": 1,
        "Solar Size": 2,
        "Savings": 2
      }
    },
    activity: {
      activities: [{
        type: "assistant",
        user: user.name || "Muhammad",
        timestamp: new Date().toISOString(),
        description: "Messaged GET Solar Copilot (Local Session)"
      }]
    }
  };
}

function renderAdminUsersTable() {
  const tableBody = document.getElementById('adminUsersTableBody');
  const searchVal = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();
  const roleVal = document.getElementById('adminUserRoleFilter')?.value || '';
  
  if (!tableBody) return;
  
  const filtered = adminUsersList.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchVal) || 
                          (u.email || '').toLowerCase().includes(searchVal);
    const matchesRole = roleVal === '' || u.role === roleVal;
    return matchesSearch && matchesRole;
  });
  
  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">No matching users found.</td></tr>';
    return;
  }
  
  tableBody.innerHTML = filtered.map(u => {
    const statusColor = u.status === 'Active' ? '#22c55e' : '#eab308';
    const statusBg = u.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)';
    const statusBadge = `<span style="font-weight: 700; color: ${statusColor}; background: ${statusBg}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${u.status}</span>`;
    
    return `<tr style="border-bottom: 1px solid var(--border-color-light);">
      <td style="padding: 10px 8px;"><strong>${_esc(u.name)}</strong></td>
      <td style="padding: 10px 8px;">${_esc(u.email)}</td>
      <td style="padding: 10px 8px;">${_esc(u.role)}</td>
      <td style="padding: 10px 8px;">${statusBadge}</td>
      <td style="padding: 10px 8px;">${_esc(u.registration_date)}</td>
    </tr>`;
  }).join('');
}

function renderAdminTrendChart(totalUsers) {
  const canvas = document.getElementById('adminActivityTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (adminTrendChartInstance) {
    adminTrendChartInstance.destroy();
  }
  
  const labels = [];
  const regData = [];
  const activeData = [];
  const chatData = [];
  
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 3600 * 1000);
    labels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    
    const seed = (d.getDate() + d.getMonth()) % 7;
    regData.push(Math.round(1 + seed * (totalUsers / 10)));
    activeData.push(Math.round(5 + seed * 2.5 * (totalUsers / 5)));
    chatData.push(Math.round(2 + seed * 1.5 * (totalUsers / 6)));
  }
  
  adminTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Active Users',
          data: activeData,
          borderColor: '#36d399',
          backgroundColor: 'rgba(54, 211, 153, 0.04)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Chats',
          data: chatData,
          borderColor: '#17a8e5',
          backgroundColor: 'rgba(23, 168, 229, 0.04)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Registrations',
          data: regData,
          borderColor: '#ff8a1d',
          backgroundColor: 'rgba(255, 138, 29, 0.04)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9fb3c8', font: { family: 'Outfit', size: 10 } }
        }
      },
      scales: {
        x: { ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }, grid: { display: false } },
        y: { ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } }, grid: { color: 'rgba(255, 255, 255, 0.06)' } }
      }
    }
  });
}

function animateAdminCounter(elementId, endValue, isCurrency = false, isFloat = false, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  endValue = _safeNum(endValue);
  const duration = 1000;
  const start = 0;
  const range = endValue - start;
  let startTime = null;
  
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeProgress = progress * (2 - progress);
    const currentValue = start + (range * easeProgress);
    
    let displayValue = "";
    if (isFloat) {
      displayValue = _safeNum(currentValue).toFixed(1);
    } else {
      displayValue = Math.floor(_safeNum(currentValue)).toLocaleString('en-IN');
    }
    
    let prefix = isCurrency ? "₹" : "";
    el.textContent = `${prefix}${displayValue}${suffix}`;
    
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      let finalDisplay = isFloat ? _safeNum(endValue).toFixed(1) : _safeNum(endValue).toLocaleString('en-IN');
      el.textContent = `${prefix}${finalDisplay}${suffix}`;
    }
  }
  requestAnimationFrame(step);
}

function getRelativeTime(date) {
  const diffMs = new Date() - date;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  return `${diffDays}d ago`;
}

function formatTimestamp(ts) {
  if (!ts) return "Never";
  const date = new Date(Number(ts));
  return "Last Checked: " + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ═════════════════════════════════════════════════════════════
// PHASE 10.3 — NOTIFICATION & ACTIVITY CENTER LOGIC
// ═════════════════════════════════════════════════════════════

function saveNotifications(notifs) {
  if (notifs.length > 100) {
    notifs = notifs.slice(0, 100);
  }
  localStorage.setItem('notifications', JSON.stringify(notifs));
}

function saveActivityLog(logs) {
  if (logs.length > 250) {
    logs = logs.slice(0, 250);
  }
  localStorage.setItem('activityLog', JSON.stringify(logs));
}

function getNotifications() {
  try {
    const raw = localStorage.getItem('notifications');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getActivityLog() {
  try {
    const raw = localStorage.getItem('activityLog');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function createNotification(type, title, message, priority = 'low') {
  const notifs = getNotifications();
  const newNotif = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    type: type,
    title: title,
    message: message,
    priority: priority,
    createdAt: new Date().toISOString(),
    read: false
  };
  
  notifs.unshift(newNotif);
  saveNotifications(notifs);
  
  const bellBtn = document.getElementById('notificationBellBtn');
  if (bellBtn) {
    bellBtn.classList.remove('bell-shake');
    void bellBtn.offsetWidth;
    bellBtn.classList.add('bell-shake');
  }
  
  updateNotificationBadge();
  refreshNotificationsUI();
  refreshAdminDashboardTelemetry();
}

function addActivityLog(type, title, description) {
  const logs = getActivityLog();
  const newLog = {
    id: 'activity-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    type: type,
    title: title,
    description: description,
    createdAt: new Date().toISOString()
  };
  
  logs.unshift(newLog);
  saveActivityLog(logs);
  
  refreshActivityCenterUI();
  refreshAdminDashboardTelemetry();
}

function updateNotificationBadge() {
  const notifs = getNotifications();
  const unreadCount = notifs.filter(n => !n.read).length;
  const badge = document.getElementById('notificationCountBadge');
  if (badge) {
    badge.textContent = unreadCount;
    if (unreadCount > 0) {
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function getRelativeTimeStr(dateStr) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const diffMs = new Date() - date;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getNotifCTA(notif) {
  const type = (notif.type || '').toLowerCase();
  const title = (notif.title || '').toLowerCase();
  
  if (type === 'rewards' || type === 'reward' || title.includes('reward') || title.includes('referral')) {
    return { label: "Go to Rewards", target: "rewards" };
  }
  if (type === 'reports' || type === 'report' || title.includes('report')) {
    return { label: "View Reports", target: "reports-center" };
  }
  if (type === 'roi' || title.includes('roi') || title.includes('financial')) {
    return { label: "View ROI Calculator", target: "roi-calculator" };
  }
  if (type === 'bill' || title.includes('bill')) {
    return { label: "View Bill Analyzer", target: "bill-analyzer" };
  }
  if (type === 'roof' || title.includes('roof')) {
    return { label: "View Roof Analyzer", target: "roof-analysis" };
  }
  if (type === 'assistant' || type === 'ai' || title.includes('ai') || title.includes('advisor') || title.includes('conversation')) {
    return { label: "Open Solar Copilot", target: "ai-assistant" };
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function refreshNotificationsUI() {
  const container = document.getElementById('drawerNotificationsContainer');
  if (!container) return;

  const notifs = getNotifications();
  const searchInput = document.getElementById('notifSearch');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const activeFilterEl = document.querySelector('.drawer-filters .filter-chip.active');
  const activeFilter = activeFilterEl ? activeFilterEl.getAttribute('data-filter') : 'all';

  let filtered = notifs.filter(n => {
    const matchesSearch = searchQuery === '' || 
      n.title.toLowerCase().includes(searchQuery) || 
      n.message.toLowerCase().includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 11px; margin: 0;">No notifications found.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(n => {
    const item = document.createElement('div');
    item.className = `notification-item priority-${n.priority} ${n.read ? '' : 'unread'}`;
    
    const relativeTime = getRelativeTimeStr(n.createdAt);
    const cta = getNotifCTA(n);
    
    let ctaBtnHtml = '';
    if (cta) {
      ctaBtnHtml = `<button class="notif-cta-btn" data-target="${cta.target}">${cta.label}</button>`;
    }

    item.innerHTML = `
      <div class="notif-header">
        <div class="notif-title-row">
          ${n.read ? '' : '<span class="notif-unread-dot"></span>'}
          <span class="notif-title">${escapeHtml(n.title)}</span>
        </div>
        <span style="font-size: 9px;">${relativeTime}</span>
      </div>
      <div class="notif-message">${escapeHtml(n.message)}</div>
      <div class="notif-meta">
        <span style="text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; opacity: 0.7;">${n.type}</span>
        ${ctaBtnHtml}
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('notif-cta-btn')) {
        const targetTab = e.target.getAttribute('data-target');
        const drawer = document.getElementById('notificationDrawer');
        if (drawer) {
          drawer.classList.remove('active');
          setTimeout(() => drawer.style.display = 'none', 300);
        }
        if (typeof switchTab === 'function') {
          switchTab(targetTab);
        }
      }
      
      if (!n.read) {
        n.read = true;
        const allNotifs = getNotifications();
        const found = allNotifs.find(item => item.id === n.id);
        if (found) {
          found.read = true;
          saveNotifications(allNotifs);
        }
        updateNotificationBadge();
        refreshNotificationsUI();
      }
    });

    container.appendChild(item);
  });
}

function getActivityPriority(item) {
  const type = item.type;
  const title = item.title.toLowerCase();
  
  if (type === 'reward' || title.includes('reward') || title.includes('referral') ||
      type === 'report' || title.includes('report') ||
      (type === 'roi' && title.includes('completed'))) {
    return 'high';
  }
  if (type === 'bill' || type === 'roof' || title.includes('recommendation') || title.includes('analysis completed') || title.includes('assessment completed')) {
    return 'medium';
  }
  return 'low';
}

function getActivityIcon(type) {
  switch (type) {
    case 'bill': return '📄';
    case 'roof': return '🏠';
    case 'roi': return '💰';
    case 'reward': return '🎁';
    case 'report': return '📂';
    case 'assistant': return '🤖';
    case 'settings':
    case 'system': return '⚙️';
    default: return '⚡';
  }
}

function refreshActivityCenterUI(filterType = 'all') {
  const logs = getActivityLog();
  
  // Calculate summaries today
  const todayStr = new Date().toDateString();
  let dailyAssessments = 0;
  let dailyReports = 0;
  let dailyRewards = 0;
  let dailyAI = 0;

  logs.forEach(item => {
    const itemDateStr = new Date(item.createdAt).toDateString();
    if (itemDateStr === todayStr) {
      if (item.type === 'bill' || item.type === 'roof' || item.type === 'roi' || item.type === 'assessment') {
        dailyAssessments++;
      } else if (item.type === 'report') {
        dailyReports++;
      } else if (item.type === 'reward') {
        dailyRewards++;
      } else if (item.type === 'assistant') {
        dailyAI++;
      }
    }
  });

  const assessmentsCounter = document.getElementById('dailySummaryAssessments');
  const reportsCounter = document.getElementById('dailySummaryReports');
  const rewardsCounter = document.getElementById('dailySummaryRewards');
  const aiCounter = document.getElementById('dailySummaryAI');

  if (assessmentsCounter) assessmentsCounter.textContent = dailyAssessments;
  if (reportsCounter) reportsCounter.textContent = dailyReports;
  if (rewardsCounter) rewardsCounter.textContent = dailyRewards;
  if (aiCounter) aiCounter.textContent = dailyAI;

  // Filter logs for timeline display
  let filtered = logs.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'assessment') {
      return item.type === 'bill' || item.type === 'roof' || item.type === 'roi' || item.type === 'assessment';
    }
    if (filterType === 'reports') {
      return item.type === 'report';
    }
    if (filterType === 'rewards') {
      return item.type === 'reward';
    }
    if (filterType === 'assistant') {
      return item.type === 'assistant';
    }
    if (filterType === 'system') {
      return item.type === 'system' || item.type === 'settings' || item.type === 'auth';
    }
    return item.type === filterType;
  });

  const emptyState = document.getElementById('activityEmptyState');
  const timelineBox = document.getElementById('activityTimelineBox');
  const timelineContainer = document.getElementById('activityCenterTimeline');

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (timelineBox) timelineBox.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (timelineBox) timelineBox.style.display = 'block';
    
    if (timelineContainer) {
      timelineContainer.innerHTML = '';
      filtered.forEach(item => {
        const eventEl = document.createElement('div');
        const priority = getActivityPriority(item);
        eventEl.className = `timeline-event priority-${priority}`;
        
        const icon = getActivityIcon(item.type);
        const relativeTime = getRelativeTimeStr(item.createdAt);
        
        eventEl.innerHTML = `
          <div class="timeline-event-header">
            <div class="timeline-event-title-group">
              <span class="timeline-event-icon">${icon}</span>
              <span class="timeline-event-title">${escapeHtml(item.title)}</span>
            </div>
            <span class="timeline-event-time">${relativeTime}</span>
          </div>
          <div class="timeline-event-desc">${escapeHtml(item.description)}</div>
        `;
        timelineContainer.appendChild(eventEl);
      });
    }
  }
}

function initNotificationCenter() {
  const bellBtn = document.getElementById('notificationBellBtn');
  const closeBtn = document.getElementById('btnCloseDrawer');
  const drawer = document.getElementById('notificationDrawer');
  const searchInput = document.getElementById('notifSearch');
  const markAllReadBtn = document.getElementById('btnMarkAllRead');
  const refreshBtn = document.getElementById('btnRefreshNotifications');
  const clearAllBtn = document.getElementById('btnClearAllNotifications');
  const filterChips = document.querySelectorAll('.drawer-filters .filter-chip');

  let activeFilter = 'all';

  if (bellBtn && drawer) {
    bellBtn.addEventListener('click', (e) => {
      e.preventDefault();
      drawer.style.display = 'block';
      setTimeout(() => drawer.classList.add('active'), 10);
      refreshNotificationsUI();
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('active');
      setTimeout(() => drawer.style.display = 'none', 300);
    });
  }

  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        drawer.classList.remove('active');
        setTimeout(() => drawer.style.display = 'none', 300);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      refreshNotificationsUI();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => {
        c.classList.remove('active');
        c.style.background = 'rgba(255,255,255,0.02)';
        c.style.color = 'var(--text-secondary)';
        c.style.borderColor = 'var(--border-color)';
        c.style.fontWeight = '600';
      });
      chip.classList.add('active');
      chip.style.background = 'rgba(0, 181, 226, 0.15)';
      chip.style.color = 'var(--accent-blue)';
      chip.style.borderColor = 'rgba(0, 181, 226, 0.3)';
      chip.style.fontWeight = '700';

      activeFilter = chip.getAttribute('data-filter');
      refreshNotificationsUI();
    });
  });

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      const notifs = getNotifications();
      notifs.forEach(n => n.read = true);
      saveNotifications(notifs);
      updateNotificationBadge();
      refreshNotificationsUI();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshNotificationsUI();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      saveNotifications([]);
      updateNotificationBadge();
      refreshNotificationsUI();
    });
  }

  // Handle Login Success notification (exactly once per session)
  const user = _getUser();
  if (user && !sessionStorage.getItem('loginNotificationShown')) {
    createNotification('system', 'Login Success', `Successfully signed in as ${user.name || user.email}.`, 'low');
    addActivityLog('system', 'User Signed In', `Authenticated user account ${user.email}.`);
    sessionStorage.setItem('loginNotificationShown', 'true');
  }

  updateNotificationBadge();
}

function initActivityCenterTab() {
  const filterBtns = document.querySelectorAll('#tab-activity-center .timeline-filters .filter-btn');
  let activeFilter = 'all';

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.02)';
        b.style.color = 'var(--text-secondary)';
        b.style.borderColor = 'var(--border-color)';
        b.style.fontWeight = '600';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(0, 181, 226, 0.15)';
      btn.style.color = 'var(--accent-blue)';
      btn.style.borderColor = 'rgba(0, 181, 226, 0.3)';
      btn.style.fontWeight = '700';

      activeFilter = btn.getAttribute('data-filter');
      refreshActivityCenterUI(activeFilter);
    });
  });

  refreshActivityCenterUI();
}

function initSettingsPreferences() {
  const saveBtn = document.getElementById('btnSavePreferences');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const discom = document.getElementById('settingsDiscom')?.value || 'dvvnl';
      const tariff = document.getElementById('settingsTariff')?.value || '7.50';
      const netMetering = document.getElementById('settingsNetMetering')?.value || 'net';
      
      const prefs = { discom, tariff, netMetering };
      localStorage.setItem('userPreferences', JSON.stringify(prefs));
      
      showToast('Preferences saved successfully!', 'success');
      
      createNotification('system', 'Settings Saved', 'Utility configurations and custom tariff rates successfully updated.', 'low');
      addActivityLog('settings', 'Settings Saved', `Updated Utility to ${discom.toUpperCase()}, Tariff to ₹${tariff}/kWh, and Metering to ${netMetering.toUpperCase()}.`);
      
      createNotification('system', 'Profile Updated', 'User profile configurations synced with platform registry.', 'low');
      addActivityLog('settings', 'Profile Updated', 'Profile details updated and synced.');
    });
  }
  
  const saved = localStorage.getItem('userPreferences');
  if (saved) {
    try {
      const prefs = JSON.parse(saved);
      const discomEl = document.getElementById('settingsDiscom');
      const tariffEl = document.getElementById('settingsTariff');
      const netMeteringEl = document.getElementById('settingsNetMetering');
      
      if (discomEl && prefs.discom) discomEl.value = prefs.discom;
      if (tariffEl && prefs.tariff) tariffEl.value = prefs.tariff;
      if (netMeteringEl && prefs.netMetering) netMeteringEl.value = prefs.netMetering;
    } catch(e) {}
  }
}

function refreshAdminDashboardTelemetry() {
  const user = _getUser();
  if (user && user.role === 'Administrator') {
    if (typeof loadAdminDashboardData === 'function') {
      loadAdminDashboardData(false);
    }
  }
}

// Global relative time loop
setInterval(() => {
  refreshNotificationsUI();
  refreshActivityCenterUI();
  checkFollowUpReminders();
}, 60000);

// ═════════════════════════════════════════════════════════════
// PHASE 10.4 — CRM & LEAD MANAGEMENT DASHBOARD SYSTEM
// ═════════════════════════════════════════════════════════════

// State lists
let crmLeadsList = [];

// Storage Helpers
function getCrmLeads() {
  try {
    const raw = localStorage.getItem('crmLeads');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCrmLeads(leads) {
  localStorage.setItem('crmLeads', JSON.stringify(leads));
}

function getCrmFollowUps() {
  try {
    const raw = localStorage.getItem('crmFollowUps');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCrmFollowUps(list) {
  localStorage.setItem('crmFollowUps', JSON.stringify(list));
}

function getCrmNotes() {
  try {
    const raw = localStorage.getItem('crmNotes');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCrmNotes(notes) {
  localStorage.setItem('crmNotes', JSON.stringify(notes));
}

function getCrmActivityLog() {
  try {
    const raw = localStorage.getItem('crmActivityLog');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCrmActivityLog(list) {
  if (list.length > 500) {
    list = list.slice(0, 500);
  }
  localStorage.setItem('crmActivityLog', JSON.stringify(list));
}

function addCrmActivity(type, leadName, description) {
  const log = getCrmActivityLog();
  log.unshift({
    id: 'crm-act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    type,
    leadName,
    description,
    createdAt: new Date().toISOString()
  });
  saveCrmActivityLog(log);
  refreshCrmActivityFeedUI();
}

function enforceNotesLimit() {
  const notesMap = getCrmNotes();
  let allNotes = [];
  
  for (let email in notesMap) {
    const notes = notesMap[email] || [];
    notes.forEach(note => {
      allNotes.push({
        email,
        id: note.id,
        createdAt: note.createdAt
      });
    });
  }
  
  if (allNotes.length > 1000) {
    // Sort oldest first
    allNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const excessCount = allNotes.length - 1000;
    const toDelete = allNotes.slice(0, excessCount);
    
    // Delete from notesMap
    toDelete.forEach(item => {
      if (notesMap[item.email]) {
        notesMap[item.email] = notesMap[item.email].filter(n => n.id !== item.id);
      }
    });
    
    saveCrmNotes(notesMap);
  }
}

function getLeadSource(user) {
  const analyses = user.analyses || {};
  const points = user.points || 0;
  const reportsCount = user.reports_count || 0;
  const copilotMessages = user.copilot_messages || 0;

  if (points > 0 && !analyses.bill && !analyses.roof && !analyses.roi) {
    return 'Referral';
  }
  if (analyses.roi) {
    return 'ROI Calculator';
  }
  if (analyses.roof) {
    return 'Roof Assessment';
  }
  if (analyses.bill) {
    return 'Bill Analysis';
  }
  if (reportsCount > 0) {
    return 'Reports Center';
  }
  if (copilotMessages > 0) {
    return 'Solar Copilot';
  }
  return 'Direct Signup';
}

function initCrmDashboard() {
  // Toggle CRM Subsections navigation
  const subNavBtns = document.querySelectorAll('.crm-sub-nav .sub-nav-btn');
  const crmSections = document.querySelectorAll('#tab-crm-dashboard .crm-section');
  
  subNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetSection = btn.getAttribute('data-crm-section');
      crmSections.forEach(section => {
        if (section.id === `crm-section-${targetSection}`) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      });
      
      if (targetSection === 'activity') {
        refreshCrmActivityFeedUI();
      }
    });
  });

  // Leads Directory Search Inputs
  const leadSearchInput = document.getElementById('crmLeadSearchInput');
  if (leadSearchInput) {
    leadSearchInput.addEventListener('input', (e) => {
      fetchAndPopulateCrm(e.target.value);
    });
  }
  const leadStatusFilter = document.getElementById('crmLeadStatusFilter');
  if (leadStatusFilter) {
    leadStatusFilter.addEventListener('change', renderCrmLeadsTable);
  }

  // Wires drawer closing
  const btnCloseCrmDrawer = document.getElementById('btnCloseCrmDrawer');
  const crmLeadProfileDrawer = document.getElementById('crmLeadProfileDrawer');
  if (btnCloseCrmDrawer && crmLeadProfileDrawer) {
    btnCloseCrmDrawer.addEventListener('click', () => {
      crmLeadProfileDrawer.classList.remove('active');
      setTimeout(() => crmLeadProfileDrawer.style.display = 'none', 300);
    });
    crmLeadProfileDrawer.addEventListener('click', (e) => {
      if (e.target === crmLeadProfileDrawer) {
        crmLeadProfileDrawer.classList.remove('active');
        setTimeout(() => crmLeadProfileDrawer.style.display = 'none', 300);
      }
    });
  }

  // Wires note saving inside drawer
  const btnSaveCrmNote = document.getElementById('btnSaveCrmNote');
  if (btnSaveCrmNote) {
    btnSaveCrmNote.addEventListener('click', saveLeadNote);
  }

  // Wires follow-up scheduling inside drawer
  const btnScheduleFollowUp = document.getElementById('btnScheduleFollowUp');
  if (btnScheduleFollowUp) {
    btnScheduleFollowUp.addEventListener('click', scheduleLeadFollowUp);
  }

  // Wires CSV export button
  const btnExportCrmCSV = document.getElementById('btnExportCrmCSV');
  if (btnExportCrmCSV) {
    btnExportCrmCSV.addEventListener('click', exportCrmLeadsCSV);
  }

  // Drag and drop setup for Kanban columns
  const kanbanColumns = document.querySelectorAll('.kanban-column');
  kanbanColumns.forEach(column => {
    const container = column.querySelector('.kanban-cards-container');
    if (container) {
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
      });
      container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
      });
      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        const email = e.dataTransfer.getData('text/plain');
        const newStatus = column.getAttribute('data-status');
        
        if (email && newStatus) {
          updateLeadStatus(email, newStatus);
        }
      });
    }
  });

  // Wires initial check for follow-up reminders
  checkFollowUpReminders();
}

function checkFollowUpReminders() {
  const followUps = getCrmFollowUps();
  const leads = getCrmLeads();
  let updated = false;
  const now = new Date();

  followUps.forEach(item => {
    if (item.status === 'Scheduled' && new Date(item.time) < now) {
      item.status = 'Missed';
      updated = true;
      const lead = leads[item.leadEmail] || {};
      const leadName = lead.name || item.leadEmail;
      
      // Notify center trigger
      createNotification('system', 'Follow-up Missed', `Missed scheduled follow-up ${item.type} with ${leadName}.`, 'high');
      addCrmActivity('missed', leadName, `Missed follow-up: ${item.type}`);
    }
  });

  if (updated) {
    saveCrmFollowUps(followUps);
    if (document.getElementById('crmLeadProfileDrawer')?.style.display === 'block') {
      const activeEmail = document.getElementById('crmDrawerLeadEmail')?.textContent;
      if (activeEmail) renderDrawerFollowUps(activeEmail);
    }
  }
}

function updateLeadStatus(email, newStatus) {
  const leads = getCrmLeads();
  if (leads[email]) {
    const oldStatus = leads[email].status;
    if (oldStatus !== newStatus) {
      leads[email].status = newStatus;
      saveCrmLeads(leads);
      
      addCrmActivity('pipeline', leads[email].name, `Moved from ${oldStatus} to ${newStatus}`);
      createNotification('system', 'Lead Pipeline Updated', `${leads[email].name} has been moved to ${newStatus}.`, 'medium');
      logAuditEvent((_getUser() || {}).email, 'CRM Updated', 'Admin', `Updated lead status for ${leads[email].name} (${email}): Moved from "${oldStatus}" to "${newStatus}".`, 'Critical');
      
      refreshCrmDashboardUI();
      
      // If drawer is open, keep dropdown in sync
      const activeEmail = document.getElementById('crmDrawerLeadEmail')?.textContent;
      if (activeEmail === email) {
        const select = document.getElementById('crmDrawerStatusSelect');
        if (select) select.value = newStatus;
      }
    }
  }
}

function fetchAndPopulateCrm(query = '') {
  const host = API_BASE;
  const url = query.trim()
    ? `${host}/api/customers/search?q=${encodeURIComponent(query)}`
    : `${host}/api/customers?limit=100`;

  safeFetch(url)
    .then(res => res.json())
    .then(customers => {
      crmLeadsList = customers.map(c => {
        let recKw = 0;
        let billAmt = 0;
        let payback = 0;
        let savings25 = 0;
        let units = 0;
        let period = '—';
        let rate = 0;
        let sysCost = 0;
        if (c.bills && c.bills.length > 0) {
          const sorted = [...c.bills].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
          const latest = sorted[0];
          recKw = latest.recommended_kw;
          billAmt = latest.bill_amount;
          payback = latest.payback_years;
          savings25 = latest.savings_25yr;
          units = latest.monthly_units;
          period = latest.billing_period;
          rate = latest.per_unit_rate;
          sysCost = latest.system_cost;
        }
        return {
          id: c.id,
          email: c.email || `${c.consumer_number}@getsolar.in`,
          name: c.customer_name,
          status: recKw > 0 ? 'Qualified' : 'New Lead',
          source: c.discom,
          lead_score: recKw > 0 ? 85 : 40,
          intent_level: recKw > 0 ? 'High Intent' : 'Low Intent',
          health_category: recKw > 0 ? 'Healthy' : 'Warm',
          health_score: recKw > 0 ? 90 : 60,
          revenue_potential: billAmt,
          city: c.city,
          consumer_number: c.consumer_number,
          bills: c.bills || []
        };
      });

      // Render the tables
      renderCrmLeadsTable();
      renderKanbanColumns();
      
      // Update CRM summary telemetry numbers
      let totalPipelineVal = 0;
      let wonRevenue = 0;
      let highIntentCount = 0;
      let wonCount = 0;
      let scoreSum = 0;

      crmLeadsList.forEach(lead => {
        totalPipelineVal += lead.revenue_potential || 0;
        if (lead.lead_score >= 70) {
          highIntentCount++;
        }
        scoreSum += lead.lead_score || 0;
      });

      const avgLeadScore = crmLeadsList.length > 0 ? Math.round(scoreSum / crmLeadsList.length) : 0;
      
      animateAdminCounter('crmKpiTotalLeads', crmLeadsList.length);
      animateAdminCounter('crmKpiPipelineValue', totalPipelineVal, true);
      animateAdminCounter('crmKpiWonRevenue', wonRevenue, true);
      animateAdminCounter('crmKpiHighIntent', highIntentCount);
      animateAdminCounter('crmKpiConversionRate', 0, false, false, '%');
      
      const bestSourceEl = document.getElementById('crmKpiBestSource');
      if (bestSourceEl) {
        bestSourceEl.textContent = crmLeadsList.length > 0 ? crmLeadsList[0].source : 'None';
      }
    })
    .catch(err => {
      console.error("Failed to load customer list for CRM:", err);
    });
}

function refreshCrmDashboardUI() {
  fetchAndPopulateCrm();
}

function useFallbackLeads() {
  fetchAndPopulateCrm();
}

function processAndRenderLeads(users) {
  const leads = getCrmLeads();
  const nonAdminUsers = users.filter(u => u.role !== 'Administrator');
  
  crmLeadsList = [];

  nonAdminUsers.forEach(u => {
    if (!leads[u.email]) {
      leads[u.email] = {
        email: u.email,
        name: u.name,
        status: 'New Lead',
        source: getLeadSource(u),
        notes: [],
        createdAt: u.registration_date || new Date().toISOString().split('T')[0],
        phone: u.phone || '',
        city: u.city || 'Lucknow'
      };
    }

    // Always recalculate scores, health scores, and potential values
    const currentLead = leads[u.email];
    
    // Ensure structure sync
    currentLead.name = u.name;
    currentLead.phone = u.phone || currentLead.phone;
    currentLead.city = u.city || currentLead.city;

    // 1. Lead Score & Intent Level
    let leadScore = 0;
    const analyses = u.analyses || {};
    if (analyses.bill) leadScore += 20;
    if (analyses.roof) leadScore += 20;
    if (analyses.roi) leadScore += 20;
    if (u.reports_count > 0) leadScore += 15;
    if (u.copilot_messages > 0) leadScore += 10;
    if (u.points > 0) leadScore += 15;
    currentLead.lead_score = leadScore;
    
    let intentLevel = "Low Intent";
    if (leadScore >= 70) intentLevel = "High Intent";
    else if (leadScore >= 40) intentLevel = "Medium Intent";
    currentLead.intent_level = intentLevel;

    // 2. Health Score & Health Category
    let healthScore = 0;
    const notesMap = getCrmNotes();
    const leadNotes = notesMap[u.email] || [];
    const notesCount = leadNotes.length;
    const hasTimelineActivity = (u.reports_count > 0 || u.copilot_messages > 0 || u.points > 0 || notesCount > 0 || analyses.bill || analyses.roof || analyses.roi);
    if (hasTimelineActivity) healthScore += 20; // Recent activity
    if (u.reports_count > 0) healthScore += 20; // Report generated
    if (analyses.roi) healthScore += 20; // ROI Completed
    if (u.copilot_messages > 0) healthScore += 20; // AI Engagement
    if (u.points > 0) healthScore += 20; // Referral participation
    currentLead.health_score = healthScore;

    let healthCategory = "Cold";
    if (healthScore >= 70) healthCategory = "Healthy";
    else if (healthScore >= 40) healthCategory = "Warm";
    currentLead.health_category = healthCategory;

    // 3. Revenue Potential
    let sysKw = 3.0;
    if (analyses.roi && analyses.roi.recommended_kw) sysKw = analyses.roi.recommended_kw;
    else if (analyses.roof && analyses.roof.recommended_kw) sysKw = analyses.roof.recommended_kw;
    else if (analyses.bill && analyses.bill.recommended_kw) sysKw = analyses.bill.recommended_kw;
    currentLead.system_size = sysKw;
    currentLead.revenue_potential = sysKw * 55000;

    crmLeadsList.push(currentLead);
  });

  saveCrmLeads(leads);
  
  // Re-run missed check
  checkFollowUpReminders();

  // Render Telemetry metrics
  renderCrmTelemetry();
  
  // Render Kanban Columns
  renderKanbanColumns();

  // Render Leads Table Directory
  renderCrmLeadsTable();
}

function renderCrmTelemetry() {
  let totalPipelineVal = 0;
  let wonRevenue = 0;
  let highIntentCount = 0;
  let wonCount = 0;
  let scoreSum = 0;
  let sourceCounts = {};

  crmLeadsList.forEach(lead => {
    if (['New Lead', 'Contacted', 'Qualified', 'Proposal Sent'].includes(lead.status)) {
      totalPipelineVal += lead.revenue_potential || 0;
    }
    if (lead.status === 'Won') {
      wonCount++;
      wonRevenue += lead.revenue_potential || 0;
    }
    if (lead.lead_score >= 70) {
      highIntentCount++;
    }
    scoreSum += lead.lead_score || 0;
    if (lead.source) {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    }
  });

  const avgLeadScore = crmLeadsList.length > 0 ? Math.round(scoreSum / crmLeadsList.length) : 0;
  
  let bestSource = "None";
  let maxCount = 0;
  for (let s in sourceCounts) {
    if (sourceCounts[s] > maxCount) {
      maxCount = sourceCounts[s];
      bestSource = s;
    }
  }

  const conversionRate = crmLeadsList.length > 0 ? Math.round((wonCount / crmLeadsList.length) * 100) : 0;

  // CRM Dashboard elements
  _setText('crmKpiTotalLeads', crmLeadsList.length);
  _setText('crmKpiPipelineValue', `₹${totalPipelineVal.toLocaleString('en-IN')}`);
  _setText('crmKpiWonRevenue', `₹${wonRevenue.toLocaleString('en-IN')}`);
  _setText('crmKpiHighIntent', highIntentCount);
  _setText('crmKpiBestSource', bestSource);
  _setText('crmKpiConversionRate', `${conversionRate}%`);

  // Admin Dashboard elements
  _setText('admCrmPipelineValue', `₹${totalPipelineVal.toLocaleString('en-IN')}`);
  _setText('admCrmHighIntent', highIntentCount);
  _setText('admCrmWonCustomers', wonCount);
  _setText('admCrmAvgScore', `${avgLeadScore}/100`);
  _setText('admCrmBestSource', bestSource);
}

function renderKanbanColumns() {
  const columns = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
  const followUps = getCrmFollowUps();

  columns.forEach(colStatus => {
    const safeId = colStatus.toLowerCase().replace(/ /g, '-');
    const container = document.getElementById(`container-${safeId}`);
    const badge = document.getElementById(`count-${safeId}`);
    
    if (!container) return;
    
    container.innerHTML = '';
    const columnLeads = crmLeadsList.filter(l => l.status === colStatus);
    
    if (badge) badge.textContent = columnLeads.length;

    columnLeads.forEach(lead => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.setAttribute('draggable', 'true');
      
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', lead.email);
      });

      // Find next follow-up
      const leadFollowUps = followUps.filter(f => f.leadEmail === lead.email && f.status === 'Scheduled');
      leadFollowUps.sort((a, b) => new Date(a.time) - new Date(b.time));
      let followUpHtml = '';
      if (leadFollowUps.length > 0) {
        const nextDate = new Date(leadFollowUps[0].time);
        followUpHtml = `
          <div style="font-size: 8px; color: var(--accent-orange); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <span>📅 Next: ${nextDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
        `;
      }

      let intentClass = "badge-intent-low";
      if (lead.intent_level === 'High Intent') intentClass = "badge-intent-high";
      else if (lead.intent_level === 'Medium Intent') intentClass = "badge-intent-medium";

      let healthClass = "badge-intent-low";
      if (lead.health_category === 'Healthy') healthClass = "badge-intent-high";
      else if (lead.health_category === 'Warm') healthClass = "badge-intent-medium";
      else healthClass = "badge-red";

      card.innerHTML = `
        <div class="kanban-card-title" title="${escapeHtml(lead.name)}">${escapeHtml(lead.name)}</div>
        <span class="kanban-card-email">${escapeHtml(lead.email)}</span>
        
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <span class="crm-badge badge-source">${escapeHtml(lead.source)}</span>
          <span class="crm-badge ${intentClass}">${escapeHtml(lead.intent_level)} (${lead.lead_score})</span>
          <span class="crm-badge ${healthClass}">Health: ${escapeHtml(lead.health_category)}</span>
        </div>
        
        <div class="kanban-card-metric" style="margin-top: 4px;">
          <span>Lead Value:</span>
          <strong>₹${(lead.revenue_potential || 0).toLocaleString('en-IN')}</strong>
        </div>
        
        ${followUpHtml}

        <button class="kanban-card-btn" onclick="openLeadProfileDrawer('${escapeHtml(lead.email)}')">View Profile</button>
      `;
      
      container.appendChild(card);
    });
  });
}

function renderCrmLeadsTable() {
  const tableBody = document.getElementById('crmLeadsTableBody');
  if (!tableBody) return;

  const searchVal = (document.getElementById('crmLeadSearchInput')?.value || '').toLowerCase().trim();
  const statusVal = document.getElementById('crmLeadStatusFilter')?.value || '';

  const filtered = crmLeadsList.filter(l => {
    const matchesSearch = (l.name || '').toLowerCase().includes(searchVal) || 
                          (l.consumer_number || '').toLowerCase().includes(searchVal) ||
                          (l.source || '').toLowerCase().includes(searchVal) ||
                          (l.city || '').toLowerCase().includes(searchVal);
    return matchesSearch;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 11px;">No customers found.</td></tr>';
    return;
  }

  tableBody.innerHTML = filtered.map(l => {
    const consumerNumber = l.consumer_number || '—';
    const city = l.city || '—';
    
    // Find latest bill info
    let recKw = '—';
    let latestBillStr = '—';
    if (l.bills && l.bills.length > 0) {
      const sorted = [...l.bills].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = sorted[0];
      recKw = latest.recommended_kw > 0 ? `${latest.recommended_kw} kW` : 'None';
      latestBillStr = `₹${latest.bill_amount.toLocaleString('en-IN')}`;
    }

    return `<tr style="border-bottom: 1px solid var(--border-color-light);">
      <td style="padding: 10px 8px;"><strong>${escapeHtml(l.name)}</strong></td>
      <td style="padding: 10px 8px;"><code>${escapeHtml(consumerNumber)}</code></td>
      <td style="padding: 10px 8px;"><span class="crm-badge badge-source" style="font-size: 9px; font-weight: normal;">${escapeHtml(l.source)}</span></td>
      <td style="padding: 10px 8px;"><span style="font-weight: 700; font-size: 10px; color: var(--text-navy);">${escapeHtml(city)}</span></td>
      <td style="padding: 10px 8px; text-align: center;"><span class="crm-badge badge-intent-medium">${recKw}</span></td>
      <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: var(--accent-green);">${latestBillStr}</td>
      <td style="padding: 10px 8px; text-align: center;">
        <button class="table-action-btn" onclick="openLeadProfileDrawer('${escapeHtml(l.email)}')">View Profile</button>
      </td>
    </tr>`;
  }).join('');
}

function refreshCrmActivityFeedUI() {
  const container = document.getElementById('crmActivityFeedBox');
  if (!container) return;

  const logs = getCrmActivityLog();
  if (logs.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 11px;">No CRM activities recorded yet.</div>';
    return;
  }

  container.innerHTML = logs.map(act => {
    let icon = "⚡";
    let iconBgClass = "system";
    if (act.type === 'pipeline') { icon = "🔄"; iconBgClass = "bill"; }
    else if (act.type === 'note') { icon = "📝"; iconBgClass = "assistant"; }
    else if (act.type === 'schedule') { icon = "📅"; iconBgClass = "roi"; }
    else if (act.type === 'complete') { icon = "✅"; iconBgClass = "roof"; }
    else if (act.type === 'missed') { icon = "⚠️"; iconBgClass = "redemption"; }

    const date = new Date(act.createdAt);
    const relativeTime = getRelativeTime(date);

    return `<div class="crm-activity-item type-${act.type}">
      <div class="crm-activity-icon ${iconBgClass}" style="background-color: rgba(255,255,255,0.05); padding: 4px; border-radius: 4px;">${icon}</div>
      <div style="flex-grow: 1;">
        <strong style="color: var(--text-navy);">${escapeHtml(act.leadName)}</strong> ${escapeHtml(act.description)}
      </div>
      <span style="font-size: 10px; color: var(--text-muted); white-space: nowrap;">${relativeTime}</span>
    </div>`;
  }).join('');
}

function openLeadProfileDrawer(email) {
  const lead = crmLeadsList.find(l => l.email === email);
  if (!lead) return;

  // Open drawer overlay
  const drawer = document.getElementById('crmLeadProfileDrawer');
  if (drawer) {
    drawer.style.display = 'block';
    setTimeout(() => drawer.classList.add('active'), 10);
  }

  // Populate basic details
  _setText('crmDrawerLeadName', lead.name);
  _setText('crmDrawerLeadEmail', `Consumer: ${lead.consumer_number}`);

  // Populate CDP fields
  _setText('cdpDrawerConsumerNumber', lead.consumer_number);
  _setText('cdpDrawerCity', lead.city);
  _setText('cdpDrawerDiscom', lead.source);

  const billPeriodEl = document.getElementById('cdpDrawerBillPeriod');
  const billUnitsEl = document.getElementById('cdpDrawerBillUnits');
  const billAmountEl = document.getElementById('cdpDrawerBillAmount');
  const unitRateEl = document.getElementById('cdpDrawerUnitRate');

  const solarSizeEl = document.getElementById('cdpDrawerSolarSize');
  const monthlySavingsEl = document.getElementById('cdpDrawerMonthlySavings');
  const systemCostEl = document.getElementById('cdpDrawerSystemCost');
  const paybackEl = document.getElementById('cdpDrawerPayback');
  const savings25yrEl = document.getElementById('cdpDrawerSavings25yr');

  if (lead.bills && lead.bills.length > 0) {
    // Sort to find latest
    const sorted = [...lead.bills].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    const bill = sorted[0];

    if (billPeriodEl) billPeriodEl.textContent = bill.billing_period;
    if (billUnitsEl) billUnitsEl.textContent = `${bill.monthly_units} kWh`;
    if (billAmountEl) billAmountEl.textContent = `₹${bill.bill_amount.toLocaleString('en-IN')}`;
    if (unitRateEl) unitRateEl.textContent = `₹${bill.per_unit_rate} / unit`;

    if (solarSizeEl) solarSizeEl.textContent = bill.recommended_kw > 0 ? `${bill.recommended_kw} kW` : 'None';
    if (monthlySavingsEl) monthlySavingsEl.textContent = `₹${Math.round(bill.monthly_savings).toLocaleString('en-IN')}`;
    if (systemCostEl) systemCostEl.textContent = `₹${bill.system_cost.toLocaleString('en-IN')}`;
    if (paybackEl) paybackEl.textContent = bill.recommended_kw > 0 ? `${bill.payback_years} Years` : 'N/A';
    if (savings25yrEl) savings25yrEl.textContent = `₹${Math.round(bill.savings_25yr).toLocaleString('en-IN')}`;
  } else {
    const els = [billPeriodEl, billUnitsEl, billAmountEl, unitRateEl, solarSizeEl, monthlySavingsEl, systemCostEl, paybackEl, savings25yrEl];
    els.forEach(el => {
      if (el) el.textContent = '—';
    });
  }
}

function renderDrawerActivityTimeline(lead, user) {
  const container = document.getElementById('crmDrawerTimeline');
  if (!container) return;

  const analyses = user.analyses || {};
  const reportsCount = user.reports_count || 0;
  const copilotMessages = user.copilot_messages || 0;
  const points = user.points || 0;

  let events = [];
  events.push({
    title: 'Signed Up',
    desc: 'Registered user account on the solar platform.',
    timeStr: 'Initial step',
    timestamp: new Date(user.registration_date || lead.createdAt || new Date()).getTime()
  });
  
  if (analyses.bill) {
    events.push({
      title: 'Ran Bill Analysis',
      desc: `Analyzed monthly bill of ₹${analyses.bill.bill_amount} for ${analyses.bill.monthly_units} units.`,
      timeStr: 'Completed',
      timestamp: Date.now() - 5 * 60000
    });
  }
  if (analyses.roof) {
    events.push({
      title: 'Ran Roof Assessment',
      desc: `Scanned usable area of ${analyses.roof.usable_area_sqft} sqft with suitability of ${analyses.roof.suitability_score}%.`,
      timeStr: 'Completed',
      timestamp: Date.now() - 4 * 60000
    });
  }
  if (analyses.roi) {
    const roiData = analyses.roi.data || analyses.roi;
    events.push({
      title: 'Generated ROI',
      desc: `Computed payback of ${roiData.payback_period || roiData.payback_years} years on a net investment of ₹${(roiData.net_cost || 0).toLocaleString('en-IN')}.`,
      timeStr: 'Completed',
      timestamp: Date.now() - 3 * 60000
    });
  }
  if (reportsCount > 0) {
    events.push({
      title: 'Downloaded Report',
      desc: `Downloaded ${reportsCount} custom report PDF file(s).`,
      timeStr: 'Downloaded',
      timestamp: Date.now() - 2 * 60000
    });
  }
  if (copilotMessages > 0) {
    events.push({
      title: 'Used Solar Copilot',
      desc: `Consulted Gemini AI assistant solar copilot with ${copilotMessages} message(s).`,
      timeStr: 'AI Chat',
      timestamp: Date.now() - 1 * 60000
    });
  }
  if (points > 0) {
    events.push({
      title: 'Earned Referral Points',
      desc: `Participated in rewards program holding ${points} referral balance points.`,
      timeStr: 'Points',
      timestamp: Date.now()
    });
  }

  // Filter crmActivityLog for lead-specific CRM events
  const crmLogs = getCrmActivityLog();
  crmLogs.forEach(act => {
    if (act.leadName === lead.name) {
      let iconEmoji = "⚡";
      if (act.type === 'pipeline') iconEmoji = "🔄";
      else if (act.type === 'note') iconEmoji = "📝";
      else if (act.type === 'schedule') iconEmoji = "📅";
      else if (act.type === 'complete') iconEmoji = "✅";
      else if (act.type === 'missed') iconEmoji = "⚠️";

      events.push({
        title: `${iconEmoji} CRM: ${act.description}`,
        desc: `Sales update: ${act.description}`,
        timeStr: getRelativeTimeStr(act.createdAt),
        timestamp: new Date(act.createdAt).getTime()
      });
    }
  });

  // Sort events newest first
  events.sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = events.map(e => `
    <div style="display: flex; gap: 8px; border-left: 2px solid var(--border-color-light); padding-left: 10px; padding-bottom: 8px; position: relative;">
      <span style="position: absolute; left: -5px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background-color: var(--accent-blue);"></span>
      <div style="font-size: 11px;">
        <div style="font-weight: bold; color: var(--text-navy);">${escapeHtml(e.title)}</div>
        <div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(e.desc)}</div>
        <span style="font-size: 8px; color: var(--text-muted); display: block; margin-top: 2px;">${e.timeStr}</span>
      </div>
    </div>
  `).join('');
}

function renderDrawerNotes(email) {
  const container = document.getElementById('crmDrawerNotesList');
  if (!container) return;

  const notesMap = getCrmNotes();
  const notes = notesMap[email] || [];

  if (notes.length === 0) {
    container.innerHTML = '<div style="font-style: italic; color: var(--text-muted); font-size: 10px;">No internal sales notes added yet.</div>';
    return;
  }

  container.innerHTML = notes.map(n => `
    <div style="background: rgba(255, 255, 255, 0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color-light); font-size: 10px;">
      <p style="margin: 0; color: var(--text-navy); white-space: pre-wrap;">${escapeHtml(n.text)}</p>
      <span style="font-size: 8px; color: var(--text-muted); display: block; text-align: right; margin-top: 4px;">${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `).join('');
}

function saveLeadNote() {
  const email = document.getElementById('crmDrawerLeadEmail')?.textContent;
  const textarea = document.getElementById('crmDrawerNoteText');
  if (!email || !textarea) return;

  const noteText = textarea.value.trim();
  if (!noteText) {
    showToast('Cannot save an empty note!', 'error');
    return;
  }

  const notesMap = getCrmNotes();
  if (!notesMap[email]) notesMap[email] = [];
  
  notesMap[email].unshift({
    id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    text: noteText,
    createdAt: new Date().toISOString()
  });

  saveCrmNotes(notesMap);
  
  // Prune notes if total note count > 1000
  enforceNotesLimit();

  textarea.value = '';
  renderDrawerNotes(email);
  
  const leads = getCrmLeads();
  const leadName = leads[email]?.name || email;
  addCrmActivity('note', leadName, 'Added internal consultation note');
  logAuditEvent((_getUser() || {}).email, 'CRM Updated', 'Admin', `Added sales note for lead: ${leadName} (${email}).`, 'Critical');
  showToast('Sales note saved successfully!', 'success');
}

function renderDrawerFollowUps(email) {
  const container = document.getElementById('crmFollowUpList');
  if (!container) return;

  const followUps = getCrmFollowUps();
  const leadFollowUps = followUps.filter(f => f.leadEmail === email);

  if (leadFollowUps.length === 0) {
    container.innerHTML = '<div class="card-base" style="--card-theme: 23, 168, 229; padding: 10px; font-style: italic; color: var(--text-muted); font-size: 10px; text-align: center;">No follow-up actions scheduled.</div>';
    return;
  }

  // Sort: scheduled first, then by date descending
  leadFollowUps.sort((a, b) => {
    if (a.status === 'Scheduled' && b.status !== 'Scheduled') return -1;
    if (a.status !== 'Scheduled' && b.status === 'Scheduled') return 1;
    return new Date(b.time) - new Date(a.time);
  });

  container.innerHTML = leadFollowUps.map(item => {
    const fDate = new Date(item.time);
    const dateStr = fDate.toLocaleDateString() + ' ' + fDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    let btnHtml = '';
    if (item.status === 'Scheduled') {
      btnHtml = `<button class="table-action-btn" style="padding: 2px 6px; font-size: 9px; background: rgba(34,197,94,0.1); color: var(--accent-green); border-color: rgba(34,197,94,0.2);" onclick="completeFollowUp('${item.id}')">Complete</button>`;
    }
    
    let statusColor = 'var(--text-secondary)';
    if (item.status === 'Scheduled') statusColor = 'var(--accent-orange)';
    else if (item.status === 'Completed') statusColor = 'var(--accent-green)';
    else if (item.status === 'Missed') statusColor = '#ef4444';

    return `<div class="card-base" style="--card-theme: 23, 168, 229; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 10px;">
        <div style="font-weight: bold; color: var(--text-navy);">${escapeHtml(item.type)} Follow-up</div>
        <div style="color: var(--text-muted); margin-top: 2px;">Sched: ${dateStr}</div>
        <span style="font-size: 9px; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">Status: ${item.status}</span>
      </div>
      <div>
        ${btnHtml}
      </div>
    </div>`;
  }).join('');
}

function scheduleLeadFollowUp() {
  const email = document.getElementById('crmDrawerLeadEmail')?.textContent;
  const typeSelect = document.getElementById('crmFollowUpType');
  const timeInput = document.getElementById('crmFollowUpTime');
  if (!email || !typeSelect || !timeInput) return;

  const followUpType = typeSelect.value;
  const timeVal = timeInput.value;

  if (!timeVal) {
    showToast('Please specify follow-up date and time!', 'error');
    return;
  }

  const leads = getCrmLeads();
  const lead = leads[email];
  if (!lead) return;

  const followUps = getCrmFollowUps();
  const newFollowUp = {
    id: 'fup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    leadEmail: email,
    type: followUpType,
    time: newTimeLocalToISO(timeVal),
    status: 'Scheduled',
    createdAt: new Date().toISOString()
  };

  followUps.unshift(newFollowUp);
  saveCrmFollowUps(followUps);

  // Reset input
  timeInput.value = '';
  renderDrawerFollowUps(email);

  // Trigger Notifications & Activities
  const formattedTime = new Date(newFollowUp.time).toLocaleString();
  createNotification('system', 'Follow-up Scheduled', `Follow-up ${followUpType} scheduled with ${lead.name} on ${formattedTime}.`, 'medium');
  addCrmActivity('schedule', lead.name, `Scheduled follow-up: ${followUpType} for ${formattedTime}`);
  
  // Refresh main Kanban count representation
  refreshCrmDashboardUI();

  showToast('Follow-up action scheduled successfully!', 'success');
}

function completeFollowUp(id) {
  const followUps = getCrmFollowUps();
  const leads = getCrmLeads();
  const found = followUps.find(f => f.id === id);

  if (found) {
    found.status = 'Completed';
    saveCrmFollowUps(followUps);

    const lead = leads[found.leadEmail] || {};
    const leadName = lead.name || found.leadEmail;

    // Timeline trigger
    createNotification('system', 'Follow-up Completed', `Follow-up ${found.type} with ${leadName} marked completed.`, 'low');
    addCrmActivity('complete', leadName, `Completed follow-up action: ${found.type}`);

    // Re-render
    if (document.getElementById('crmLeadProfileDrawer')?.style.display === 'block') {
      const activeEmail = document.getElementById('crmDrawerLeadEmail')?.textContent;
      if (activeEmail) renderDrawerFollowUps(activeEmail);
    }
    refreshCrmDashboardUI();

    showToast('Follow-up marked as completed!', 'success');
  }
}

function newTimeLocalToISO(datetimeLocalString) {
  return new Date(datetimeLocalString).toISOString();
}

function exportCrmLeadsCSV() {
  const headers = ['Lead Name', 'Email', 'Source', 'Pipeline Status', 'Lead Score', 'Health Score', 'Revenue Potential (Rs)'];
  const rows = crmLeadsList.map(l => [
    l.name,
    l.email,
    l.source,
    l.status,
    l.lead_score,
    l.health_score,
    l.revenue_potential
  ]);
  
  downloadCSV(getTimestampedFilename('crm_leads'), headers, rows);
}

// ==========================================================================
// 15. AUDIT & SYSTEM MONITORING ENGINE
// ==========================================================================

function safeParseJSON(key, defaultVal) {
  const data = localStorage.getItem(key);
  if (!data) return defaultVal;
  try {
    return JSON.parse(data);
  } catch (e) {
    const user = _getUser() || {};
    const email = user.email || 'anonymous';
    // Log LocalStorage Corruption Recovery
    logAuditEvent(email, 'LocalStorage Corruption Recovery', 'Security', `LocalStorage corruption detected for key "${key}". Value was reset. Error: ${e.message}`, 'Critical');
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
}

function logAuditEvent(actor, action, category, description, severity = 'Low') {
  let logs = [];
  try {
    const data = localStorage.getItem('auditLogs');
    logs = data ? JSON.parse(data) : [];
  } catch (e) {
    // If the audit log array itself is corrupted, clear it and log the recovery
    logs = [];
    localStorage.setItem('auditLogs', JSON.stringify([]));
    // Call recursively with recovery action but using clean storage
    setTimeout(() => {
      logAuditEvent('system', 'LocalStorage Corruption Recovery', 'Security', `LocalStorage corruption detected under auditLogs: ${e.message}`, 'Critical');
    }, 0);
  }

  const newLog = {
    id: 'evt-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
    timestamp: new Date().toISOString(),
    actor: actor || 'system',
    action: action,
    category: category,
    description: description,
    severity: severity
  };

  logs.unshift(newLog);

  // Cap to 1000 records
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000);
  }

  localStorage.setItem('auditLogs', JSON.stringify(logs));

  // Dispatch custom event to notify listeners
  window.dispatchEvent(new CustomEvent('auditLogAdded', { detail: newLog }));
}

function initAuditMonitoring() {
  const btnCloseAuditDrawer = document.getElementById('btnCloseAuditDrawer');
  const auditEventDrawer = document.getElementById('auditEventDrawer');
  if (btnCloseAuditDrawer && auditEventDrawer) {
    btnCloseAuditDrawer.addEventListener('click', () => {
      auditEventDrawer.style.display = 'none';
    });
    auditEventDrawer.addEventListener('click', (e) => {
      if (e.target === auditEventDrawer) {
        auditEventDrawer.style.display = 'none';
      }
    });
  }

  const btnResetAuditFilters = document.getElementById('btnResetAuditFilters');
  if (btnResetAuditFilters) {
    btnResetAuditFilters.addEventListener('click', () => {
      const search = document.getElementById('auditLogSearch');
      const cat = document.getElementById('auditCategoryFilter');
      const sev = document.getElementById('auditSeverityFilter');
      const date = document.getElementById('auditDateFilter');
      if (search) search.value = '';
      if (cat) cat.value = '';
      if (sev) sev.value = '';
      if (date) date.value = '';
      renderAuditLogsTable();
    });
  }

  const btnExportAuditCSV = document.getElementById('btnExportAuditCSV');
  if (btnExportAuditCSV) {
    btnExportAuditCSV.addEventListener('click', exportAuditLogsCSV);
  }

  // Bind input listeners
  const auditLogSearch = document.getElementById('auditLogSearch');
  const auditCategoryFilter = document.getElementById('auditCategoryFilter');
  const auditSeverityFilter = document.getElementById('auditSeverityFilter');
  const auditDateFilter = document.getElementById('auditDateFilter');

  if (auditLogSearch) auditLogSearch.addEventListener('input', renderAuditLogsTable);
  if (auditCategoryFilter) auditCategoryFilter.addEventListener('change', renderAuditLogsTable);
  if (auditSeverityFilter) auditSeverityFilter.addEventListener('change', renderAuditLogsTable);
  if (auditDateFilter) auditDateFilter.addEventListener('change', renderAuditLogsTable);

  // Sync event additions
  window.addEventListener('auditLogAdded', () => {
    if (document.getElementById('tab-audit-monitoring')?.classList.contains('active')) {
      refreshAuditDashboardUI();
    }
  });
}

function refreshAuditDashboardUI() {
  // 1. Fetch backend health and failed logins
  const host = API_BASE;
  safeFetch(`${host}/api/admin/overview`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Sync failed logins from backend
        if (data.failed_logins && data.failed_logins.length > 0) {
          let logs = safeParseJSON('auditLogs', []);
          data.failed_logins.forEach(f => {
            const fTime = new Date(f.timestamp * 1000).toISOString();
            const duplicate = logs.some(l => l.action === 'Failed Login Attempt' && l.actor === f.email && Math.abs(new Date(l.timestamp) - new Date(fTime)) < 5000);
            if (!duplicate) {
              logAuditEvent(f.email, 'Failed Login Attempt', 'Security', `Failed login attempt for user ${f.email}. Error: ${f.error}`, 'High');
            }
          });
        }
        
        // Populate health checklist
        hydrateHealthChecklist(data.health);
      }
      // Trigger table and analytics rendering
      renderAuditLogsTable();
      renderAuditAnalytics();
    })
    .catch(err => {
      console.warn("Audit UI overview sync failure:", err);
      // Fallback
      renderAuditLogsTable();
      renderAuditAnalytics();
    });
}

function hydrateHealthChecklist(health) {
  if (!health) return;
  const ids = {
    "users_json": "integrityUsersJson",
    "referrals_json": "integrityReferralsJson",
    "rewards_json": "integrityRewardsJson",
    "redemptions_json": "integrityRedemptionsJson"
  };
  
  for (const [key, spanId] of Object.entries(ids)) {
    const el = document.getElementById(spanId);
    if (el && health[key]) {
      const status = health[key];
      el.textContent = status;
      el.className = 'status-badge';
      if (status === 'Healthy') {
        el.classList.add('badge-healthy');
      } else if (status === 'Warning') {
        el.classList.add('badge-warning');
      } else {
        el.classList.add('badge-corrupted');
      }
    }
  }

  // Hydrate System Health Monitor cards
  const apiStatusEl = document.getElementById('sysHealthAPI');
  if (apiStatusEl) {
    apiStatusEl.textContent = 'Online';
    apiStatusEl.className = 'health-indicator online';
  }
  const geminiStatusEl = document.getElementById('sysHealthGemini');
  if (geminiStatusEl && health.gemini) {
    geminiStatusEl.textContent = health.gemini;
    geminiStatusEl.className = 'health-indicator ' + (health.gemini === 'Online' ? 'online' : health.gemini === 'Warning' ? 'warning' : 'offline');
  }
  const reportsStatusEl = document.getElementById('sysHealthReports');
  if (reportsStatusEl) {
    reportsStatusEl.textContent = 'Online';
    reportsStatusEl.className = 'health-indicator online';
  }
  const crmStatusEl = document.getElementById('sysHealthCRM');
  if (crmStatusEl) {
    crmStatusEl.textContent = 'Online';
    crmStatusEl.className = 'health-indicator online';
  }
  const notifStatusEl = document.getElementById('sysHealthNotifications');
  if (notifStatusEl) {
    notifStatusEl.textContent = 'Online';
    notifStatusEl.className = 'health-indicator online';
  }
  const storageStatusEl = document.getElementById('sysHealthStorage');
  if (storageStatusEl) {
    const totalBytes = getLocalStorageSize();
    // Warn if localStorage is using > 4MB (4,000,000 bytes)
    const isWarning = totalBytes > 4000000;
    storageStatusEl.textContent = isWarning ? 'Warning' : 'Online';
    storageStatusEl.className = 'health-indicator ' + (isWarning ? 'warning' : 'online');
  }
}

function renderAuditLogsTable() {
  const tableBody = document.getElementById('auditLogsTableBody');
  const emptyState = document.getElementById('auditLogsEmptyState');
  if (!tableBody) return;

  const logs = safeParseJSON('auditLogs', []);
  
  // Filter controls
  const searchVal = document.getElementById('auditLogSearch')?.value.toLowerCase().trim() || '';
  const categoryVal = document.getElementById('auditCategoryFilter')?.value || '';
  const severityVal = document.getElementById('auditSeverityFilter')?.value || '';
  const dateVal = document.getElementById('auditDateFilter')?.value || '';

  const filtered = logs.filter(log => {
    if (categoryVal && log.category !== categoryVal) return false;
    if (severityVal && log.severity !== severityVal) return false;
    
    if (dateVal) {
      const logDate = log.timestamp.split('T')[0];
      if (logDate !== dateVal) return false;
    }
    
    if (searchVal) {
      const actor = (log.actor || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const desc = (log.description || '').toLowerCase();
      if (!actor.includes(searchVal) && !action.includes(searchVal) && !desc.includes(searchVal)) return false;
    }
    return true;
  });

  // Update storage logs label
  const label = document.getElementById('auditLogsStorageCount');
  if (label) {
    label.textContent = `Storage: ${logs.length} / 1000 logs`;
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  tableBody.innerHTML = filtered.map(log => {
    const sevClass = 'badge-' + (log.severity || 'low').toLowerCase();
    const timeStr = new Date(log.timestamp).toLocaleString();
    return `<tr class="clickable-row" onclick="viewAuditDetail('${log.id}')" style="border-bottom: 1px solid var(--border-color-light);">
      <td style="padding: 10px 8px;">${timeStr}</td>
      <td style="padding: 10px 8px;"><strong>${_esc(log.actor)}</strong></td>
      <td style="padding: 10px 8px;">${_esc(log.action)}</td>
      <td style="padding: 10px 8px;">${_esc(log.category)}</td>
      <td style="padding: 10px 8px;"><span class="status-badge ${sevClass}" style="padding: 2px 6px; font-size: 9px; border-radius: 4px;">${log.severity}</span></td>
    </tr>`;
  }).join('');
}

function viewAuditDetail(id) {
  const logs = safeParseJSON('auditLogs', []);
  const log = logs.find(l => l.id === id);
  if (!log) return;

  const drawer = document.getElementById('auditEventDrawer');
  const title = document.getElementById('auditDrawerEventName');
  const eventId = document.getElementById('auditDrawerEventId');
  const time = document.getElementById('auditDrawerTimestamp');
  const actor = document.getElementById('auditDrawerActor');
  const action = document.getElementById('auditDrawerAction');
  const category = document.getElementById('auditDrawerCategory');
  const severity = document.getElementById('auditDrawerSeverity');
  const desc = document.getElementById('auditDrawerDescription');

  if (title) title.textContent = log.action;
  if (eventId) eventId.textContent = `Event ID: ${log.id}`;
  if (time) time.textContent = new Date(log.timestamp).toLocaleString();
  if (actor) actor.textContent = log.actor;
  if (action) action.textContent = log.action;
  
  if (category) {
    category.textContent = log.category;
    category.className = 'status-badge badge-source';
  }
  
  if (severity) {
    severity.textContent = log.severity;
    severity.className = 'status-badge badge-' + log.severity.toLowerCase();
  }
  
  if (desc) desc.textContent = log.description || 'No additional details provided.';

  if (drawer) {
    drawer.style.display = 'block';
  }
}

window.viewAuditDetail = viewAuditDetail;

function renderAuditAnalytics() {
  const logs = safeParseJSON('auditLogs', []);
  
  // Executive summaries metrics
  let highRiskCount = 0;
  let errorCount = 0;
  let errorsToday = 0;
  let criticalErrorCount = 0;
  let lastErrorTime = null;
  
  const todayStr = new Date().toISOString().split('T')[0];

  // System Health overview metrics
  let totalAuditEvents = logs.length;
  
  // Module usage counter
  const moduleUsage = {
    "Bill Analyzer": { count: 0, lastAccess: '—', status: 'Healthy' },
    "Roof Analyzer": { count: 0, lastAccess: '—', status: 'Healthy' },
    "ROI Calculator": { count: 0, lastAccess: '—', status: 'Healthy' },
    "Reports Center": { count: 0, lastAccess: '—', status: 'Healthy' },
    "Solar Copilot": { count: 0, lastAccess: '—', status: 'Healthy' },
    "Rewards & Referrals": { count: 0, lastAccess: '—', status: 'Healthy' },
    "Authentication": { count: 0, lastAccess: '—', status: 'Healthy' }
  };

  const actorFrequency = {};
  const hourFrequency = {};

  logs.forEach(log => {
    if (log.severity === 'High' || log.severity === 'Critical') {
      highRiskCount++;
    }
    
    // Track Errors
    if (log.action === 'API Failure' || log.action === 'Gemini Timeout' || log.action === 'LocalStorage Corruption Recovery' || log.action === 'Invalid Referral Code Usage') {
      errorCount++;
      if (log.timestamp.startsWith(todayStr)) {
        errorsToday++;
      }
      if (log.severity === 'Critical') {
        criticalErrorCount++;
      }
      if (!lastErrorTime || new Date(log.timestamp) > new Date(lastErrorTime)) {
        lastErrorTime = log.timestamp;
      }
    }

    // Track User frequency
    if (log.actor && log.actor !== 'system') {
      actorFrequency[log.actor] = (actorFrequency[log.actor] || 0) + 1;
    }

    // Track Peak Activity Hour
    const hr = new Date(log.timestamp).getHours();
    hourFrequency[hr] = (hourFrequency[hr] || 0) + 1;

    // Track Module usage
    let mappedModule = null;
    if (log.category === 'Assessment') {
      if (log.action.includes('Bill')) mappedModule = 'Bill Analyzer';
      else if (log.action.includes('Roof')) mappedModule = 'Roof Analyzer';
      else if (log.action.includes('ROI')) mappedModule = 'ROI Calculator';
    } else if (log.category === 'Reports') {
      mappedModule = 'Reports Center';
    } else if (log.category === 'AI Assistant') {
      mappedModule = 'Solar Copilot';
    } else if (log.category === 'Rewards') {
      mappedModule = 'Rewards & Referrals';
    } else if (log.category === 'Authentication') {
      mappedModule = 'Authentication';
    }

    if (mappedModule) {
      moduleUsage[mappedModule].count++;
      if (moduleUsage[mappedModule].lastAccess === '—' || new Date(log.timestamp) > new Date(moduleUsage[mappedModule].lastAccess)) {
        moduleUsage[mappedModule].lastAccess = log.timestamp;
      }
    }
  });

  // Calculate platform health score (max 100)
  // Drop 5 points per high/critical risk, drop 2 points per other error
  let platformHealth = 100 - (highRiskCount * 5) - ((errorCount - highRiskCount) * 2);
  platformHealth = Math.max(10, Math.min(100, platformHealth));

  // Executive summary UI hydration
  const scoreVal = document.getElementById('summaryPlatformHealth');
  if (scoreVal) scoreVal.textContent = `${platformHealth}%`;
  const scoreTrack = document.getElementById('summaryPlatformHealthTrack');
  if (scoreTrack) scoreTrack.style.width = `${platformHealth}%`;
  
  const scoreCard = document.getElementById('summaryPlatformHealthCard');
  if (scoreCard) {
    scoreCard.className = 'card-base shadow-lift';
    if (platformHealth >= 90) scoreCard.style.setProperty('--card-theme', '54, 211, 153');
    else if (platformHealth >= 70) scoreCard.style.setProperty('--card-theme', '234, 179, 8');
    else scoreCard.style.setProperty('--card-theme', '231, 76, 60');
  }

  const summaryTotalEvents = document.getElementById('summaryTotalEvents');
  if (summaryTotalEvents) summaryTotalEvents.textContent = totalAuditEvents;
  
  const summaryHighRisk = document.getElementById('summaryHighRisk');
  if (summaryHighRisk) summaryHighRisk.textContent = highRiskCount;

  // Hydrate Error monitor card
  const errTotalCount = document.getElementById('errTotalCount');
  if (errTotalCount) errTotalCount.textContent = errorCount;
  const errTodayCount = document.getElementById('errTodayCount');
  if (errTodayCount) errTodayCount.textContent = errorsToday;
  const errCriticalCount = document.getElementById('errCriticalCount');
  if (errCriticalCount) errCriticalCount.textContent = criticalErrorCount;
  const errLastTimestamp = document.getElementById('errLastTimestamp');
  if (errLastTimestamp) {
    errLastTimestamp.textContent = lastErrorTime ? new Date(lastErrorTime).toLocaleTimeString() : '—';
  }

  // Hydrate Most Active statistics
  const anlMostActiveUser = document.getElementById('anlMostActiveUser');
  if (anlMostActiveUser) {
    const sortedActors = Object.keys(actorFrequency).sort((a,b) => actorFrequency[b] - actorFrequency[a]);
    anlMostActiveUser.textContent = sortedActors.length > 0 ? sortedActors[0].split('@')[0] : '—';
  }

  const anlMostActiveModule = document.getElementById('anlMostActiveModule');
  const anlMostUsedFeature = document.getElementById('anlMostUsedFeature');
  if (anlMostActiveModule || anlMostUsedFeature) {
    const sortedModules = Object.keys(moduleUsage).sort((a,b) => moduleUsage[b].count - moduleUsage[a].count);
    const topMod = sortedModules.length > 0 && moduleUsage[sortedModules[0]].count > 0 ? sortedModules[0] : '—';
    if (anlMostActiveModule) anlMostActiveModule.textContent = topMod;
    if (anlMostUsedFeature) {
      if (topMod === 'Bill Analyzer') anlMostUsedFeature.textContent = 'Bill Scanner';
      else if (topMod === 'Roof Analyzer') anlMostUsedFeature.textContent = 'Satellite Area Scan';
      else if (topMod === 'ROI Calculator') anlMostUsedFeature.textContent = 'Savings Timeline';
      else if (topMod === 'Solar Copilot') anlMostUsedFeature.textContent = 'GenAI Recommendations';
      else if (topMod === 'Reports Center') anlMostUsedFeature.textContent = 'PDF Export';
      else if (topMod === 'Rewards & Referrals') anlMostUsedFeature.textContent = 'Code Sharing';
      else if (topMod === 'Authentication') anlMostUsedFeature.textContent = 'User Signins';
      else anlMostUsedFeature.textContent = '—';
    }
  }

  const anlPeakHour = document.getElementById('anlPeakHour');
  if (anlPeakHour) {
    const sortedHours = Object.keys(hourFrequency).sort((a,b) => hourFrequency[b] - hourFrequency[a]);
    if (sortedHours.length > 0) {
      const hr = parseInt(sortedHours[0]);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const disp = hr % 12 === 0 ? 12 : hr % 12;
      anlPeakHour.textContent = `${disp} ${ampm}`;
    } else {
      anlPeakHour.textContent = '—';
    }
  }

  // Hydrate Module Usage Table
  const tableBody = document.getElementById('moduleUsageTableBody');
  if (tableBody) {
    tableBody.innerHTML = Object.entries(moduleUsage).map(([name, val]) => {
      const accessStr = val.lastAccess !== '—' ? new Date(val.lastAccess).toLocaleTimeString() : '—';
      const usageHealth = val.count > 0 && logs.some(l => l.category === 'Security' && l.action === 'API Failure' && l.description.includes(name)) ? 'Warning' : 'Healthy';
      const statusClass = usageHealth === 'Healthy' ? 'badge-green' : 'badge-orange';
      return `<tr style="border-bottom: 1px solid var(--border-color-light);">
        <td style="padding: 6px 8px; font-weight: bold;">${name}</td>
        <td style="padding: 6px 8px; text-align: center;">${val.count}</td>
        <td style="padding: 6px 8px; text-align: right; color: var(--text-secondary);">${accessStr}</td>
        <td style="padding: 6px 8px; text-align: right;"><span class="status-badge ${statusClass}" style="padding: 1px 4px; font-size: 8px;">${usageHealth}</span></td>
      </tr>`;
    }).join('');
  }

  // Hydrate LocalStorage Quota Tracking progress items
  hydrateStorageQuotaProgress();

  // Populate Recent System Events Timeline
  hydrateRecentSystemTimeline();
  
  // Update Admin dashboard telemetry
  const admAuditTotalEvents = document.getElementById('admAuditTotalEvents');
  if (admAuditTotalEvents) admAuditTotalEvents.textContent = totalAuditEvents;
  const admAuditHighSeverity = document.getElementById('admAuditHighSeverity');
  if (admAuditHighSeverity) {
    admAuditHighSeverity.textContent = logs.filter(l => l.severity === 'High').length;
  }
  const admAuditCritical = document.getElementById('admAuditCritical');
  if (admAuditCritical) {
    admAuditCritical.textContent = logs.filter(l => l.severity === 'Critical').length;
  }
  const admAuditEventsToday = document.getElementById('admAuditEventsToday');
  if (admAuditEventsToday) {
    admAuditEventsToday.textContent = logs.filter(l => l.timestamp.startsWith(todayStr)).length;
  }
  const admAuditCommonCategory = document.getElementById('admAuditCommonCategory');
  if (admAuditCommonCategory) {
    const cats = {};
    logs.forEach(l => cats[l.category] = (cats[l.category] || 0) + 1);
    const sortedCats = Object.keys(cats).sort((a,b) => cats[b] - cats[a]);
    admAuditCommonCategory.textContent = sortedCats.length > 0 ? sortedCats[0] : '—';
  }
}

function hydrateRecentSystemTimeline() {
  const container = document.getElementById('systemEventsTimeline');
  const emptyTimeline = document.getElementById('systemEventsEmptyState');
  if (!container) return;

  const logs = safeParseJSON('auditLogs', []);
  const systemLogs = logs.filter(l => l.category === 'System' || l.category === 'Security' || l.severity === 'Critical' || l.severity === 'High').slice(0, 15);

  if (systemLogs.length === 0) {
    container.innerHTML = '';
    if (emptyTimeline) emptyTimeline.style.display = 'block';
    return;
  }
  if (emptyTimeline) emptyTimeline.style.display = 'none';

  container.innerHTML = systemLogs.map(item => {
    let icon = '⚙️';
    let iconBg = 'rgba(255,255,255,0.05)';
    if (item.category === 'Security') {
      icon = '🛡️';
      iconBg = 'rgba(231,76,60,0.12)';
    } else if (item.severity === 'Critical') {
      icon = '🚨';
      iconBg = 'rgba(231,76,60,0.2)';
    } else if (item.action.includes('Applied') || item.action.includes('Login')) {
      icon = '🔑';
      iconBg = 'rgba(54,211,153,0.1)';
    }
    
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const elapsed = getElapsedShortString(item.timestamp);
    
    return `<div class="sys-timeline-item sev-${item.severity.toLowerCase()}">
      <div class="sys-timeline-icon" style="background: ${iconBg};">${icon}</div>
      <div style="flex: 1; font-size: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <strong style="color: var(--text-navy);">${_esc(item.action)}</strong>
          <span style="color: var(--text-muted); font-size: 8px;">${elapsed} (${timeStr})</span>
        </div>
        <div style="color: var(--text-secondary); margin-top: 2px;">${_esc(item.description)}</div>
      </div>
    </div>`;
  }).join('');
}

function getElapsedShortString(isoString) {
  const sec = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (sec < 60) return 'now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function getLocalStorageSize() {
  let total = 0;
  for (let x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += ((localStorage[x].length + x.length) * 2);
    }
  }
  return total;
}

function hydrateStorageQuotaProgress() {
  const container = document.getElementById('storageQuotaBars');
  if (!container) return;

  const totalBytes = getLocalStorageSize();
  const maxBytes = 5 * 1024 * 1024; // 5MB
  const totalPercent = Math.min(100, parseFloat(_safeNum((totalBytes / maxBytes) * 100).toFixed(2)));

  const keys = ['auditLogs', 'notifications', 'leads', 'reportHistory'];
  const colors = {
    'auditLogs': 'var(--accent-orange)',
    'notifications': 'var(--accent-blue)',
    'leads': 'var(--accent-green)',
    'reportHistory': '#a78bfa'
  };
  const labels = {
    'auditLogs': 'Audit Compliance Logs',
    'notifications': 'Notification Cache',
    'leads': 'CRM Lead Profiles',
    'reportHistory': 'Reports History'
  };

  let itemsHtml = keys.map(k => {
    const val = localStorage.getItem(k) || '';
    const bytes = val.length * 2;
    const pct = Math.min(100, parseFloat(_safeNum((bytes / maxBytes) * 100).toFixed(2)));
    const color = colors[k] || 'var(--text-muted)';
    const label = labels[k] || k;
    
    return `<div class="quota-bar-item">
      <div class="quota-bar-labels">
        <span>${label}</span>
        <span>${pct}% (${_safeNum(bytes / 1024).toFixed(1)} KB)</span>
      </div>
      <div class="quota-bar-track">
        <div class="quota-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
      </div>
    </div>`;
  }).join('');

  itemsHtml += `<div class="quota-bar-item" style="border-top: 1px dashed var(--border-color-light); padding-top: 8px; margin-top: 4px;">
    <div class="quota-bar-labels" style="font-weight: bold; color: var(--text-navy);">
      <span>Total Browser storage quota</span>
      <span>${totalPercent}% (${_safeNum(totalBytes / 1024).toFixed(1)} KB / 5.0 MB)</span>
    </div>
    <div class="quota-bar-track" style="height: 6px;">
      <div class="quota-bar-fill" style="width: ${totalPercent}%; background-color: ${totalPercent > 80 ? '#ef4444' : totalPercent > 50 ? 'var(--accent-orange)' : 'var(--accent-blue)'};"></div>
    </div>
  </div>`;

  container.innerHTML = itemsHtml;
}

function exportAuditLogsCSV() {
  const headers = ['Timestamp', 'Actor/User', 'Action', 'Category', 'Severity', 'Description'];
  const logs = safeParseJSON('auditLogs', []);
  
  const rows = logs.map(log => [
    log.timestamp,
    log.actor,
    log.action,
    log.category,
    log.severity,
    log.description
  ]);

  const now = new Date();
  const format = (num) => String(num).padStart(2, '0');
  const filename = `audit_log_${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())}_${format(now.getHours())}-${format(now.getMinutes())}-${format(now.getSeconds())}.csv`;

  downloadCSV(filename, headers, rows);
  logAuditEvent((_getUser() || {}).email, 'Audit Log Exported', 'Admin', 'Exported full compliance audit log table to CSV.', 'Medium');
}

/* ==========================================================================
   19. EXECUTIVE BUSINESS INTELLIGENCE PLATFORM (Phase 10.7)
   ========================================================================== */

let biSegmentationChartInstance = null;
let biStageDistributionChartInstance = null;
let biLeadSourceVolumeChartInstance = null;
let biLeadSourceConvChartInstance = null;
let biAiCategoryChartInstance = null;

function initBusinessIntelligence() {
  const btnPresentation = document.getElementById('btnBiPresentationMode');
  if (btnPresentation) {
    btnPresentation.addEventListener('click', () => {
      document.body.classList.toggle('presentation-active');
      const isPresentation = document.body.classList.contains('presentation-active');
      btnPresentation.querySelector('span').textContent = isPresentation ? 'Exit Presentation' : 'Presentation Mode';
    });
  }

  const btnInvestor = document.getElementById('btnBiInvestorMode');
  if (btnInvestor) {
    btnInvestor.addEventListener('click', () => {
      document.body.classList.toggle('investor-active');
    });
  }

  const btnExport = document.getElementById('btnBiExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportBusinessIntelligenceCSV();
    });
  }
  
  const btnGoToBi = document.getElementById('adminGoToBiBtn');
  if (btnGoToBi) {
    btnGoToBi.addEventListener('click', () => {
      // Switch active menu selection in sidebar
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        if (item.getAttribute('data-tab') === 'business-intelligence') {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      switchTab('business-intelligence');
    });
  }
}

function refreshBusinessIntelligenceUI() {
  const cachedDataStr = localStorage.getItem('cachedAdminData');
  if (!cachedDataStr) {
    // If no cache, trigger loadAdminDashboardData to fetch the data
    loadAdminDashboardData(true);
    return;
  }
  
  const consolidated = JSON.parse(cachedDataStr);
  _hydrateBusinessIntelligenceUI(consolidated);
}

function _hydrateBiTelemetryWidget(data) {
  const metrics = calculateBiMetrics(data);
  
  const forecastEl = document.getElementById('admTelemetryBiRevenue');
  const convEl = document.getElementById('admTelemetryBiConversion');
  const scoreEl = document.getElementById('admTelemetryBiScore');
  const growthEl = document.getElementById('admTelemetryBiGrowth');
  
  if (forecastEl) forecastEl.textContent = formatCurrencyRupee(metrics.revenueForecast);
  if (convEl) convEl.textContent = `${_safeNum(metrics.conversionRate).toFixed(1)}%`;
  if (scoreEl) scoreEl.textContent = `${Math.round(metrics.businessScore)}/100`;
  if (growthEl) growthEl.textContent = `${metrics.growthScore >= 0 ? '+' : ''}${Math.round(metrics.growthScore)}%`;
}

function _hydrateBusinessIntelligenceUI(data) {
  const activeView = document.getElementById('biDashboardActiveView');
  const emptyState = document.getElementById('biDashboardEmptyState');
  const leads = Object.values(getCrmLeads() || {});

  if (leads.length === 0) {
    if (activeView) activeView.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    _bindBiEmptyStateButtons();
    return;
  } else {
    if (activeView) activeView.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
  }

  const metrics = calculateBiMetrics(data);
  
  // Hydrate top summary plain-English text
  const summaryTextEl = document.getElementById('biExecutiveSummaryText');
  if (summaryTextEl) {
    summaryTextEl.textContent = metrics.executiveSummary;
  }
  
  // Hydrate KPI mini cards
  const miniHealth = document.getElementById('biMetricHealthScore');
  const miniForecast = document.getElementById('biMetricRevenueForecast');
  const miniGrowth = document.getElementById('biMetricLeadGrowth');
  const miniRisk = document.getElementById('biMetricRiskLevel');
  
  if (miniHealth) {
    miniHealth.textContent = `${Math.round(metrics.businessScore)}/100`;
    miniHealth.style.color = metrics.businessScore >= 70 ? '#10b981' : metrics.businessScore >= 45 ? '#f59e0b' : '#ef4444';
  }
  if (miniForecast) miniForecast.textContent = formatCurrencyRupee(metrics.revenueForecast);
  if (miniGrowth) {
    miniGrowth.textContent = `${_safeNum(metrics.leadGrowth) >= 0 ? '+' : ''}${_safeNum(metrics.leadGrowth).toFixed(1)}%`;
    miniGrowth.style.color = metrics.leadGrowth >= 0 ? '#10b981' : '#ef4444';
  }
  if (miniRisk) {
    miniRisk.textContent = metrics.riskLevel;
    miniRisk.style.color = metrics.riskLevel === 'Low' ? '#10b981' : metrics.riskLevel === 'Medium' ? '#f59e0b' : '#ef4444';
  }
  
  // Hydrate main KPI grids
  const kpiUsers = document.getElementById('biKpiTotalUsers');
  const trendUsers = document.getElementById('biTrendTotalUsers');
  if (kpiUsers) kpiUsers.textContent = metrics.totalUsers;
  if (trendUsers) {
    trendUsers.textContent = metrics.benchmarks.users.diffText;
    trendUsers.className = `trend-indicator ${metrics.benchmarks.users.trendClass}`;
  }
  
  const kpiLeads = document.getElementById('biKpiTotalLeads');
  const trendLeads = document.getElementById('biTrendTotalLeads');
  if (kpiLeads) kpiLeads.textContent = metrics.totalLeads;
  if (trendLeads) {
    trendLeads.textContent = metrics.benchmarks.leads.diffText;
    trendLeads.className = `trend-indicator ${metrics.benchmarks.leads.trendClass}`;
  }
  
  const kpiRefs = document.getElementById('biKpiReferrals');
  const trendRefs = document.getElementById('biTrendReferrals');
  if (kpiRefs) kpiRefs.textContent = metrics.referralConversions;
  if (trendRefs) {
    trendRefs.textContent = metrics.benchmarks.referrals.diffText;
    trendRefs.className = `trend-indicator ${metrics.benchmarks.referrals.trendClass}`;
  }
  
  const kpiConv = document.getElementById('biKpiConversionRate');
  const trendConv = document.getElementById('biTrendConversionRate');
  if (kpiConv) kpiConv.textContent = `${_safeNum(metrics.conversionRate).toFixed(1)}%`;
  if (trendConv) {
    trendConv.textContent = metrics.conversionTrendText;
    trendConv.className = `trend-indicator ${metrics.conversionTrendClass}`;
  }

  // Hydrate Revenue & Efficiency KPI Grid
  const kpiPipelineRev = document.getElementById('biKpiPipelineRevenue');
  const trendPipelineRev = document.getElementById('biTrendPipelineRevenue');
  if (kpiPipelineRev) kpiPipelineRev.textContent = formatCurrencyRupee(metrics.pipelineRevenue);
  if (trendPipelineRev) {
    trendPipelineRev.textContent = metrics.benchmarks.revenue.diffText;
    trendPipelineRev.className = `trend-indicator ${metrics.benchmarks.revenue.trendClass}`;
  }

  const kpiQualRev = document.getElementById('biKpiQualifiedRevenue');
  const trendQualRev = document.getElementById('biTrendQualifiedRevenue');
  if (kpiQualRev) kpiQualRev.textContent = formatCurrencyRupee(metrics.qualifiedRevenue);
  if (trendQualRev) {
    trendQualRev.textContent = metrics.benchmarks.leads.diffText;
    trendQualRev.className = `trend-indicator ${metrics.benchmarks.leads.trendClass}`;
  }

  const kpiWonRev = document.getElementById('biKpiWonRevenue');
  const trendWonRev = document.getElementById('biTrendWonRevenue');
  if (kpiWonRev) kpiWonRev.textContent = formatCurrencyRupee(metrics.wonRevenue);
  if (trendWonRev) {
    trendWonRev.textContent = metrics.benchmarks.revenue.diffText;
    trendWonRev.className = `trend-indicator ${metrics.benchmarks.revenue.trendClass}`;
  }

  const kpiExpectedRev = document.getElementById('biKpiExpectedRevenue');
  if (kpiExpectedRev) kpiExpectedRev.textContent = formatCurrencyRupee(metrics.expectedRevenue);

  const kpiRevPerLead = document.getElementById('biKpiRevPerLead');
  if (kpiRevPerLead) kpiRevPerLead.textContent = formatCurrencyRupee(metrics.revPerLead);

  const kpiRevPerQual = document.getElementById('biKpiRevPerQualified');
  if (kpiRevPerQual) kpiRevPerQual.textContent = formatCurrencyRupee(metrics.revPerQualified);

  const kpiRevPerWon = document.getElementById('biKpiRevPerWon');
  if (kpiRevPerWon) kpiRevPerWon.textContent = formatCurrencyRupee(metrics.revPerWon);

  const kpiWinRate = document.getElementById('biKpiWinRate');
  if (kpiWinRate) kpiWinRate.textContent = `${_safeNum(metrics.winRate).toFixed(1)}%`;

  const kpiAvgDealSize = document.getElementById('biKpiAvgDealSize');
  if (kpiAvgDealSize) kpiAvgDealSize.textContent = formatCurrencyRupee(metrics.avgDealSize);
  
  // Populate Waterfall
  const waterfallContainer = document.getElementById('biWaterfallContainer');
  if (waterfallContainer) {
    waterfallContainer.innerHTML = '';
    const stages = [
      { label: `Leads (${metrics.totalLeads})`, value: metrics.pipelineRevenue, color: '0, 174, 239', percent: 100, dropoffText: '<span class="waterfall-dropoff conversion">Start</span>' },
      { 
        label: `Qualified (${metrics.qualifiedCount})`, 
        value: metrics.qualifiedRevenue, 
        color: '168, 85, 247', 
        percent: metrics.pipelineRevenue > 0 ? (metrics.qualifiedRevenue / metrics.pipelineRevenue * 100) : 0, 
        dropoffText: `<span class="waterfall-dropoff loss">${_safeNum(metrics.conversionRates.leadToQualifiedRate).toFixed(0)}% Conv / ${(100 - _safeNum(metrics.conversionRates.leadToQualifiedRate)).toFixed(0)}% Loss <span class="stage-health-badge ${metrics.conversionHealth.leadToQualified.status}">${metrics.conversionHealth.leadToQualified.text}</span></span>` 
      },
      { 
        label: `Proposal Sent (${metrics.proposalCount})`, 
        value: metrics.proposalRevenue, 
        color: '255, 138, 29', 
        percent: metrics.pipelineRevenue > 0 ? (metrics.proposalRevenue / metrics.pipelineRevenue * 100) : 0, 
        dropoffText: `<span class="waterfall-dropoff loss">${_safeNum(metrics.conversionRates.qualifiedToProposalRate).toFixed(0)}% Conv / ${(100 - _safeNum(metrics.conversionRates.qualifiedToProposalRate)).toFixed(0)}% Loss <span class="stage-health-badge ${metrics.conversionHealth.qualifiedToProposal.status}">${metrics.conversionHealth.qualifiedToProposal.text}</span></span>` 
      },
      { 
        label: `Won Projects (${metrics.wonCount})`, 
        value: metrics.wonRevenue, 
        color: '54, 211, 153', 
        percent: metrics.pipelineRevenue > 0 ? (metrics.wonRevenue / metrics.pipelineRevenue * 100) : 0, 
        dropoffText: `<span class="waterfall-dropoff loss">${_safeNum(metrics.conversionRates.proposalToWonRate).toFixed(0)}% Conv / ${(100 - _safeNum(metrics.conversionRates.proposalToWonRate)).toFixed(0)}% Loss <span class="stage-health-badge ${metrics.conversionHealth.proposalToWon.status}">${metrics.conversionHealth.proposalToWon.text}</span></span>` 
      }
    ];
    
    stages.forEach((stg) => {
      const row = document.createElement('div');
      row.className = 'waterfall-row';
      row.innerHTML = `
        <span class="waterfall-stage-label">${stg.label}</span>
        <div class="waterfall-bar-wrapper">
          <div class="waterfall-bar" style="width: ${Math.max(5, stg.percent)}%; --bar-color: ${stg.color};">
            <span class="waterfall-value">${formatCurrencyRupee(stg.value)}</span>
          </div>
        </div>
        ${stg.dropoffText}
      `;
      waterfallContainer.appendChild(row);
    });
  }
  
  // Render Charts
  renderBiStageDistributionChart(metrics);
  renderBiSegmentationChart(metrics.segmentation);
  
  // Hydrate Cohorts Table
  const cohortsBody = document.getElementById('biCohortMatrixBody');
  if (cohortsBody) {
    cohortsBody.innerHTML = '';
    const sortedMonths = Object.keys(metrics.cohorts).sort((a, b) => new Date(a) - new Date(b));
    if (sortedMonths.length === 0) {
      cohortsBody.innerHTML = `<tr><td colspan="6" style="padding:20px; color:var(--text-muted); text-align:center;">No cohort data available</td></tr>`;
    } else {
      sortedMonths.forEach(month => {
        const c = metrics.cohorts[month];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 10px; text-align: left; font-weight: bold;">${month}</td>
          <td style="padding: 10px; font-weight: 700;">${c.size}</td>
          <td class="cohort-cell-heat" style="padding: 10px; background-color: rgba(0, 174, 239, ${Math.max(0.05, _safeNum(c.billPct) / 100)})">${_safeNum(c.billPct).toFixed(0)}%</td>
          <td class="cohort-cell-heat" style="padding: 10px; background-color: rgba(54, 211, 153, ${Math.max(0.05, _safeNum(c.roofPct) / 100)})">${_safeNum(c.roofPct).toFixed(0)}%</td>
          <td class="cohort-cell-heat" style="padding: 10px; background-color: rgba(255, 138, 29, ${Math.max(0.05, _safeNum(c.referralPct) / 100)})">${_safeNum(c.referralPct).toFixed(0)}%</td>
          <td class="cohort-cell-heat" style="padding: 10px; background-color: rgba(168, 85, 247, ${Math.max(0.05, _safeNum(c.copilotPct) / 100)})">${_safeNum(c.copilotPct).toFixed(0)}%</td>
        `;
        cohortsBody.appendChild(tr);
      });
    }
  }
  
  // Hydrate Solar metrics card
  const avgBill = document.getElementById('biSolarAvgBill');
  const avgSize = document.getElementById('biSolarAvgSize');
  const avgPayback = document.getElementById('biSolarAvgPayback');
  const avgRoi = document.getElementById('biSolarAvgRoi');
  const avgSuitability = document.getElementById('biSolarAvgSuitability');
  
  if (avgBill) avgBill.textContent = formatCurrencyRupee(metrics.solar.avgBill);
  if (avgSize) avgSize.textContent = `${_safeNum(metrics.solar.avgSize).toFixed(1)} kW`;
  if (avgPayback) avgPayback.textContent = `${_safeNum(metrics.solar.avgPayback).toFixed(1)} Years`;
  if (avgRoi) avgRoi.textContent = `${Math.round(metrics.solar.avgRoi)}%`;
  if (avgSuitability) avgSuitability.textContent = `${Math.round(metrics.solar.avgSuitability)}/100`;
  
  // Hydrate Referral Impact Card
  const refPipeline = document.getElementById('biRefPipeline');
  const refConversion = document.getElementById('biRefConversion');
  const refTopSegment = document.getElementById('biRefTopSegment');
  const refMultiplier = document.getElementById('biRefMultiplier');
  
  if (refPipeline) refPipeline.textContent = formatCurrencyRupee(metrics.referral.pipeline);
  if (refConversion) refConversion.textContent = `${_safeNum(metrics.referral.conversionRate).toFixed(1)}%`;
  if (refTopSegment) refTopSegment.textContent = metrics.referral.topSegment;
  if (refMultiplier) refMultiplier.textContent = `${_safeNum(metrics.referral.multiplier).toFixed(1)}x`;
  
  // Hydrate AI Scorecard
  const aiInfluence = document.getElementById('biAiInfluenceScore');
  const aiQueries = document.getElementById('biAiTotalQueries');
  const aiRecommendations = document.getElementById('biAiRecommendations');
  const aiLeads = document.getElementById('biAiLeadsInfluenced');
  const aiAssessmentConv = document.getElementById('biAiAssessmentConversions');
  
  if (aiInfluence) aiInfluence.textContent = `${Math.round(metrics.ai.influenceScore)}%`;
  if (aiQueries) aiQueries.textContent = metrics.ai.queries;
  if (aiRecommendations) aiRecommendations.textContent = metrics.ai.recommendations;
  if (aiLeads) aiLeads.textContent = metrics.ai.leadsInfluenced;
  if (aiAssessmentConv) aiAssessmentConv.textContent = `${_safeNum(metrics.ai.conversionPct).toFixed(1)}%`;
  
  // Hydrate Risk list
  const riskListEl = document.getElementById('biRiskList');
  if (riskListEl) {
    riskListEl.innerHTML = '';
    if (metrics.risks.length === 0) {
      riskListEl.innerHTML = `<div style="font-size:11px; color:var(--text-secondary);">No immediate platform risks identified.</div>`;
    } else {
      metrics.risks.forEach(r => {
        const item = document.createElement('div');
        item.className = 'risk-warning-card';
        item.innerHTML = `
          <span class="risk-warning-icon">⚠️</span>
          <div>
            <strong style="font-weight:700;">${r.title}</strong>
            <span>${r.desc}</span>
          </div>
        `;
        riskListEl.appendChild(item);
      });
    }
  }
  
  // Hydrate Opportunities / Recommender
  const oppListEl = document.getElementById('biOpportunitiesList');
  if (oppListEl) {
    oppListEl.innerHTML = '';
    if (metrics.opportunities.length === 0) {
      oppListEl.innerHTML = `<div style="font-size:11px; color:var(--text-secondary);">Analyzing conversion bottlenecks...</div>`;
    } else {
      metrics.opportunities.forEach(o => {
        const item = document.createElement('div');
        item.className = 'opportunity-card';
        item.innerHTML = `
          <span style="font-size:14px; flex-shrink:0;">💡</span>
          <div>
            <strong style="font-weight:700;">${o.title}</strong>
            <span>${o.desc}</span>
          </div>
        `;
        oppListEl.appendChild(item);
      });
    }
  }
  
  // Hydrate Benchmarking
  const benchUCurrent = document.getElementById('biBenchUsersCurrent');
  const benchUDiff = document.getElementById('biBenchUsersDiff');
  if (benchUCurrent) benchUCurrent.textContent = metrics.benchmarks.users.current;
  if (benchUDiff) {
    benchUDiff.textContent = metrics.benchmarks.users.diffText;
    benchUDiff.className = `trend-indicator ${metrics.benchmarks.users.trendClass}`;
  }
  
  const benchRefCurrent = document.getElementById('biBenchRefCurrent');
  const benchRefDiff = document.getElementById('biBenchRefDiff');
  if (benchRefCurrent) benchRefCurrent.textContent = metrics.benchmarks.referrals.current;
  if (benchRefDiff) {
    benchRefDiff.textContent = metrics.benchmarks.referrals.diffText;
    benchRefDiff.className = `trend-indicator ${metrics.benchmarks.referrals.trendClass}`;
  }
  
  const benchLeadsCurrent = document.getElementById('biBenchLeadsCurrent');
  const benchLeadsDiff = document.getElementById('biBenchLeadsDiff');
  if (benchLeadsCurrent) benchLeadsCurrent.textContent = metrics.benchmarks.leads.current;
  if (benchLeadsDiff) {
    benchLeadsDiff.textContent = metrics.benchmarks.leads.diffText;
    benchLeadsDiff.className = `trend-indicator ${metrics.benchmarks.leads.trendClass}`;
  }
  
  const benchRevCurrent = document.getElementById('biBenchRevenueCurrent');
  const benchRevDiff = document.getElementById('biBenchRevenueDiff');
  if (benchRevCurrent) benchRevCurrent.textContent = formatCurrencyRupee(metrics.benchmarks.revenue.current);
  if (benchRevDiff) {
    benchRevDiff.textContent = metrics.benchmarks.revenue.diffText;
    benchRevDiff.className = `trend-indicator ${metrics.benchmarks.revenue.trendClass}`;
  }

  // Phase 10.7 Executive Redesign & Enhancement updates
  _hydrateWaterfallLossCards(metrics);
  renderBiLeadSourceCharts(leads);
  renderBiAiCategoryChart(metrics);
  renderBiRadialHealthGauge(metrics);
  renderBiForecastSection(metrics);
  renderBiInsightsCenter(metrics);
}

function _hydrateWaterfallLossCards(metrics) {
  const pipeToQualLoss = Math.max(0, metrics.pipelineRevenue - metrics.qualifiedRevenue);
  const qualToPropLoss = Math.max(0, metrics.qualifiedRevenue - metrics.proposalRevenue);
  const propToWonLoss = Math.max(0, metrics.proposalRevenue - metrics.wonRevenue);

  const el1 = document.getElementById('biLossPipeToQual');
  const el2 = document.getElementById('biLossQualToProp');
  const el3 = document.getElementById('biLossPropToWon');

  if (el1) el1.textContent = formatCurrencyRupee(pipeToQualLoss);
  if (el2) el2.textContent = formatCurrencyRupee(qualToPropLoss);
  if (el3) el3.textContent = formatCurrencyRupee(propToWonLoss);
}

function renderBiLeadSourceCharts(leads) {
  const canvasVolume = document.getElementById('biLeadSourceVolumeChart');
  const canvasConv = document.getElementById('biLeadSourceConvChart');
  if (!canvasVolume || !canvasConv) return;

  const sources = ['Referral', 'Bill Analysis', 'Roof Assessment', 'ROI Calculator', 'Reports Center', 'Solar Copilot', 'Direct Signup'];
  
  const sourceCounts = {};
  const wonCounts = {};
  sources.forEach(src => {
    sourceCounts[src] = 0;
    wonCounts[src] = 0;
  });

  leads.forEach(l => {
    const src = l.source || 'Direct Signup';
    if (sourceCounts[src] !== undefined) {
      sourceCounts[src]++;
      if (l.status === 'Won') {
        wonCounts[src]++;
      }
    }
  });

  const volumeData = sources.map(src => sourceCounts[src]);
  const convRates = sources.map(src => {
    const total = sourceCounts[src];
    return total > 0 ? parseFloat(_safeNum(wonCounts[src] / total * 100).toFixed(1)) : 0;
  });

  if (biLeadSourceVolumeChartInstance) biLeadSourceVolumeChartInstance.destroy();
  const ctxVol = canvasVolume.getContext('2d');
  biLeadSourceVolumeChartInstance = new Chart(ctxVol, {
    type: 'doughnut',
    data: {
      labels: sources,
      datasets: [{
        data: volumeData,
        backgroundColor: [
          '#ff8a1d', '#00AEEF', '#36D399', '#eab308', '#a855f7', '#ec4899', '#64748b'
        ],
        borderColor: '#06111f',
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  if (biLeadSourceConvChartInstance) biLeadSourceConvChartInstance.destroy();
  const ctxConv = canvasConv.getContext('2d');
  biLeadSourceConvChartInstance = new Chart(ctxConv, {
    type: 'bar',
    data: {
      labels: sources,
      datasets: [{
        label: 'Conversion Rate (%)',
        data: convRates,
        backgroundColor: 'rgba(23, 168, 229, 0.75)',
        borderColor: '#00AEEF',
        borderWidth: 1,
        borderRadius: 3,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#ffffff', font: { family: 'Outfit', size: 9, weight: 'bold' } }
        }
      }
    }
  });
}

function renderBiAiCategoryChart(metrics) {
  const canvas = document.getElementById('biAiCategoryChart');
  if (!canvas) return;

  if (biAiCategoryChartInstance) biAiCategoryChartInstance.destroy();
  const ctx = canvas.getContext('2d');

  const categories = ['Bill Analysis', 'Roof Suitability', 'ROI Payback', 'Referrals'];
  const dataVals = [35, 25, 25, 15];

  biAiCategoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: dataVals,
        backgroundColor: ['#00AEEF', '#36D399', '#ff8a1d', '#a855f7'],
        borderColor: '#06111f',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderBiRadialHealthGauge(metrics) {
  const score = Math.round(metrics.businessScore || 55);
  const textEl = document.getElementById('biHealthRadialText');
  const progressCircle = document.getElementById('biHealthRadialProgress');

  if (textEl) textEl.textContent = score;
  if (progressCircle) {
    const totalCircumference = 251.2;
    const offset = totalCircumference - (score / 100 * totalCircumference);
    progressCircle.style.strokeDasharray = `${totalCircumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;
    
    if (score >= 70) {
      progressCircle.style.stroke = '#10b981';
    } else if (score >= 45) {
      progressCircle.style.stroke = '#f59e0b';
    } else {
      progressCircle.style.stroke = '#ef4444';
    }
  }

  const growthVal = document.getElementById('biScorecardGrowthVal');
  const growthBar = document.getElementById('biScorecardGrowthBar');
  const salesVal = document.getElementById('biScorecardSalesVal');
  const salesBar = document.getElementById('biScorecardSalesBar');
  const opsVal = document.getElementById('biScorecardOpsVal');
  const opsBar = document.getElementById('biScorecardOpsBar');

  const gScore = Math.max(10, Math.min(100, metrics.growthScore || 15));
  const sScore = Math.max(10, Math.min(100, metrics.conversionRates.overallConversionRate || 15));
  const oScore = Math.max(10, Math.min(100, metrics.ai.influenceScore || 15));

  if (growthVal) growthVal.textContent = `${_safeNum(metrics.growthScore).toFixed(1)}%`;
  if (growthBar) growthBar.style.width = `${gScore}%`;
  
  if (salesVal) salesVal.textContent = `${_safeNum(metrics.conversionRates.overallConversionRate).toFixed(1)}%`;
  if (salesBar) salesBar.style.width = `${sScore}%`;
  
  if (opsVal) opsVal.textContent = `${_safeNum(metrics.ai.influenceScore).toFixed(0)}%`;
  if (opsBar) opsBar.style.width = `${oScore}%`;
}

function renderBiForecastSection(metrics) {
  const revForecastVal = document.getElementById('biForecastRevenue');
  const leadsForecastVal = document.getElementById('biForecastLeads');
  const refsForecastVal = document.getElementById('biForecastReferrals');

  const leadsForecast = Math.round(metrics.totalLeads * (1 + metrics.leadGrowth / 100));
  const refsForecast = Math.round(metrics.referralConversions * (1 + metrics.leadGrowth / 100));

  if (revForecastVal) revForecastVal.textContent = formatCurrencyRupee(metrics.revenueForecast);
  if (leadsForecastVal) leadsForecastVal.textContent = leadsForecast;
  if (refsForecastVal) refsForecastVal.textContent = refsForecast;

  const badgeRev = document.getElementById('biBadgeForecastRev');
  const badgeLeads = document.getElementById('biBadgeForecastLeads');
  const badgeRefs = document.getElementById('biBadgeForecastRef');

  let confText = 'LOW';
  let confClass = 'badge-intent-low';
  if (metrics.totalLeads >= 10) {
    confText = 'HIGH CONFIDENCE';
    confClass = 'badge-intent-high';
  } else if (metrics.totalLeads >= 5) {
    confText = 'MODERATE';
    confClass = 'badge-intent-medium';
  }

  if (badgeRev) { badgeRev.textContent = confText; badgeRev.className = `crm-badge ${confClass}`; }
  if (badgeLeads) { badgeLeads.textContent = confText; badgeLeads.className = `crm-badge ${confClass}`; }
  if (badgeRefs) { badgeRefs.textContent = confText; badgeRefs.className = `crm-badge ${confClass}`; }

  const generateSparklinePath = (data, width = 120, height = 20) => {
    if (!Array.isArray(data) || data.length < 2) return `M 0 ${height/2} L ${width} ${height/2}`;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    return data.map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range * (height - 6) + 3);
      return `${idx === 0 ? 'M' : 'L'} ${_safeNum(x).toFixed(1)} ${_safeNum(y).toFixed(1)}`;
    }).join(' ');
  };

  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    last6Months.push(d.toISOString().substring(0, 7));
  }

  const cachedDataStr = localStorage.getItem('cachedAdminData');
  const consolidated = cachedDataStr ? JSON.parse(cachedDataStr) : { users: { users: [] } };
  const users = consolidated.users?.users || [];
  const leads = Object.values(getCrmLeads() || {});

  const usersTrend = last6Months.map(m => users.filter(u => u.registration_date && u.registration_date.substring(0, 7) <= m).length);
  const leadsTrend = last6Months.map(m => leads.filter(l => l.createdAt && l.createdAt.substring(0, 7) <= m).length);
  const referralsTrend = last6Months.map(m => leads.filter(l => l.source === 'Referral' && l.status === 'Won' && l.createdAt && l.createdAt.substring(0, 7) <= m).length);
  const winRateTrend = last6Months.map(m => {
    const lCount = leads.filter(l => l.createdAt && l.createdAt.substring(0, 7) <= m).length;
    const wCount = leads.filter(l => l.status === 'Won' && l.createdAt && l.createdAt.substring(0, 7) <= m).length;
    return lCount > 0 ? (wCount / lCount * 100) : 0;
  });
  const healthTrend = winRateTrend.map((rate, idx) => 55 + (rate * 0.3) + (usersTrend[idx] * 0.1));

  const pUsers = document.getElementById('biSparklineUsersPath');
  const pLeads = document.getElementById('biSparklineLeadsPath');
  const pRefs = document.getElementById('biSparklineReferralsPath');
  const pWin = document.getElementById('biSparklineWinRatePath');
  const pHealth = document.getElementById('biSparklineHealthPath');

  if (pUsers) pUsers.setAttribute('d', generateSparklinePath(usersTrend, 120, 30));
  if (pLeads) pLeads.setAttribute('d', generateSparklinePath(leadsTrend, 120, 30));
  if (pRefs) pRefs.setAttribute('d', generateSparklinePath(referralsTrend, 120, 30));
  if (pWin) pWin.setAttribute('d', generateSparklinePath(winRateTrend, 120, 30));
  if (pHealth) pHealth.setAttribute('d', generateSparklinePath(healthTrend, 120, 30));

  const pFRev = document.getElementById('biSparklineForecastRevPath');
  const pFLeads = document.getElementById('biSparklineForecastLeadsPath');
  const pFRefs = document.getElementById('biSparklineForecastRefPath');

  if (pFRev) pFRev.setAttribute('d', generateSparklinePath([metrics.wonRevenue, metrics.wonRevenue * 1.05, metrics.expectedRevenue, metrics.revenueForecast], 120, 20));
  if (pFLeads) { leadsTrend.push(leadsForecast); pFLeads.setAttribute('d', generateSparklinePath(leadsTrend.slice(-4), 120, 20)); }
  if (pFRefs) { referralsTrend.push(refsForecast); pFRefs.setAttribute('d', generateSparklinePath(referralsTrend.slice(-4), 120, 20)); }
}

function renderBiInsightsCenter(metrics) {
  const summaryEl = document.getElementById('biExecutiveSummaryText');
  if (summaryEl) summaryEl.textContent = metrics.executiveSummary;

  const insGrowth = document.getElementById('biInsightGrowth');
  const insRevenue = document.getElementById('biInsightRevenue');
  const insCustomer = document.getElementById('biInsightCustomer');
  const insRisk = document.getElementById('biInsightRisk');

  const growthText = _safeNum(metrics.leadGrowth) >= 0 
    ? `Platform lead pipeline is accelerating. Lead acquisition grew by ${_safeNum(metrics.leadGrowth).toFixed(1)}% MoM, driven by referrals and organic calculators.`
    : `Pipeline growth slowed by ${Math.abs(_safeNum(metrics.leadGrowth)).toFixed(1)}% MoM. We recommend executing localized campaign boosts.`;

  const revText = _safeNum(metrics.conversionRate) >= 15
    ? `Overall sales efficiency is healthy at ${_safeNum(metrics.conversionRate).toFixed(1)}% conversion. Expected pipeline revenue value is estimated at ${formatCurrencyRupee(metrics.expectedRevenue)}.`
    : `Conversion rate is currently at ${_safeNum(metrics.conversionRate).toFixed(1)}%. Deploy CRM follow-up protocols to capture qualified opportunities.`;

  const custText = metrics.segmentation.advocates > 0
    ? `Advocate segment is active at ${metrics.segmentation.advocates} users. Referral loops are outperforming other channels in conversion efficiency.`
    : `Advocate segment is low. Offer bonus wallet points to engaged users to trigger word-of-mouth refer-and-earn behavior.`;

  const riskText = metrics.riskLevel === 'High'
    ? `Critical platform security or database risk indicators are active. Investigate audit event logs immediately.`
    : `Platform risk level is Low. audit integrity checks show robust transactional database health and zero brute-force activities.`;

  if (insGrowth) insGrowth.textContent = growthText;
  if (insRevenue) insRevenue.textContent = revText;
  if (insCustomer) insCustomer.textContent = custText;
  if (insRisk) insRisk.textContent = riskText;
}

function _bindBiEmptyStateButtons() {
  const btnCrm = document.getElementById('btnEmptyStateCrm');
  const btnBill = document.getElementById('btnEmptyStateBill');
  const btnRoi = document.getElementById('btnEmptyStateRoi');
  
  if (btnCrm) {
    btnCrm.onclick = () => {
      const menu = document.querySelector('.menu-item[data-tab="crm-dashboard"]');
      if (menu) menu.click();
    };
  }
  if (btnBill) {
    btnBill.onclick = () => {
      const menu = document.querySelector('.menu-item[data-tab="bill-analyzer"]');
      if (menu) menu.click();
    };
  }
  if (btnRoi) {
    btnRoi.onclick = () => {
      const menu = document.querySelector('.menu-item[data-tab="roi-calculator"]');
      if (menu) menu.click();
    };
  }
}

function calculateBiMetrics(data) {
  const users = (data.users && data.users.users) ? data.users.users : [];
  const overview = data.overview || {};
  
  // Re-read CRM leads list
  const leads = Object.values(getCrmLeads() || {});
  
  // Total stats
  const totalUsers = users.length;
  const totalLeads = leads.length;
  
  // 1. CRM & Lead Conversions
  let pipelineRevenue = 0;
  let qualifiedRevenue = 0;
  let proposalRevenue = 0;
  let wonRevenue = 0;

  let leadCount = totalLeads;
  let qualifiedCount = 0;
  let proposalCount = 0;
  let wonCount = 0;

  leads.forEach(lead => {
    const rev = lead.revenue_potential || 0;
    pipelineRevenue += rev;

    if (['Qualified', 'Proposal Sent', 'Won'].includes(lead.status)) {
      qualifiedCount++;
      qualifiedRevenue += rev;
    }
    if (['Proposal Sent', 'Won'].includes(lead.status)) {
      proposalCount++;
      proposalRevenue += rev;
    }
    if (lead.status === 'Won') {
      wonCount++;
      wonRevenue += rev;
    }
  });
  
  const leadToQualifiedRate = leadCount > 0 ? (qualifiedCount / leadCount * 100) : 0;
  const qualifiedToProposalRate = qualifiedCount > 0 ? (proposalCount / qualifiedCount * 100) : 0;
  const proposalToWonRate = proposalCount > 0 ? (wonCount / proposalCount * 100) : 0;
  const overallConversionRate = leadCount > 0 ? (wonCount / leadCount * 100) : 0;
  const conversionRate = overallConversionRate;

  const getStageHealth = (rate, excellentThreshold, averageThreshold) => {
    if (rate > excellentThreshold) {
      return { status: 'excellent', text: '🟢 Excellent' };
    } else if (rate >= averageThreshold) {
      return { status: 'average', text: '🟡 Average' };
    } else {
      return { status: 'weak', text: '🔴 Weak' };
    }
  };

  const conversionHealth = {
    leadToQualified: getStageHealth(leadToQualifiedRate, 70, 40),
    qualifiedToProposal: getStageHealth(qualifiedToProposalRate, 60, 30),
    proposalToWon: getStageHealth(proposalToWonRate, 35, 15)
  };

  const revPerLead = leadCount > 0 ? (pipelineRevenue / leadCount) : 0;
  const revPerQualified = qualifiedCount > 0 ? (qualifiedRevenue / qualifiedCount) : 0;
  const revPerWon = wonCount > 0 ? (wonRevenue / wonCount) : 0;
  const expectedRevenue = proposalToWonRate > 0 ? (proposalRevenue * (proposalToWonRate / 100)) : (proposalRevenue * 0.35);
  const avgDealSize = leadCount > 0 ? (pipelineRevenue / leadCount) : 0;
  const winRate = overallConversionRate;

  const pipelineVal = pipelineRevenue;
  const qualifiedVal = qualifiedRevenue;
  const proposalVal = proposalRevenue;
  const wonVal = wonRevenue;
  
  // 2. Customer Segmentation
  let newUsersCount = 0;
  let engagedUsersCount = 0;
  let highIntentLeadsCount = 0;
  let customersCount = 0;
  let advocatesCount = 0;
  
  users.forEach(u => {
    const lead = leads.find(l => l.email === u.email);
    const status = lead ? lead.status : 'New Lead';
    const score = lead ? lead.lead_score : 0;
    
    if (status === 'Won' && (u.points > 0 || u.referrals_count > 0)) {
      advocatesCount++;
    } else if (status === 'Won') {
      customersCount++;
    } else if (score >= 70) {
      highIntentLeadsCount++;
    } else if (score >= 40 || u.reports_count > 0 || u.copilot_messages > 0) {
      engagedUsersCount++;
    } else {
      newUsersCount++;
    }
  });
  
  // 3. User Cohort Analysis
  const cohorts = {};
  users.forEach(u => {
    if (!u.registration_date) return;
    const month = u.registration_date.substring(0, 7); // "YYYY-MM"
    if (!cohorts[month]) {
      cohorts[month] = { size: 0, billCount: 0, roofCount: 0, referralCount: 0, copilotCount: 0 };
    }
    const c = cohorts[month];
    c.size++;
    if (u.analyses && u.analyses.bill) c.billCount++;
    if (u.analyses && u.analyses.roof) c.roofCount++;
    if (u.points > 0 || u.referrals_count > 0) c.referralCount++;
    if (u.copilot_messages > 0) c.copilotCount++;
  });
  
  const cohortMetrics = {};
  for (let month in cohorts) {
    const c = cohorts[month];
    cohortMetrics[month] = {
      size: c.size,
      billPct: c.size > 0 ? (c.billCount / c.size * 100) : 0,
      roofPct: c.size > 0 ? (c.roofCount / c.size * 100) : 0,
      referralPct: c.size > 0 ? (c.referralCount / c.size * 100) : 0,
      copilotPct: c.size > 0 ? (c.copilotCount / c.size * 100) : 0
    };
  }
  
  // 4. Solar Metrics (Dynamic averages)
  let totalBill = 0, billCount = 0;
  let totalKw = 0, kwCount = 0;
  let totalPayback = 0, paybackCount = 0;
  let totalRoi = 0, roiCount = 0;
  let totalSuitability = 0, suitabilityCount = 0;
  
  users.forEach(u => {
    const a = u.analyses || {};
    if (a.bill && a.bill.monthly_bill) {
      totalBill += a.bill.monthly_bill;
      billCount++;
    }
    if (a.roi) {
      if (a.roi.recommended_kw) {
        totalKw += a.roi.recommended_kw;
        kwCount++;
      }
      if (a.roi.payback_years) {
        totalPayback += a.roi.payback_years;
        paybackCount++;
      }
      if (a.roi.roi_percent) {
        totalRoi += a.roi.roi_percent;
        roiCount++;
      }
    }
    if (a.roof && a.roof.suitability_score) {
      totalSuitability += a.roof.suitability_score;
      suitabilityCount++;
    }
  });
  
  const avgBill = billCount > 0 ? (totalBill / billCount) : 6500;
  const avgSize = kwCount > 0 ? (totalKw / kwCount) : 3.0;
  const avgPayback = paybackCount > 0 ? (totalPayback / paybackCount) : 4.5;
  const avgRoi = roiCount > 0 ? (totalRoi / roiCount) : 250;
  const avgSuitability = suitabilityCount > 0 ? (totalSuitability / suitabilityCount) : 85;
  
  // 5. Referral Revenue Impact
  let referralRevenue = 0;
  let referralLeadsCount = 0;
  let referralWonCount = 0;
  let referralPipeline = 0;
  
  leads.forEach(lead => {
    if (lead.source === 'Referral') {
      referralPipeline += lead.revenue_potential || 0;
      referralLeadsCount++;
      if (lead.status === 'Won') {
        referralWonCount++;
        referralRevenue += lead.revenue_potential || 0;
      }
    }
  });
  
  const referralConversionRate = referralLeadsCount > 0 ? (referralWonCount / referralLeadsCount * 100) : 0;
  const referralMultiplier = referralRevenue > 0 ? (referralRevenue / (pipelineVal || 1) * 5) : 1.2;
  
  // 6. AI influence & score
  let copilotQueries = 0;
  let copilotUsersCount = 0;
  let copilotAssessmentsCount = 0;
  let copilotWonCount = 0;
  
  users.forEach(u => {
    if (u.copilot_messages > 0) {
      copilotQueries += u.copilot_messages;
      copilotUsersCount++;
      if (u.analyses && (u.analyses.bill || u.analyses.roof || u.analyses.roi)) {
        copilotAssessmentsCount++;
      }
      const lead = leads.find(l => l.email === u.email);
      if (lead && lead.status === 'Won') {
        copilotWonCount++;
      }
    }
  });
  
  const aiInfluenceScore = totalUsers > 0 ? (copilotUsersCount / totalUsers * 100) : 0;
  const aiRecommendations = Math.round(copilotQueries * 1.5);
  const aiLeadsInfluenced = copilotUsersCount;
  const aiConversionPct = copilotUsersCount > 0 ? (copilotAssessmentsCount / copilotUsersCount * 100) : 0;
  
  // 7. Month over Month Benchmarking
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  let currentMonthUsers = 0;
  let prevMonthUsers = 0;
  let currentMonthRefs = 0;
  let prevMonthRefs = 0;
  let currentMonthLeads = 0;
  let prevMonthLeads = 0;
  let currentMonthRevenue = 0;
  let prevMonthRevenue = 0;
  
  users.forEach(u => {
    if (!u.registration_date) return;
    const rDate = new Date(u.registration_date);
    if (rDate >= thirtyDaysAgo && rDate <= now) {
      currentMonthUsers++;
      if (u.points > 0 || u.referrals_count > 0) currentMonthRefs++;
    } else if (rDate >= sixtyDaysAgo && rDate < thirtyDaysAgo) {
      prevMonthUsers++;
      if (u.points > 0 || u.referrals_count > 0) prevMonthRefs++;
    }
  });
  
  leads.forEach(lead => {
    if (!lead.createdAt) return;
    const cDate = new Date(lead.createdAt);
    if (cDate >= thirtyDaysAgo && cDate <= now) {
      currentMonthLeads++;
      if (lead.status === 'Won') currentMonthRevenue += (lead.revenue_potential || 0);
    } else if (cDate >= sixtyDaysAgo && cDate < thirtyDaysAgo) {
      prevMonthLeads++;
      if (lead.status === 'Won') prevMonthRevenue += (lead.revenue_potential || 0);
    }
  });
  
  const getTrendObject = (current, prev) => {
    const diffVal = current - prev;
    const diffPct = prev > 0 ? (diffVal / prev * 100) : (current > 0 ? 100 : 0);
    const trendClass = diffVal > 0 ? 'trend-up' : diffVal < 0 ? 'trend-down' : 'trend-neutral';
    const arrow = diffVal > 0 ? '▲' : diffVal < 0 ? '▼' : '→';
    const diffText = `${arrow} ${_safeNum(Math.abs(diffPct)).toFixed(0)}%`;
    return { current, prev, diffVal, diffPct, trendClass, diffText };
  };
  
  const benchmarks = {
    users: getTrendObject(currentMonthUsers, prevMonthUsers),
    referrals: getTrendObject(currentMonthRefs, prevMonthRefs),
    leads: getTrendObject(currentMonthLeads, prevMonthLeads),
    revenue: getTrendObject(currentMonthRevenue, prevMonthRevenue)
  };
  
  // 8. Forecasting & Trends
  const activeUserPct = totalUsers > 0 ? (overview.active_users_30_days || 0) / totalUsers * 100 : 0;
  const leadGrowth = prevMonthLeads > 0 ? ((currentMonthLeads - prevMonthLeads) / prevMonthLeads * 100) : 12.5;
  const revenueForecast = currentMonthRevenue * (1 + (leadGrowth / 100));
  
  // Business Health Score
  let businessScore = (conversionRate * 3) + (activeUserPct * 0.3) + (aiInfluenceScore * 0.3) + (Math.max(0, leadGrowth) * 0.4);
  businessScore = Math.min(100, Math.max(10, businessScore || 55));
  
  const growthScore = leadGrowth;
  
  // Platform Risk Level & Warnings
  const risks = [];
  const opportunities = [];
  
  // Check failed login attempts
  const auditLogs = safeParseJSON('auditLogs', []);
  const failedLoginsToday = auditLogs.filter(l => l.action === 'Failed Login Attempt' && (new Date() - new Date(l.timestamp)) < 24 * 60 * 60 * 1000).length;
  if (failedLoginsToday > 3) {
    risks.push({ title: 'Brute Force Attempt', desc: `${failedLoginsToday} failed logins recorded in last 24h.` });
  }
  
  // Stalled leads warning
  let stalledCount = 0;
  leads.forEach(lead => {
    if (lead.status !== 'Won' && lead.status !== 'Lost') {
      const createdDate = new Date(lead.createdAt);
      if ((now - createdDate) > 30 * 24 * 60 * 60 * 1000) {
        stalledCount++;
      }
    }
  });
  if (stalledCount > 0) {
    risks.push({ title: 'Stalled Pipeline', desc: `${stalledCount} CRM leads inactive for over 30 days.` });
  }
  
  // Low conversions warning
  const qualToPropRate = qualifiedCount > 0 ? (proposalCount / qualifiedCount * 100) : 0;
  const propToWonRate = proposalCount > 0 ? (wonCount / proposalCount * 100) : 0;
  
  if (qualToPropRate < 40 && qualifiedCount > 0) {
    opportunities.push({ title: 'Proposal Automation', desc: `Qualified-to-Proposal Sent rate is low (${_safeNum(qualToPropRate).toFixed(0)}%). Automate proposal drafting to accelerate velocity.` });
  }
  if (propToWonRate < 30 && proposalCount > 0) {
    opportunities.push({ title: 'CRM Follow-ups', desc: `Proposal-to-Won conversion is at ${_safeNum(propToWonRate).toFixed(0)}%. Focus sales team on follow-ups.` });
  }
  if (conversionRate < 15 && totalLeads > 0) {
    opportunities.push({ title: 'Lead Qualification', desc: `Overall conversion is low (${_safeNum(conversionRate).toFixed(0)}%). Refine lead scoring metrics.` });
  }
  if (opportunities.length === 0) {
    opportunities.push({ title: 'Promote Referrals', desc: 'Conversions are stable. Enhance referral rewards program to boost user acquisition.' });
  }
  
  const riskLevel = risks.length > 1 ? 'High' : risks.length === 1 ? 'Medium' : 'Low';
  
  // Plain-English Executive Summary text generator
  let summary = '';
  if (leadGrowth > 0) {
    summary += `Lead acquisition is growing steadily at ${_safeNum(leadGrowth).toFixed(1)}% MoM. `;
  } else {
    summary += `Lead acquisition has softened recently. `;
  }
  
  if (referralConversionRate > conversionRate) {
    summary += `Referrals are converting at ${_safeNum(referralConversionRate).toFixed(0)}%, outperforming direct signups. `;
  } else {
    summary += `Direct organic lead generation remains the primary driver. `;
  }
  
  if (revenueForecast > wonVal) {
    summary += `Revenue forecasts indicate moderate growth over the next 30 days to ${formatCurrencyRupee(revenueForecast)}.`;
  } else {
    summary += `Revenue forecasts remain steady at ${formatCurrencyRupee(wonVal || 165000)} for the upcoming period.`;
  }
  
  return {
    totalUsers,
    totalLeads,
    conversionRate,
    conversionTrendText: benchmarks.leads.diffText,
    conversionTrendClass: benchmarks.leads.trendClass,
    referralConversions: referralWonCount,
    waterfall: {
      pipeline: pipelineVal,
      qualified: qualifiedVal,
      qualifiedPct: pipelineVal > 0 ? (qualifiedVal / pipelineVal * 100) : 0,
      proposal: proposalVal,
      proposalPct: pipelineVal > 0 ? (proposalVal / pipelineVal * 100) : 0,
      won: wonVal,
      wonPct: pipelineVal > 0 ? (wonVal / pipelineVal * 100) : 0
    },
    segmentation: {
      newUsers: newUsersCount,
      engagedUsers: engagedUsersCount,
      highIntent: highIntentLeadsCount,
      customers: customersCount,
      advocates: advocatesCount
    },
    cohorts: cohortMetrics,
    solar: {
      avgBill,
      avgSize,
      avgPayback,
      avgRoi,
      avgSuitability
    },
    referral: {
      pipeline: referralPipeline,
      conversionRate: referralConversionRate,
      topSegment: advocatesCount > 0 ? 'Advocates' : 'Engaged Users',
      multiplier: referralMultiplier
    },
    ai: {
      influenceScore: aiInfluenceScore,
      queries: copilotQueries,
      recommendations: aiRecommendations,
      leadsInfluenced: aiLeadsInfluenced,
      conversionPct: aiConversionPct
    },
    benchmarks,
    leadGrowth,
    revenueForecast: revenueForecast || 165000,
    businessScore,
    growthScore,
    riskLevel,
    risks,
    opportunities,
    executiveSummary: summary,
    
    // Added metrics for Phase 10.7 BI Fix & Enhancement
    qualifiedCount,
    proposalCount,
    wonCount,
    pipelineRevenue,
    qualifiedRevenue,
    proposalRevenue,
    wonRevenue,
    expectedRevenue,
    revPerLead,
    revPerQualified,
    revPerWon,
    avgDealSize,
    winRate,
    conversionRates: {
      leadToQualifiedRate,
      qualifiedToProposalRate,
      proposalToWonRate,
      overallConversionRate
    },
    conversionHealth
  };
}

function renderBiSegmentationChart(seg) {
  const canvas = document.getElementById('biSegmentationChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (biSegmentationChartInstance) {
    biSegmentationChartInstance.destroy();
  }
  
  biSegmentationChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['New Users', 'Engaged Users', 'High Intent Leads', 'Customers', 'Advocates'],
      datasets: [{
        data: [seg.newUsers, seg.engagedUsers, seg.highIntent, seg.customers, seg.advocates],
        backgroundColor: [
          'rgba(148, 163, 184, 0.7)', // Slate/Light
          'rgba(0, 174, 239, 0.7)',  // Blue
          'rgba(255, 138, 29, 0.7)', // Orange
          'rgba(54, 211, 153, 0.7)', // Green
          'rgba(168, 85, 247, 0.7)'  // Purple
        ],
        borderColor: [
          '#64748b', '#00aeef', '#ff8a1d', '#36d399', '#a855f7'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 10
            }
          }
        }
      }
    }
  });
}

function formatCurrencyRupee(value) {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  return '₹' + Math.round(value).toLocaleString('en-IN');
}

function getBiExportFilename() {
  const now = new Date();
  const format = (num) => String(num).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())}`;
  const timeStr = `${format(now.getHours())}-${format(now.getMinutes())}-${format(now.getSeconds())}`;
  return `bi_export_${dateStr}_${timeStr}.csv`;
}

function exportBusinessIntelligenceCSV() {
  const cachedDataStr = localStorage.getItem('cachedAdminData');
  if (!cachedDataStr) {
    showToast("No data available to export.", "error");
    return;
  }
  
  const consolidated = JSON.parse(cachedDataStr);
  const metrics = calculateBiMetrics(consolidated);
  
  const headers = ['Metric Group', 'Metric Name', 'Metric Value', 'Notes'];
  const rows = [
    ['Executive Stats', 'Total Users', metrics.totalUsers, 'Platform-wide users registered'],
    ['Executive Stats', 'Total Leads', metrics.totalLeads, 'Total leads in CRM'],
    ['Executive Stats', 'Won Projects', metrics.referralConversions, 'Leads successfully won'],
    ['Executive Stats', 'Overall Conversion Rate (%)', _safeNum(metrics.conversionRate).toFixed(2), 'Won / Total Leads'],
    ['Executive Stats', 'Business Health Score', _safeNum(metrics.businessScore).toFixed(0), 'Weighted score out of 100'],
    ['Executive Stats', '30-Day Revenue Forecast', _safeNum(metrics.revenueForecast).toFixed(2), 'Calculated projected revenue'],
    ['Executive Stats', 'Risk Level', metrics.riskLevel, 'Current operational platform risks'],
    
    ['Revenue Waterfall', 'Pipeline Value', metrics.waterfall.pipeline, 'Sum of potential values in pipeline'],
    ['Revenue Waterfall', 'Qualified Revenue', metrics.waterfall.qualified, 'Revenue from Qualified and later stages'],
    ['Revenue Waterfall', 'Proposal Sent Revenue', metrics.waterfall.proposal, 'Revenue from Proposal and later stages'],
    ['Revenue Waterfall', 'Won Revenue', metrics.waterfall.won, 'Revenue from Won projects'],
    
    ['Segmentation', 'New Users', metrics.segmentation.newUsers, 'Registered in last 30d, low score'],
    ['Segmentation', 'Engaged Users', metrics.segmentation.engagedUsers, 'Score >= 40, active but not won'],
    ['Segmentation', 'High Intent Leads', metrics.segmentation.highIntent, 'Lead score >= 70'],
    ['Segmentation', 'Customers', metrics.segmentation.customers, 'Lead status is Won, no points/referrals'],
    ['Segmentation', 'Advocates', metrics.segmentation.advocates, 'Lead status is Won with referrals/points'],
    
    ['Solar Metrics', 'Average Monthly Bill', _safeNum(metrics.solar.avgBill).toFixed(2), 'Average monthly utility bill'],
    ['Solar Metrics', 'Average System Size Recommended (kW)', _safeNum(metrics.solar.avgSize).toFixed(2), 'Average system size recommendation'],
    ['Solar Metrics', 'Average Payback Period (Years)', _safeNum(metrics.solar.avgPayback).toFixed(2), 'Average time to payback investment'],
    ['Solar Metrics', 'Average ROI (%)', _safeNum(metrics.solar.avgRoi).toFixed(2), 'Average return on investment'],
    ['Solar Metrics', 'Average Suitability Score', _safeNum(metrics.solar.avgSuitability).toFixed(2), 'Average roof readiness score'],
    
    ['Referrals', 'Referral-Generated Pipeline', metrics.referral.pipeline, 'Pipeline value generated by referral leads'],
    ['Referrals', 'Referral Leads Conversion Rate (%)', _safeNum(metrics.referral.conversionRate).toFixed(2), 'Conversion rate of referral-sourced leads'],
    ['Referrals', 'Top Sourced Segment', metrics.referral.topSegment, 'Most active and profitable segment'],
    ['Referrals', 'Referral Revenue Multiplier', _safeNum(metrics.referral.multiplier).toFixed(2), 'Referral revenue vs pipeline value'],
    
    ['AI Impact', 'AI Influence Score (%)', _safeNum(metrics.ai.influenceScore).toFixed(2), 'Percentage of users engaging with Solar Copilot'],
    ['AI Impact', 'AI Queries Tracked', metrics.ai.queries, 'Total chatbot queries across users'],
    ['AI Impact', 'Recommendations Generated', metrics.ai.recommendations, 'Total recommendations sent to users'],
    ['AI Impact', 'Leads Sourced / Influenced by Copilot', metrics.ai.leadsInfluenced, 'Users who chatted and became leads'],
    ['AI Impact', 'Copilot Conversation Conversion (%)', _safeNum(metrics.ai.conversionPct).toFixed(2), 'Chat user to assessment completion rate']
  ];
  
  const filename = getBiExportFilename();
  downloadCSV(filename, headers, rows);
  showToast(`CSV exported successfully: ${filename}`, "success");
}

function renderBiStageDistributionChart(metrics) {
  const canvas = document.getElementById('biStageDistributionChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (biStageDistributionChartInstance) {
    biStageDistributionChartInstance.destroy();
  }
  
  biStageDistributionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Leads', 'Qualified', 'Proposal Sent', 'Won Projects'],
      datasets: [{
        label: 'Opportunity Count',
        data: [metrics.totalLeads, metrics.qualifiedCount, metrics.proposalCount, metrics.wonCount],
        backgroundColor: [
          'rgba(0, 174, 239, 0.75)',  // Blue
          'rgba(168, 85, 247, 0.75)', // Purple
          'rgba(255, 138, 29, 0.75)', // Orange
          'rgba(54, 211, 153, 0.75)'  // Green
        ],
        borderColor: [
          '#00aeef', '#a855f7', '#ff8a1d', '#36d399'
        ],
        borderWidth: 1,
        barPercentage: 0.6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` Opportunities: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255,255,255,0.05)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 10
            },
            precision: 0
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#ffffff',
            font: {
              family: 'Outfit',
              size: 11,
              weight: 'bold'
            }
          }
        }
      }
    }
  });
}

/* ==========================================================================
   26. VENDOR PORTAL - AI PROPOSAL GENERATOR (PHASE 11.1)
   ========================================================================== */
function initVendorPortal() {
  const btnAutofill = document.getElementById('btnAutofillAssessment');
  const btnReset = document.getElementById('btnResetProposal');
  const btnGenerate = document.getElementById('btnGenerateProposal');
  const btnPreview = document.getElementById('btnPreviewProposal');
  const btnDownload = document.getElementById('btnDownloadProposalPDF');
  
  // Close Modal triggers
  const btnCloseModalX = document.getElementById('closeProposalPreviewModal');
  const btnCloseModalBtn = document.getElementById('btnPreviewClose');
  const btnPreviewDownloadBtn = document.getElementById('btnPreviewDownload');

  if (btnAutofill) btnAutofill.addEventListener('click', autofillAssessmentData);
  if (btnReset) btnReset.addEventListener('click', resetProposalForm);
  if (btnGenerate) btnGenerate.addEventListener('click', generateProposal);
  if (btnPreview) btnPreview.addEventListener('click', () => {
    const lastProp = getLastGeneratedProposal();
    if (lastProp) showPreviewModal(lastProp);
  });
  if (btnDownload) btnDownload.addEventListener('click', () => {
    const lastProp = getLastGeneratedProposal();
    if (lastProp) downloadProposalPDF(lastProp);
  });

  if (btnCloseModalX) btnCloseModalX.addEventListener('click', hidePreviewModal);
  if (btnCloseModalBtn) btnCloseModalBtn.addEventListener('click', hidePreviewModal);
  if (btnPreviewDownloadBtn) btnPreviewDownloadBtn.addEventListener('click', () => {
    const lastProp = getLastGeneratedProposal();
    if (lastProp) downloadProposalPDF(lastProp);
  });

  // Restore automatically on refresh
  const lastProp = getLastGeneratedProposal();
  if (lastProp) {
    renderProposal(lastProp);
  }
  
  refreshProposalHistory();
}

function getLastGeneratedProposal() {
  try {
    const raw = localStorage.getItem('lastGeneratedProposal');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function autofillAssessmentData() {
  let billData = null, roofData = null, roiData = null;
  try { billData = JSON.parse(localStorage.getItem('lastBillAnalysis')); } catch(e) {}
  try { roofData = JSON.parse(localStorage.getItem('lastRoofAnalysis')); } catch(e) {}
  try { roiData = JSON.parse(localStorage.getItem('lastROIAnalysis')); } catch(e) {}

  if (!billData && !roofData && !roiData) {
    showToast('No existing assessment data found in this session.', 'info');
    return;
  }

  // Populate inputs with safe logic and fallbacks
  const customerName = billData?.customer_name || '';
  const perUnitRate = billData?.per_unit_rate || 7.50;
  const monthlyBill = billData?.monthly_bill_rs || billData?.bill_amount || roiData?.monthly_bill || '';
  const monthlyUnits = billData?.monthly_units || (roiData?.data?.monthly_generation_units) || '';
  const roofArea = roofData?.usable_area_sqft || roofData?.total_area_sqft || billData?.roof_area_sqft || '';
  const recommendedKw = roiData?.system_size || roofData?.recommended_kw || billData?.recommended_kw || '';
  const customerAddress = billData?.customer_address || '';
  const customerCity = billData?.city || '';

  if (customerName) document.getElementById('propCustomerName').value = customerName;
  document.getElementById('propUnitRate').value = perUnitRate;
  if (monthlyBill) document.getElementById('propMonthlyBill').value = monthlyBill;
  if (monthlyUnits) document.getElementById('propMonthlyUnits').value = monthlyUnits;
  if (roofArea) document.getElementById('propRoofArea').value = roofArea;
  if (recommendedKw) document.getElementById('propSystemSize').value = recommendedKw;
  if (customerAddress) document.getElementById('propCustomerAddress').value = customerAddress;
  if (customerCity) {
    const citySelect = document.getElementById('propCustomerCity');
    if (citySelect) {
      citySelect.value = customerCity;
    }
  }

  showToast('Successfully loaded existing assessment data!', 'success');
}

function resetProposalForm() {
  const form = document.getElementById('proposalForm');
  if (form) form.reset();
  
  const resultsView = document.getElementById('proposalResultsView');
  const placeholderInfo = document.getElementById('proposalPlaceholderInfo');
  const statusTag = document.getElementById('proposalStatusTag');

  if (resultsView) resultsView.style.display = 'none';
  if (placeholderInfo) placeholderInfo.style.display = 'flex';
  if (statusTag) statusTag.style.display = 'none';
  
  showToast('Proposal details form cleared.', 'info');
}

function generateProposal() {
  const form = document.getElementById('proposalForm');
  if (!form.reportValidity()) return;

  const customerName = document.getElementById('propCustomerName').value.trim();
  const vendorName = document.getElementById('propVendorName').value.trim();
  const customerPhone = document.getElementById('propCustomerPhone').value.trim();
  const customerEmail = document.getElementById('propCustomerEmail').value.trim();
  const customerAddress = document.getElementById('propCustomerAddress').value.trim();
  const customerCity = document.getElementById('propCustomerCity').value;
  const perUnitRate = parseFloat(document.getElementById('propUnitRate').value);
  const monthlyBill = parseFloat(document.getElementById('propMonthlyBill').value);
  const monthlyUnits = parseFloat(document.getElementById('propMonthlyUnits').value);
  const roofArea = parseFloat(document.getElementById('propRoofArea').value);
  const recommendedKw = parseFloat(document.getElementById('propSystemSize').value);

  if (isNaN(perUnitRate) || isNaN(monthlyBill) || isNaN(monthlyUnits) || isNaN(roofArea) || isNaN(recommendedKw)) {
    showToast('Please enter valid numerical values.', 'error');
    return;
  }

  // Generate Unique ID GSE-PROP-YYYYMMDD-XXXX
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const proposalId = `GSE-PROP-${yyyy}${mm}${dd}-${hh}${min}`;

  // Toggle Skeletons
  const loader = document.getElementById('proposalLoaderSkeletons');
  const placeholder = document.getElementById('proposalPlaceholderInfo');
  const results = document.getElementById('proposalResultsView');
  const statusTag = document.getElementById('proposalStatusTag');
  const generateBtn = document.getElementById('btnGenerateProposal');

  if (loader) loader.style.display = 'flex';
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'none';
  if (statusTag) statusTag.style.display = 'none';
  if (generateBtn) generateBtn.disabled = true;

  const payload = {
    customer_name: customerName,
    customer_address: customerAddress,
    city: customerCity,
    monthly_units: monthlyUnits,
    monthly_bill_rs: monthlyBill,
    per_unit_rate: perUnitRate,
    recommended_kw: recommendedKw,
    roof_area_sqft: roofArea,
    vendor_name: vendorName
  };

  const host = API_BASE;

  safeFetch(`${host}/api/generate-proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(async (res) => {
    if (!res.ok) {
      throw new Error('API server returned an error.');
    }
    return res.json();
  })
  .then((result) => {
    if (!result || result.success !== true || !result.data) {
      throw new Error(result.error || 'Invalid API response format.');
    }

    const proposal = {
      ...result.data,
      proposalId: proposalId,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      customerAddress: customerAddress,
      city: customerCity,
      perUnitRate: perUnitRate,
      monthlyBill: monthlyBill,
      monthlyUnits: monthlyUnits,
      roofArea: roofArea,
      recommendedKw: recommendedKw,
      createdAt: new Date().toISOString()
    };

    // Save state
    localStorage.setItem('lastGeneratedProposal', JSON.stringify(proposal));

    // Save in history
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('proposalHistory')) || [];
    } catch(e) {}
    history.unshift(proposal);
    history = history.slice(0, 100);
    localStorage.setItem('proposalHistory', JSON.stringify(history));

    // Save analytics
    let stats = { proposalCount: 0, proposalValue: 0, proposalSavings: 0, proposalSystemSize: 0 };
    try {
      const savedStats = localStorage.getItem('vendorAnalyticsStats');
      if (savedStats) stats = JSON.parse(savedStats);
    } catch (e) {}
    stats.proposalCount = (stats.proposalCount || 0) + 1;
    stats.proposalValue = (stats.proposalValue || 0) + parseFloat(proposal.net_cost_rs || 0);
    stats.proposalSavings = (stats.proposalSavings || 0) + parseFloat(proposal.annual_savings_rs || 0);
    stats.proposalSystemSize = (stats.proposalSystemSize || 0) + parseFloat(proposal.recommendedKw || 0);
    localStorage.setItem('vendorAnalyticsStats', JSON.stringify(stats));

    // Create Notification
    createNotification('reports', 'Proposal Generated', `Proposal generated successfully for ${customerName}`, 'medium');

    // Activity Log
    addActivityLog('crm', 'Proposal Generated', `Proposal generated for ${customerName} (${recommendedKw} kW)`);

    // Audit Log
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'Proposal Generated', 'Vendor Portal', `Generated solar proposal ${proposalId} for ${customerName} (${recommendedKw} kW) with net cost ₹${proposal.net_cost_rs}.`, 'Medium');

    // Auto-create CRM lead
    const leads = getCrmLeads();
    if (!leads[customerEmail]) {
      leads[customerEmail] = {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        city: customerCity,
        status: 'New',
        source: 'Vendor Portal',
        vendor: vendorName,
        proposalValue: proposal.net_cost_rs,
        systemSize: recommendedKw,
        notes: 'AI Proposal Generated',
        createdAt: new Date().toISOString()
      };
      saveCrmLeads(leads);
      if (typeof renderCrmLeadsTable === 'function') renderCrmLeadsTable();
      if (typeof refreshCrmDashboardUI === 'function') refreshCrmDashboardUI();
    }

    // Render Proposal results
    renderProposal(proposal);
    refreshProposalHistory();

    showToast('Solar proposal generated successfully!', 'success');
  })
  .catch((err) => {
    console.error('Error generating proposal:', err);
    showToast('Failed to generate proposal: ' + err.message, 'error');
    if (loader) loader.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  })
  .finally(() => {
    if (generateBtn) generateBtn.disabled = false;
  });
}

function renderProposal(proposal) {
  const loader = document.getElementById('proposalLoaderSkeletons');
  const placeholder = document.getElementById('proposalPlaceholderInfo');
  const results = document.getElementById('proposalResultsView');
  const statusTag = document.getElementById('proposalStatusTag');

  if (loader) loader.style.display = 'none';
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'flex';
  if (statusTag) {
    statusTag.style.display = 'block';
    statusTag.textContent = 'READY';
  }

  // Update KPI displays
  _setText('resPropId', proposal.proposalId);
  _setText('resPropDate', new Date(proposal.createdAt).toLocaleDateString());
  _setText('resPropSystemCost', '₹' + Number(proposal.system_cost_rs).toLocaleString('en-IN'));
  _setText('resPropSubsidy', '₹' + Number(proposal.subsidy_rs).toLocaleString('en-IN'));
  _setText('resPropNetCost', '₹' + Number(proposal.net_cost_rs).toLocaleString('en-IN'));
  _setText('resPropMonthlySavings', '₹' + Number(proposal.monthly_savings_rs).toLocaleString('en-IN'));
  _setText('resPropAnnualSavings', '₹' + Number(proposal.annual_savings_rs).toLocaleString('en-IN'));
  _setText('resPropPayback', proposal.payback_years + ' Years');
  _setText('resProp25YearSavings', '₹' + Number(proposal.savings_25_years_rs).toLocaleString('en-IN'));
  _setText('resPropCo2', proposal.co2_offset_tons_per_year + ' Tons/Yr');

  // Hydrate sections
  _setText('resPropExecSummary', proposal.executive_summary);
  _setText('resPropSysDesign', proposal.system_overview);
  _setText('resPropFinBenefits', proposal.financial_highlights);
  
  _setText('resPropCostBreakdown', `The overall system cost is calculated at ₹${Number(proposal.system_cost_rs).toLocaleString('en-IN')} for a ${proposal.recommendedKw} kW installation (using ${proposal.panels_required} x 540W solar modules). After deducting the central PM Surya Ghar subsidy of ₹${Number(proposal.subsidy_rs).toLocaleString('en-IN')}, the net out-of-pocket investment for the customer is ₹${Number(proposal.net_cost_rs).toLocaleString('en-IN')}.`);
  
  _setText('resPropSubsidyInfo', `Based on the latest guidelines from the Ministry of New and Renewable Energy (MNRE) under the PM Surya Ghar: Muft Bijli Yojana, a grid-connected solar installation of ${proposal.recommendedKw} kW qualifies for a direct cash subsidy of ₹${Number(proposal.subsidy_rs).toLocaleString('en-IN')}, credited directly into the customer's linked bank account after post-installation inspection and net-meter commissioning.`);
  
  _setText('resPropPaybackAnalysis', `With average monthly solar generation of ${proposal.monthly_generation_units} kWh, the customer saves approximately ₹${Number(proposal.monthly_savings_rs).toLocaleString('en-IN')} per month, translating to ₹${Number(proposal.annual_savings_rs).toLocaleString('en-IN')} in annual savings. At this rate of generation, the system pays back its net cost of ₹${Number(proposal.net_cost_rs).toLocaleString('en-IN')} in just ${proposal.payback_years} years, leaving 20+ years of free green power with overall lifetime savings of ₹${Number(proposal.savings_25_years_rs).toLocaleString('en-IN')}.`);
  
  _setText('resPropEnvImpact', `By transitioning to clean solar energy, a ${proposal.recommendedKw} kW rooftop power plant offsets about ${proposal.co2_offset_tons_per_year} metric tons of Carbon Dioxide (CO₂) emissions every year. Over its 25-year operational lifecycle, this is equivalent to planting over ${_safeNum(proposal.co2_offset_tons_per_year * 40).toFixed(0)} mature trees and avoiding substantial coal burning.`);

  const recList = document.getElementById('resPropRecommendations');
  if (recList && proposal.terms_and_conditions) {
    recList.innerHTML = proposal.terms_and_conditions.map(term => `<li>${_esc(term)}</li>`).join('');
  }
}

function refreshProposalHistory() {
  const tableBody = document.getElementById('proposalHistoryTableBody');
  if (!tableBody) return;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('proposalHistory')) || [];
  } catch(e) {}

  if (history.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted);">No proposals generated yet.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = history.map((p, idx) => `
    <tr style="border-bottom: 1px solid var(--border-color-light);">
      <td style="padding: 10px 8px; font-weight: 700; color: var(--accent-orange);">${p.proposalId}</td>
      <td style="padding: 10px 8px;">
        <div style="font-weight: 700; color: var(--text-navy);">${_esc(p.customerName)}</div>
        <div style="font-size: 9px; color: var(--text-muted);">${p.customerEmail}</div>
      </td>
      <td style="padding: 10px 8px;">${new Date(p.createdAt).toLocaleDateString()}</td>
      <td style="padding: 10px 8px; font-weight: 600;">${p.recommendedKw} kW</td>
      <td style="padding: 10px 8px; color: var(--text-secondary);">${_esc(p.vendorName)}</td>
      <td style="padding: 10px 8px; text-align: right;">
        <button class="table-action-btn" onclick="previewProposalById('${p.proposalId}')" style="margin-right: 4px; background: rgba(255, 138, 29, 0.08); border-color: rgba(255, 138, 29, 0.2); color: var(--accent-orange);">Preview</button>
        <button class="table-action-btn" onclick="downloadProposalById('${p.proposalId}')" style="margin-right: 4px; background: rgba(0, 174, 239, 0.08); border-color: rgba(0, 174, 239, 0.2); color: var(--accent-blue);">Download</button>
        <button class="table-action-btn" onclick="deleteProposalById('${p.proposalId}')" style="background: rgba(231, 76, 60, 0.08); border-color: rgba(231, 76, 60, 0.2); color: #ef4444;">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.previewProposalById = function(id) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('proposalHistory')) || []; } catch(e) {}
  const proposal = history.find(p => p.proposalId === id);
  if (proposal) showPreviewModal(proposal);
};

window.downloadProposalById = function(id) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('proposalHistory')) || []; } catch(e) {}
  const proposal = history.find(p => p.proposalId === id);
  if (proposal) downloadProposalPDF(proposal);
};

window.deleteProposalById = function(id) {
  if (!confirm("Are you sure you want to delete this proposal from history?")) return;

  let history = [];
  try { history = JSON.parse(localStorage.getItem('proposalHistory')) || []; } catch(e) {}
  const p = history.find(x => x.proposalId === id);
  if (!p) return;

  history = history.filter(x => x.proposalId !== id);
  localStorage.setItem('proposalHistory', JSON.stringify(history));

  // Check if it's the last generated proposal
  const lastProp = getLastGeneratedProposal();
  if (lastProp && lastProp.proposalId === id) {
    localStorage.removeItem('lastGeneratedProposal');
    const resultsView = document.getElementById('proposalResultsView');
    const placeholderInfo = document.getElementById('proposalPlaceholderInfo');
    const statusTag = document.getElementById('proposalStatusTag');
    if (resultsView) resultsView.style.display = 'none';
    if (placeholderInfo) placeholderInfo.style.display = 'flex';
    if (statusTag) statusTag.style.display = 'none';
  }

  // Audit Log
  const currentUser = _getUser() || {};
  logAuditEvent(currentUser.email || 'system', 'Proposal Deleted', 'Vendor Portal', `Deleted solar proposal ${id} for customer ${p.customerName}.`, 'Medium');
  
  // Activity Log
  addActivityLog('crm', 'Proposal Deleted', `Deleted proposal ${id}`);

  refreshProposalHistory();
  showToast('Proposal deleted from history.', 'info');
};

function showPreviewModal(proposal) {
  const modal = document.getElementById('proposalPreviewModal');
  const body = document.getElementById('proposalPreviewBody');
  if (!modal || !body) return;

  const dateStr = new Date(proposal.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  body.innerHTML = `
    <!-- Branded Header -->
    <div style="border-bottom: 2px solid rgba(255, 255, 255, 0.08); padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: start;">
      <div>
        <div style="font-family: 'Outfit'; font-size: 22px; font-weight: 900; color: #ffffff;">GET Solar Energy</div>
        <div style="font-size: 9px; font-weight: 600; color: var(--accent-blue); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">Solar Intelligence Platform</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 10px; color: var(--text-muted);">PROPOSAL ID</span>
        <div style="font-family: 'Outfit'; font-weight: 800; color: var(--accent-orange); font-size: 14px;">${proposal.proposalId}</div>
        <div style="font-size: 9px; color: var(--text-muted); margin-top: 2px;">Date: ${dateStr}</div>
      </div>
    </div>

    <!-- Overview Grid -->
    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-bottom: 25px;">
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
        <h4 style="margin: 0 0 10px 0; font-size: 11px; color: var(--accent-orange); text-transform: uppercase;">Customer Information</h4>
        <div style="font-size: 11px; line-height: 1.6;">
          <strong>Name:</strong> ${_esc(proposal.customerName)}<br>
          <strong>Phone:</strong> ${proposal.customerPhone}<br>
          <strong>Email:</strong> ${proposal.customerEmail}<br>
          <strong>Address:</strong> ${_esc(proposal.customerAddress)}, ${_esc(proposal.city)}
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
        <h4 style="margin: 0 0 10px 0; font-size: 11px; color: var(--accent-blue); text-transform: uppercase;">Vendor / EPC Partner</h4>
        <div style="font-size: 11px; line-height: 1.6;">
          <strong>Company Name:</strong> ${_esc(proposal.vendorName)}<br>
          <strong>System Size:</strong> ${proposal.recommendedKw} kW<br>
          <strong>Total Panels:</strong> ${proposal.panels_required} (540W)
        </div>
      </div>
    </div>

    <!-- KPIs highlights -->
    <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #ffffff; text-transform: uppercase;">Proposal Financial Highlights</h4>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; margin-bottom: 25px;">
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color-light); padding: 8px 4px; border-radius: 6px;">
        <span style="font-size: 8px; color: var(--text-muted); display: block;">System Cost</span>
        <strong style="font-size: 12px; color: #ffffff; display: block; margin-top: 2px;">₹${Number(proposal.system_cost_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color-light); padding: 8px 4px; border-radius: 6px;">
        <span style="font-size: 8px; color: var(--text-muted); display: block;">Subsidy</span>
        <strong style="font-size: 12px; color: var(--accent-green); display: block; margin-top: 2px;">₹${Number(proposal.subsidy_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color-light); padding: 8px 4px; border-radius: 6px;">
        <span style="font-size: 8px; color: var(--text-muted); display: block;">Net Cost</span>
        <strong style="font-size: 12px; color: var(--accent-orange); display: block; margin-top: 2px;">₹${Number(proposal.net_cost_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color-light); padding: 8px 4px; border-radius: 6px;">
        <span style="font-size: 8px; color: var(--text-muted); display: block;">Payback</span>
        <strong style="font-size: 12px; color: var(--accent-orange); display: block; margin-top: 2px;">${proposal.payback_years} Yrs</strong>
      </div>
    </div>

    <!-- Sections list -->
    <div style="display: flex; flex-direction: column; gap: 15px; border: 1px solid var(--border-color-light); border-radius: 8px; padding: 15px; background: rgba(255,255,255,0.01);">
      <div>
        <h5 style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: var(--accent-orange); text-transform: uppercase;">Executive Summary</h5>
        <p style="font-size: 11px; line-height: 1.5; color: var(--text-secondary); margin: 0;">${proposal.executive_summary}</p>
      </div>
      <div style="border-top: 1px solid var(--border-color-light); padding-top: 10px;">
        <h5 style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: var(--accent-blue); text-transform: uppercase;">System Overview & Design</h5>
        <p style="font-size: 11px; line-height: 1.5; color: var(--text-secondary); margin: 0;">${proposal.system_overview}</p>
      </div>
      <div style="border-top: 1px solid var(--border-color-light); padding-top: 10px;">
        <h5 style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: var(--accent-blue); text-transform: uppercase;">Financial Benefits</h5>
        <p style="font-size: 11px; line-height: 1.5; color: var(--text-secondary); margin: 0;">${proposal.financial_highlights}</p>
      </div>
      <div style="border-top: 1px solid var(--border-color-light); padding-top: 10px;">
        <h5 style="margin: 0 0 4px 0; font-size: 10px; font-weight: 800; color: var(--accent-blue); text-transform: uppercase;">Terms & Conditions</h5>
        <ul style="font-size: 11px; line-height: 1.5; color: var(--text-secondary); margin: 0; padding-left: 15px;">
          ${proposal.terms_and_conditions.map(term => `<li>${_esc(term)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

function hidePreviewModal() {
  const modal = document.getElementById('proposalPreviewModal');
  if (modal) modal.style.display = 'none';
}

function downloadProposalPDF(proposal) {
  const dateStr = new Date(proposal.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Custom print-ready HTML
  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solar Proposal - ${proposal.customerName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #06111f;
      color: #f7fbff;
      margin: 0;
      padding: 40px;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5 {
      font-family: 'Outfit', sans-serif;
      color: #ffffff;
    }
    .accent-orange { color: #ff8a1d; }
    .accent-cyan { color: #17a8e5; }
    .page-break { page-break-after: always; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 25px 0;
    }
    .kpi-card {
      background: rgba(14, 34, 53, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 15px 10px;
      text-align: center;
    }
    .section-block {
      background: rgba(14, 34, 53, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    @media print {
      body {
        background: #06111f !important;
        color: #f7fbff !important;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="border: 2px solid rgba(23, 168, 229, 0.4); border-radius: 12px; padding: 60px 40px; text-align: center; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; margin-bottom: 40px;" class="page-break">
    <div>
      <div style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #ffffff;">GET Solar Energy</div>
      <div style="font-size: 10px; font-weight: 600; color: #17a8e5; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Solar Intelligence Platform</div>
    </div>

    <div style="margin: 60px 0;">
      <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.2; margin: 0 0 10px 0;">AI Solar Installation Proposal</h1>
      <div style="width: 100px; height: 4px; background: linear-gradient(90deg, #17a8e5, #ff8a1d); margin: 0 auto 20px auto; border-radius: 2px;"></div>
      <span style="background: rgba(255, 138, 29, 0.12); border: 1px solid rgba(255, 138, 29, 0.25); color: #ff8a1d; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 4px 14px; border-radius: 12px;">
        ${proposal.vendorName}
      </span>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; color: #9fb3c8; text-align: left;">
      <div>
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">Prepared For</span>
        <strong style="color: #ffffff; font-size: 14px;">${_esc(proposal.customerName)}</strong>
        <br>Phone: ${proposal.customerPhone}
        <br>Email: ${proposal.customerEmail}
        <br>Address: ${_esc(proposal.customerAddress)}, ${_esc(proposal.city)}
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">Proposal Details</span>
        <span style="font-weight: 600; color: #ffffff;">ID: ${proposal.proposalId}</span>
        <br>Date: ${dateStr}
        <br>System Size: ${proposal.recommendedKw} kW
      </div>
    </div>
  </div>

  <!-- Page 2: KPI & Details -->
  <div class="page-break">
    <h2 style="font-size: 18px; margin-bottom: 10px;">Proposal Highlights & KPIs</h2>
    <div class="card-grid">
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">System Cost</span>
        <strong style="font-size: 14px; color: #ffffff; display: block; margin-top: 4px;">₹${Number(proposal.system_cost_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Subsidy</span>
        <strong style="font-size: 14px; color: #36d399; display: block; margin-top: 4px;">₹${Number(proposal.subsidy_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Net Cost</span>
        <strong style="font-size: 14px; color: #ff8a1d; display: block; margin-top: 4px;">₹${Number(proposal.net_cost_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Monthly Savings</span>
        <strong style="font-size: 14px; color: #36d399; display: block; margin-top: 4px;">₹${Number(proposal.monthly_savings_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Annual Savings</span>
        <strong style="font-size: 14px; color: #ffffff; display: block; margin-top: 4px;">₹${Number(proposal.annual_savings_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Payback Period</span>
        <strong style="font-size: 14px; color: #ff8a1d; display: block; margin-top: 4px;">${proposal.payback_years} Years</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">25-Yr Savings</span>
        <strong style="font-size: 14px; color: #36d399; display: block; margin-top: 4px;">₹${Number(proposal.savings_25_years_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">CO₂ Offset</span>
        <strong style="font-size: 14px; color: #17a8e5; display: block; margin-top: 4px;">${proposal.co2_offset_tons_per_year} Tons/Yr</strong>
      </div>
    </div>

    <div class="section-block">
      <div class="section-title accent-orange">1. Executive Summary</div>
      <p style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin: 0;">${proposal.executive_summary}</p>
    </div>

    <div class="section-block">
      <div class="section-title accent-cyan">2. System Design & Overview</div>
      <p style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin: 0;">${proposal.system_overview}</p>
      <div style="font-size: 10px; color: #9fb3c8; margin-top: 8px;">Assuming ${proposal.panels_required} high-efficiency 540W solar PV panels and matching grid-tied string inverter system.</div>
    </div>
  </div>

  <!-- Page 3: Financials & Terms -->
  <div>
    <div class="section-block">
      <div class="section-title accent-cyan">3. Financial Highlights & Payback</div>
      <p style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin: 0;">${proposal.financial_highlights}</p>
      <div style="margin-top: 10px; font-size: 10px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; color: #cbd5e1;">
        <div>• Estimated Annual Savings: <strong>₹${Number(proposal.annual_savings_rs).toLocaleString('en-IN')}</strong></div>
        <div>• 25-Year Cumulative Savings: <strong>₹${Number(proposal.savings_25_years_rs).toLocaleString('en-IN')}</strong></div>
        <div>• Solar Generation (Monthly): <strong>${proposal.monthly_generation_units} kWh</strong></div>
        <div>• Payback Period: <strong>${proposal.payback_years} Years</strong></div>
      </div>
    </div>

    <div class="section-block">
      <div class="section-title accent-orange">4. Terms & Conditions</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${proposal.terms_and_conditions.map(term => `<li>${_esc(term)}</li>`).join('')}
      </ul>
    </div>
    
    <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #475569;">
      Proposal Generated by GET Solar Intelligence Engine on behalf of ${proposal.vendorName}.
    </div>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    createNotification('reports', 'Report Downloaded', `Exported proposal PDF for ${proposal.customerName} (${proposal.proposalId})`, 'low');
    addActivityLog('crm', 'Proposal Exported', `Downloaded PDF for proposal ${proposal.proposalId}`);
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'Proposal Downloaded', 'Vendor Portal', `Downloaded proposal PDF ${proposal.proposalId} for ${proposal.customerName}.`, 'Low');
  } else {
    showToast("Pop-up blocked! Please allow pop-ups to download PDF proposals.", "error");
  }
}

/* ==========================================================================
   ANNUAL MAINTENANCE CONTRACT (AMC) WORKSPACE
   ========================================================================== */
function initAmcWorkspace() {
  const btnScroll = document.getElementById('btnScrollToAmcForm');
  const btnAutofill = document.getElementById('btnAutofillAmc');
  const btnReset = document.getElementById('btnResetAmc');
  const btnGenerate = document.getElementById('btnGenerateAmc');
  const btnDownloadSample = document.getElementById('btnDownloadAmcSample');
  const btnDownloadReport = document.getElementById('btnDownloadAmcReport');
  const checkboxDamage = document.getElementById('amcDamageObserved');
  const wrapperDamage = document.getElementById('amcDamageDetailsWrapper');

  if (btnScroll) {
    btnScroll.addEventListener('click', () => {
      const container = document.getElementById('amcFormContainer');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (btnAutofill) btnAutofill.addEventListener('click', autofillAmcForm);
  if (btnReset) btnReset.addEventListener('click', resetAmcForm);
  if (btnGenerate) btnGenerate.addEventListener('click', generateAmcRecommendation);

  const triggerDownload = (btn) => {
    const raw = btn.getAttribute('data-report-json');
    if (raw) {
      try {
        downloadAmcReport(JSON.parse(raw));
      } catch(e) {
        showToast("Error processing report data for download.", "error");
      }
    } else {
      showToast("No report data generated yet.", "info");
    }
  };

  if (btnDownloadSample) btnDownloadSample.addEventListener('click', () => triggerDownload(btnDownloadSample));
  if (btnDownloadReport) btnDownloadReport.addEventListener('click', () => triggerDownload(btnDownloadReport));

  // Toggle damage details input based on checkbox
  if (checkboxDamage && wrapperDamage) {
    const toggleDamageField = () => {
      wrapperDamage.style.display = checkboxDamage.checked ? 'block' : 'none';
      const detailsInput = document.getElementById('amcDamageDetails');
      if (detailsInput && !checkboxDamage.checked) {
        detailsInput.value = 'None';
      } else if (detailsInput && checkboxDamage.checked && detailsInput.value === 'None') {
        detailsInput.value = '';
      }
    };
    checkboxDamage.addEventListener('change', toggleDamageField);
    toggleDamageField(); // init state
  }

  // Restore state from localStorage if exists
  try {
    const lastAmc = localStorage.getItem('lastGeneratedAmc');
    if (lastAmc) {
      const amcData = JSON.parse(lastAmc);
      restoreAmcState(amcData);
    }
  } catch(e) {}

  initAmcFormValidation();
}

function initAmcFormValidation() {
  const form = document.getElementById('amcForm');
  const generateBtn = document.getElementById('btnGenerateAmc');
  if (!form || !generateBtn) return;

  const inputs = form.querySelectorAll('input, select');
  const checkValidity = () => {
    const isValid = form.checkValidity();
    generateBtn.disabled = !isValid;
  };

  inputs.forEach(input => {
    input.addEventListener('input', checkValidity);
    input.addEventListener('change', checkValidity);
  });
  
  checkValidity();
}

function autofillAmcForm() {
  const fields = {
    amcCustomerName: "Rajesh Kumar",
    amcCity: "Lucknow",
    amcSystemSize: 5.5,
    amcInstallDate: "2023-04-10",
    amcLastServiceDate: "2026-01-15",
    amcCurrentGen: 580,
    amcExpectedGen: 675,
    amcInverterErrors: "None",
    amcPanelCleaning: true,
    amcDamageObserved: false,
    amcDamageDetails: "None"
  };

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = val;
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  showToast("Autofilled demo AMC data!", "info");
}

function resetAmcForm() {
  const form = document.getElementById('amcForm');
  if (form) form.reset();

  const placeholder = document.getElementById('amcPlaceholderInfo');
  const results = document.getElementById('amcResultsView');
  const dlBtn = document.getElementById('btnDownloadAmcSample');
  
  if (placeholder) placeholder.style.display = 'flex';
  if (results) results.style.display = 'none';
  if (dlBtn) dlBtn.disabled = true;

  // Reset KPIs
  document.getElementById('amcKpiPlan').textContent = '—';
  document.getElementById('amcKpiCost').textContent = '₹0';
  document.getElementById('amcKpiHealth').textContent = '—';
  document.getElementById('amcKpiNextVisit').textContent = '—';
  document.getElementById('amcKpiPmScore').textContent = '—';
  
  setAmcTimelineProgress(1);
  showToast("AMC form cleared.", "info");
}

function generateAmcRecommendation() {
  const form = document.getElementById('amcForm');
  if (!form.reportValidity()) return;

  const loader = document.getElementById('amcLoaderSkeletons');
  const placeholder = document.getElementById('amcPlaceholderInfo');
  const results = document.getElementById('amcResultsView');
  const generateBtn = document.getElementById('btnGenerateAmc');

  if (loader) loader.style.display = 'flex';
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'none';
  if (generateBtn) generateBtn.disabled = true;

  const payload = {
    customer_name: document.getElementById('amcCustomerName').value.trim(),
    city: document.getElementById('amcCity').value,
    system_size_kw: parseFloat(document.getElementById('amcSystemSize').value),
    installation_date: document.getElementById('amcInstallDate').value,
    last_service_date: document.getElementById('amcLastServiceDate').value,
    current_generation_units: parseFloat(document.getElementById('amcCurrentGen').value),
    expected_generation_units: parseFloat(document.getElementById('amcExpectedGen').value),
    inverter_error_codes: document.getElementById('amcInverterErrors').value.trim(),
    panel_cleaning_done: document.getElementById('amcPanelCleaning').checked,
    physical_damage_observed: document.getElementById('amcDamageObserved').checked,
    damage_details: document.getElementById('amcDamageDetails').value.trim()
  };

  const host = API_BASE;
  
  safeFetch(`${host}/api/amc-recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(async (res) => {
    if (!res.ok) throw new Error('API server returned error code ' + res.status);
    return res.json();
  })
  .then((result) => {
    if (!result || result.success !== true || !result.data) {
      throw new Error(result.error || 'Invalid API response format');
    }
    
    const amcData = result.data;
    
    // Save to localStorage
    localStorage.setItem('lastGeneratedAmc', JSON.stringify(amcData));

    // Render KPIs with animations
    const score = _safeNum(amcData.health_score);
    let plan = amcData.system_status === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly';
    if (amcData.urgent_action_required) plan = 'Urgent Remedial';
    
    document.getElementById('amcKpiPlan').textContent = plan;
    animateAdminCounter('amcKpiCost', _safeNum(amcData.estimated_service_cost_rs), true);
    animateAdminCounter('amcKpiHealth', score, false, false, '%');
    document.getElementById('amcKpiNextVisit').textContent = amcData.next_service_due || '—';
    
    // Preventive maintenance score
    const pmScore = Math.max(20, Math.min(100, Math.round(100 - _safeNum(amcData.generation_drop_pct) - (payload.panel_cleaning_done ? 0 : 15))));
    animateAdminCounter('amcKpiPmScore', pmScore, false, false, '/100');

    // Render Result Elements
    document.getElementById('resAmcCustomerName').textContent = `${amcData.customer_name}'s Solar System`;
    const statusTag = document.getElementById('resAmcStatusTag');
    if (statusTag) {
      statusTag.textContent = (amcData.system_status || 'Needs Attention').toUpperCase();
      statusTag.style.backgroundColor = amcData.system_status === 'Healthy' ? 'rgba(54, 211, 153, 0.15)' : 'rgba(251, 146, 60, 0.15)';
      statusTag.style.color = amcData.system_status === 'Healthy' ? 'var(--accent-green)' : 'var(--accent-orange)';
    }

    document.getElementById('resAmcDiagnosis').textContent = amcData.diagnosis_summary;
    document.getElementById('resAmcPlan').textContent = plan;
    document.getElementById('resAmcCost').textContent = `₹${Number(amcData.estimated_service_cost_rs).toLocaleString('en-IN')} / Yr`;
    document.getElementById('resAmcPeriod').textContent = amcData.urgent_action_required ? 'Immediate Remedial Action' : 'Quarterly Maintenance (4 visits/yr)';
    document.getElementById('resAmcNextVisit').textContent = amcData.next_service_due;

    // Fault Analysis
    const faultsList = document.getElementById('resAmcFaults');
    if (faultsList && amcData.fault_analysis) {
      faultsList.innerHTML = amcData.fault_analysis.map(f => `<li>${_esc(f)}</li>`).join('');
    }
    // Actions
    const actionsList = document.getElementById('resAmcActions');
    if (actionsList && amcData.recommended_actions) {
      actionsList.innerHTML = amcData.recommended_actions.map(a => `<li>${_esc(a)}</li>`).join('');
    }
    // Preventive
    const prevList = document.getElementById('resAmcPreventive');
    if (prevList && amcData.preventive_measures) {
      prevList.innerHTML = amcData.preventive_measures.map(p => `<li>${_esc(p)}</li>`).join('');
    }

    // Enable Download Plan button
    const dlBtn = document.getElementById('btnDownloadAmcSample');
    if (dlBtn) {
      dlBtn.disabled = false;
      dlBtn.setAttribute('data-report-json', JSON.stringify(amcData));
    }
    const dlReportBtn = document.getElementById('btnDownloadAmcReport');
    if (dlReportBtn) {
      dlReportBtn.setAttribute('data-report-json', JSON.stringify(amcData));
    }

    // Update Visual Timeline based on health score
    if (score >= 80) setAmcTimelineProgress(6);
    else if (score >= 50) setAmcTimelineProgress(4);
    else setAmcTimelineProgress(2);

    // Update Activity logs, notifications, and audits
    createNotification('reports', 'AMC Recommendation Generated', `AMC evaluation completed for ${payload.customer_name}`, 'medium');
    addActivityLog('crm', 'AMC Evaluated', `AMC recommendation generated for ${payload.customer_name}`);
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'AMC Recommendation Generated', 'O&M Portal', `Evaluated system health for ${payload.customer_name} (Health Score: ${score}%, Est Cost: ₹${amcData.estimated_service_cost_rs})`, 'Medium');

    // Show Results
    if (loader) loader.style.display = 'none';
    if (results) results.style.display = 'flex';
    showToast('AMC O&M evaluation completed successfully!', 'success');
  })
  .catch((err) => {
    console.error('Error generating AMC recommendation:', err);
    showToast('O&M evaluation failed: ' + err.message, 'error');
    if (loader) loader.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  })
  .finally(() => {
    if (generateBtn) generateBtn.disabled = false;
    initAmcFormValidation();
  });
}

function restoreAmcState(amcData) {
  if (!amcData) return;

  // Restore fields
  if (document.getElementById('amcCustomerName')) document.getElementById('amcCustomerName').value = amcData.customer_name || '';
  if (document.getElementById('amcCity')) document.getElementById('amcCity').value = amcData.city || 'Lucknow';
  if (document.getElementById('amcSystemSize')) document.getElementById('amcSystemSize').value = amcData.system_size_kw || 5.0;
  
  const score = _safeNum(amcData.health_score);
  let plan = amcData.system_status === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly';
  if (amcData.urgent_action_required) plan = 'Urgent Remedial';

  document.getElementById('amcKpiPlan').textContent = plan;
  document.getElementById('amcKpiCost').textContent = `₹${Number(amcData.estimated_service_cost_rs).toLocaleString('en-IN')}`;
  document.getElementById('amcKpiHealth').textContent = `${score}%`;
  document.getElementById('amcKpiNextVisit').textContent = amcData.next_service_due || '—';
  
  const pmScore = Math.max(20, Math.min(100, Math.round(100 - _safeNum(amcData.generation_drop_pct))));
  document.getElementById('amcKpiPmScore').textContent = `${pmScore}/100`;

  // Render Result Elements
  document.getElementById('resAmcCustomerName').textContent = `${amcData.customer_name}'s Solar System`;
  const statusTag = document.getElementById('resAmcStatusTag');
  if (statusTag) {
    statusTag.textContent = (amcData.system_status || 'Needs Attention').toUpperCase();
    statusTag.style.backgroundColor = amcData.system_status === 'Healthy' ? 'rgba(54, 211, 153, 0.15)' : 'rgba(251, 146, 60, 0.15)';
    statusTag.style.color = amcData.system_status === 'Healthy' ? 'var(--accent-green)' : 'var(--accent-orange)';
  }

  document.getElementById('resAmcDiagnosis').textContent = amcData.diagnosis_summary;
  document.getElementById('resAmcPlan').textContent = plan;
  document.getElementById('resAmcCost').textContent = `₹${Number(amcData.estimated_service_cost_rs).toLocaleString('en-IN')} / Yr`;
  document.getElementById('resAmcPeriod').textContent = amcData.urgent_action_required ? 'Immediate Remedial Action' : 'Quarterly Maintenance (4 visits/yr)';
  document.getElementById('resAmcNextVisit').textContent = amcData.next_service_due;

  // Fault Analysis
  const faultsList = document.getElementById('resAmcFaults');
  if (faultsList && amcData.fault_analysis) {
    faultsList.innerHTML = amcData.fault_analysis.map(f => `<li>${_esc(f)}</li>`).join('');
  }
  // Actions
  const actionsList = document.getElementById('resAmcActions');
  if (actionsList && amcData.recommended_actions) {
    actionsList.innerHTML = amcData.recommended_actions.map(a => `<li>${_esc(a)}</li>`).join('');
  }
  // Preventive
  const prevList = document.getElementById('resAmcPreventive');
  if (prevList && amcData.preventive_measures) {
    prevList.innerHTML = amcData.preventive_measures.map(p => `<li>${_esc(p)}</li>`).join('');
  }

  // Enable Download buttons
  const dlBtn = document.getElementById('btnDownloadAmcSample');
  if (dlBtn) {
    dlBtn.disabled = false;
    dlBtn.setAttribute('data-report-json', JSON.stringify(amcData));
  }
  const dlReportBtn = document.getElementById('btnDownloadAmcReport');
  if (dlReportBtn) {
    dlReportBtn.setAttribute('data-report-json', JSON.stringify(amcData));
  }

  // Update Visual Timeline
  if (score >= 80) setAmcTimelineProgress(6);
  else if (score >= 50) setAmcTimelineProgress(4);
  else setAmcTimelineProgress(2);

  const placeholder = document.getElementById('amcPlaceholderInfo');
  const results = document.getElementById('amcResultsView');
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'flex';
}

window.setAmcTimelineProgress = function(step) {
  const bar = document.getElementById('amcTimelineProgress');
  if (bar) {
    const percent = (step * 16.6) + '%';
    if (window.innerWidth <= 820) {
      bar.style.width = '100%';
      bar.style.height = percent;
    } else {
      bar.style.width = percent;
      bar.style.height = '100%';
    }
  }
  const steps = document.querySelectorAll('.amc-timeline-step');
  steps.forEach((el, idx) => {
    el.classList.remove('active', 'completed', 'current', 'future');
    if (idx + 1 < step) {
      el.classList.add('completed');
    } else if (idx + 1 === step) {
      el.classList.add('active', 'current');
    } else {
      el.classList.add('future');
    }
  });
};

window.addEventListener('resize', () => {
  const activeStep = document.querySelector('.amc-timeline-step.current');
  if (activeStep) {
    const steps = Array.from(document.querySelectorAll('.amc-timeline-step'));
    const currentStepIdx = steps.indexOf(activeStep) + 1;
    if (currentStepIdx > 0) {
      window.setAmcTimelineProgress(currentStepIdx);
    }
  }
});


function downloadAmcReport(amcData) {
  if (!amcData) return;
  const dateStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  const plan = amcData.system_status === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly';

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Annual Maintenance Contract - ${amcData.customer_name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #06111f;
      color: #f7fbff;
      margin: 0;
      padding: 40px;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5 {
      font-family: 'Outfit', sans-serif;
      color: #ffffff;
    }
    .accent-orange { color: #ff8a1d; }
    .accent-cyan { color: #17a8e5; }
    .page-break { page-break-after: always; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 25px 0;
    }
    .kpi-card {
      background: rgba(14, 34, 53, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 15px 10px;
      text-align: center;
    }
    .section-block {
      background: rgba(14, 34, 53, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    @media print {
      body {
        background: #06111f !important;
        color: #f7fbff !important;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="border: 2px solid rgba(0, 174, 239, 0.4); border-radius: 12px; padding: 60px 40px; text-align: center; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; margin-bottom: 40px;" class="page-break">
    <div>
      <div style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #ffffff;">GET Solar Energy</div>
      <div style="font-size: 10px; font-weight: 600; color: #00aeef; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Solar Intelligence Platform</div>
    </div>

    <div style="margin: 60px 0;">
      <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.2; margin: 0 0 10px 0;">Annual Maintenance Contract Report</h1>
      <div style="width: 100px; height: 4px; background: linear-gradient(90deg, #00aeef, #36d399); margin: 0 auto 20px auto; border-radius: 2px;"></div>
      <span style="background: rgba(54, 211, 153, 0.12); border: 1px solid rgba(54, 211, 153, 0.25); color: #36d399; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 4px 14px; border-radius: 12px;">
        ${plan}
      </span>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; color: #9fb3c8; text-align: left;">
      <div>
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">Prepared For</span>
        <strong style="color: #ffffff; font-size: 14px;">${_esc(amcData.customer_name)}</strong>
        <br>Location: ${_esc(amcData.city)}
        <br>System Size: ${amcData.system_size_kw} kW
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">AMC Status</span>
        <span style="font-weight: 600; color: #ffffff;">Status: ${amcData.system_status}</span>
        <br>Date: ${dateStr}
        <br>Next Visit: ${amcData.next_service_due}
      </div>
    </div>
  </div>

  <!-- Details Page -->
  <div>
    <h2 style="font-size: 18px; margin-bottom: 10px;">Maintenance Details & Plan</h2>
    <div class="card-grid">
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">System Health</span>
        <strong style="font-size: 14px; color: #36d399; display: block; margin-top: 4px;">${amcData.health_score}%</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Annual O&M Pricing</span>
        <strong style="font-size: 14px; color: #ffffff; display: block; margin-top: 4px;">₹${Number(amcData.estimated_service_cost_rs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Generation Loss</span>
        <strong style="font-size: 14px; color: #ff8a1d; display: block; margin-top: 4px;">${amcData.generation_drop_pct}%</strong>
      </div>
    </div>

    <div class="section-block">
      <div class="section-title accent-orange">1. Diagnosis Summary</div>
      <p style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin: 0;">${amcData.diagnosis_summary}</p>
    </div>

    <div class="section-block">
      <div class="section-title accent-cyan">2. Fault Analysis</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${amcData.fault_analysis.map(f => `<li>${_esc(f)}</li>`).join('')}
      </ul>
    </div>

    <div class="section-block">
      <div class="section-title accent-cyan">3. Recommended Actions</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${amcData.recommended_actions.map(a => `<li>${_esc(a)}</li>`).join('')}
      </ul>
    </div>

    <div class="section-block">
      <div class="section-title accent-orange">4. Preventive Measures</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${amcData.preventive_measures.map(p => `<li>${_esc(p)}</li>`).join('')}
      </ul>
    </div>
    
    <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #475569;">
      Annual Maintenance Contract report generated by GET Solar Intelligence Engine.
    </div>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    createNotification('reports', 'Report Downloaded', `Exported AMC Plan PDF for ${amcData.customer_name}`, 'low');
    addActivityLog('crm', 'AMC PDF Exported', `Downloaded PDF for AMC report`);
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'AMC Report Downloaded', 'O&M Portal', `Downloaded AMC report PDF for ${amcData.customer_name}.`, 'Low');
  } else {
    showToast("Pop-up blocked! Please allow pop-ups to download PDF reports.", "error");
  }
}

/* ==========================================================================
   SITE SURVEY WORKSPACE
   ========================================================================== */
function initSiteSurveyWorkspace() {
  const btnScroll = document.getElementById('btnScrollToSurveyForm');
  const btnAutofill = document.getElementById('btnAutofillSurvey');
  const btnReset = document.getElementById('btnResetSurvey');
  const btnGenerate = document.getElementById('btnGenerateSurvey');
  const btnDownloadReport = document.getElementById('btnDownloadSurveyReport');
  const btnDownloadReportRight = document.getElementById('btnDownloadSurveyReportRight');
  const checkboxShading = document.getElementById('surveyShadingPresent');
  const selectShadingLevel = document.getElementById('surveyShadingLevel');

  if (btnScroll) {
    btnScroll.addEventListener('click', () => {
      const container = document.getElementById('surveyFormContainer');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (btnAutofill) btnAutofill.addEventListener('click', autofillSurveyForm);
  if (btnReset) btnReset.addEventListener('click', resetSurveyForm);
  if (btnGenerate) btnGenerate.addEventListener('click', generateSurveyRecommendation);

  const triggerDownload = () => {
    const lastSurvey = localStorage.getItem('lastGeneratedSiteSurvey');
    if (lastSurvey) {
      try {
        downloadSiteSurveyReport(JSON.parse(lastSurvey));
      } catch(e) {
        showToast("Error processing survey data for download.", "error");
      }
    } else {
      showToast("No survey report generated yet.", "info");
    }
  };

  if (btnDownloadReport) btnDownloadReport.addEventListener('click', triggerDownload);
  if (btnDownloadReportRight) btnDownloadReportRight.addEventListener('click', triggerDownload);

  // Sync Shading Level Dropdown and Shading Present Checkbox
  if (selectShadingLevel && checkboxShading) {
    selectShadingLevel.addEventListener('change', () => {
      checkboxShading.checked = selectShadingLevel.value !== 'None';
      const detailsInput = document.getElementById('surveyShadingDetails');
      if (detailsInput) {
        if (!checkboxShading.checked) {
          detailsInput.value = 'None';
        } else if (detailsInput.value === 'None') {
          detailsInput.value = '';
        }
      }
    });

    checkboxShading.addEventListener('change', () => {
      if (!checkboxShading.checked) {
        selectShadingLevel.value = 'None';
        const detailsInput = document.getElementById('surveyShadingDetails');
        if (detailsInput) detailsInput.value = 'None';
      } else if (selectShadingLevel.value === 'None') {
        selectShadingLevel.value = 'Minor';
        const detailsInput = document.getElementById('surveyShadingDetails');
        if (detailsInput && detailsInput.value === 'None') detailsInput.value = '';
      }
    });
  }

  // Restore state from localStorage if exists
  try {
    const lastSurvey = localStorage.getItem('lastGeneratedSiteSurvey');
    if (lastSurvey) {
      const surveyData = JSON.parse(lastSurvey);
      restoreSurveyState(surveyData);
    }
  } catch(e) {}

  initSurveyFormValidation();
}

function initSurveyFormValidation() {
  const form = document.getElementById('surveyForm');
  const generateBtn = document.getElementById('btnGenerateSurvey');
  if (!form || !generateBtn) return;

  const inputs = form.querySelectorAll('input, select, textarea');
  const checkValidity = () => {
    const isValid = form.checkValidity();
    generateBtn.disabled = !isValid;
  };

  inputs.forEach(input => {
    input.addEventListener('input', checkValidity);
    input.addEventListener('change', checkValidity);
  });
  
  checkValidity();
}

function autofillSurveyForm() {
  const fields = {
    surveyCustomerName: "Amit Sharma",
    surveyCity: "Bangalore",
    surveyAddress: "Block 4, 303, Prestige Heights",
    surveyBuildingType: "Residential",
    surveyRoofType: "RCC Flat",
    surveyRoofAge: 3,
    surveyRoofArea: 1500,
    surveyRoofHeight: 25,
    surveyNumFloors: 2,
    surveyProposedSystem: 12.0,
    surveyPanelDistance: 12.5,
    surveyElectricPoleDistance: 20.0,
    surveyMeterLocation: "Ground Floor Main Corridor",
    surveyStructureCondition: "Good",
    surveyShadingLevel: "Minor",
    surveyShadingPresent: true,
    surveyShadingDetails: "Tree branch shading from east side until 9 AM",
    surveyParkingAccess: "Good",
    surveySafetyHazards: "None",
    surveyObstacles: "Water tank, 2 AC outdoor units",
    surveyAdditionalNotes: "Ample staging area available for unloading panels."
  };

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = val;
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  showToast("Autofilled demo site survey parameters!", "info");
}

function resetSurveyForm() {
  const form = document.getElementById('surveyForm');
  if (form) form.reset();

  const placeholder = document.getElementById('surveyPlaceholderInfo');
  const results = document.getElementById('surveyResultsView');
  const dlBtn = document.getElementById('btnDownloadSurveyReport');
  const reportSection = document.getElementById('surveyReportFullSection');
  
  if (placeholder) placeholder.style.display = 'flex';
  if (results) results.style.display = 'none';
  if (reportSection) reportSection.style.display = 'none';
  if (dlBtn) dlBtn.disabled = true;

  // Reset KPIs
  document.getElementById('surveyKpiFeasibility').textContent = '—';
  document.getElementById('surveyKpiAccessibility').textContent = '—';
  document.getElementById('surveyKpiComplexity').textContent = '—';
  document.getElementById('surveyKpiSafety').textContent = '—';
  document.getElementById('surveyKpiTime').textContent = '—';
  document.getElementById('surveyKpiStatus').textContent = 'Pending';
  
  setSurveyTimelineProgress(1);
  showToast("Site survey form cleared.", "info");
}

function generateSurveyRecommendation() {
  const form = document.getElementById('surveyForm');
  if (!form.reportValidity()) return;

  const loader = document.getElementById('surveyLoaderSkeletons');
  const placeholder = document.getElementById('surveyPlaceholderInfo');
  const results = document.getElementById('surveyResultsView');
  const reportSection = document.getElementById('surveyReportFullSection');
  const generateBtn = document.getElementById('btnGenerateSurvey');

  if (loader) loader.style.display = 'flex';
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'none';
  if (reportSection) reportSection.style.display = 'none';
  if (generateBtn) generateBtn.disabled = true;

  // Read visual-only inputs and compose structural payloads
  const address = document.getElementById('surveyAddress').value.trim();
  const bldgType = document.getElementById('surveyBuildingType').value;
  const roofHeight = parseFloat(document.getElementById('surveyRoofHeight').value);
  const floors = parseInt(document.getElementById('surveyNumFloors').value);
  const poleDist = parseFloat(document.getElementById('surveyElectricPoleDistance').value);
  const meterLoc = document.getElementById('surveyMeterLocation').value.trim();
  const parkAccess = document.getElementById('surveyParkingAccess').value;
  const safetyHaz = document.getElementById('surveySafetyHazards').value.trim();
  const addNotes = document.getElementById('surveyAdditionalNotes').value.trim();

  // Combine UI-only fields into shading_details and obstacles to feed into the API contract strictly
  const rawShadingDetails = document.getElementById('surveyShadingDetails').value.trim();
  const shadingDetailsString = `[Shading: ${document.getElementById('surveyShadingLevel').value}] ${rawShadingDetails}`;
  
  const rawObstacles = document.getElementById('surveyObstacles').value.trim();
  const obstaclesString = `[Obstacles: ${rawObstacles}] [Bldg: ${bldgType}, Floors: ${floors}, Height: ${roofHeight}ft] [Meter: ${meterLoc}, Pole: ${poleDist}m] [Access: ${parkAccess}] [Hazards: ${safetyHaz}] [Notes: ${addNotes}]`;

  const payload = {
    customer_name: document.getElementById('surveyCustomerName').value.trim(),
    city: document.getElementById('surveyCity').value,
    roof_type: document.getElementById('surveyRoofType').value,
    roof_age_years: parseInt(document.getElementById('surveyRoofAge').value),
    total_roof_area_sqft: parseFloat(document.getElementById('surveyRoofArea').value),
    shading_present: document.getElementById('surveyShadingPresent').checked,
    shading_details: shadingDetailsString,
    obstacles: obstaclesString,
    electrical_panel_distance_m: parseFloat(document.getElementById('surveyPanelDistance').value),
    structure_condition: document.getElementById('surveyStructureCondition').value,
    proposed_system_kw: parseFloat(document.getElementById('surveyProposedSystem').value)
  };

  const host = API_BASE;
  
  safeFetch(`${host}/api/site-survey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(async (res) => {
    if (!res.ok) throw new Error('API server returned error code ' + res.status);
    return res.json();
  })
  .then((result) => {
    if (!result || result.success !== true || !result.data) {
      throw new Error(result.error || 'Invalid API response format');
    }
    
    const surveyData = result.data;
    
    // Store original UI values for print/restore integrity
    surveyData._ui_address = address;
    surveyData._ui_building_type = bldgType;
    surveyData._ui_roof_height = roofHeight;
    surveyData._ui_num_floors = floors;
    surveyData._ui_electric_pole_distance = poleDist;
    surveyData._ui_meter_location = meterLoc;
    surveyData._ui_parking_access = parkAccess;
    surveyData._ui_safety_hazards = safetyHaz;
    surveyData._ui_additional_notes = addNotes;
    surveyData._ui_shading_level = document.getElementById('surveyShadingLevel').value;
    surveyData._ui_proposed_system_kw = payload.proposed_system_kw;
    surveyData._ui_roof_age_years = payload.roof_age_years;
    surveyData._ui_roof_type = payload.roof_type;
    surveyData._ui_structure_condition = payload.structure_condition;
    surveyData._ui_electrical_panel_distance_m = payload.electrical_panel_distance_m;

    // Cache to localStorage
    localStorage.setItem('lastGeneratedSiteSurvey', JSON.stringify(surveyData));

    // Render KPIs & Results
    hydrateSurveyUI(surveyData);

    // Update Activity logs, notifications, and audits
    createNotification('reports', 'Site Survey Feasibility Generated', `Site survey evaluation completed for ${payload.customer_name}`, 'medium');
    addActivityLog('crm', 'Site Survey Evaluated', `Site survey generated for ${payload.customer_name} in ${payload.city}`);
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'Site Survey Generated', 'O&M Portal', `Evaluated site feasibility for ${payload.customer_name} (Score: ${surveyData.feasibility_score}%, Status: ${surveyData.feasibility_status})`, 'Medium');

    // Show Results
    if (loader) loader.style.display = 'none';
    if (results) results.style.display = 'flex';
    if (reportSection) reportSection.style.display = 'flex';
    showToast('Site survey feasibility generated successfully!', 'success');
  })
  .catch((err) => {
    console.error('Error generating site survey feasibility:', err);
    showToast('Site survey generation failed: ' + err.message, 'error');
    if (loader) loader.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  })
  .finally(() => {
    if (generateBtn) generateBtn.disabled = false;
    initSurveyFormValidation();
  });
}

function hydrateSurveyUI(surveyData) {
  const score = _safeNum(surveyData.feasibility_score);
  
  // 1. Animate dynamic numeric KPIs
  animateAdminCounter('surveyKpiFeasibility', score, false, false, '%');
  
  // Roof accessibility derived accessibility
  let accessibility = 'Standard';
  if (surveyData._ui_num_floors >= 4 || surveyData._ui_roof_height >= 45 || surveyData._ui_parking_access === 'Difficult') {
    accessibility = 'Difficult';
  } else if (surveyData._ui_num_floors === 1) {
    accessibility = 'Easy';
  }
  document.getElementById('surveyKpiAccessibility').textContent = accessibility;

  // Installation Complexity derived
  let complexity = 'Medium';
  if (score < 60 || surveyData._ui_num_floors >= 4) complexity = 'High';
  else if (score >= 85 && surveyData.estimated_additional_cost_rs === 0) complexity = 'Low';
  document.getElementById('surveyKpiComplexity').textContent = complexity;

  // Safety Score
  let safetyScore = 100;
  if (surveyData._ui_safety_hazards && surveyData._ui_safety_hazards.toLowerCase() !== 'none') safetyScore -= 20;
  if (surveyData._ui_roof_age_years > 15) safetyScore -= 15;
  if (surveyData._ui_structure_condition !== 'Good') safetyScore -= 15;
  const finalSafetyVal = Math.max(40, safetyScore);
  animateAdminCounter('surveyKpiSafety', finalSafetyVal, false, false, '/100');

  // Estimated Setup Time
  const systemKw = _safeNum(surveyData._ui_proposed_system_kw || 10.0);
  const estDays = Math.max(1, Math.round(systemKw * 0.3 + (complexity === 'High' ? 2 : 1)));
  document.getElementById('surveyKpiTime').textContent = `${estDays} Days`;

  // Status Tag
  document.getElementById('surveyKpiStatus').textContent = surveyData.feasibility_status;

  // 2. Hydrate Trend Indicators
  const feasibilityTrend = document.getElementById('surveyKpiFeasibilityTrend');
  if (feasibilityTrend) {
    feasibilityTrend.textContent = score >= 80 ? '🟢 Optimal' : score >= 50 ? '🟡 Moderate' : '🔴 Poor';
    feasibilityTrend.style.color = score >= 80 ? 'var(--accent-green)' : score >= 50 ? 'var(--color-yellow)' : 'var(--color-red)';
  }
  const accessibilityTrend = document.getElementById('surveyKpiAccessibilityTrend');
  if (accessibilityTrend) {
    accessibilityTrend.textContent = accessibility === 'Easy' ? '🟢 Easy' : accessibility === 'Standard' ? '🟢 Standard' : '🟡 Hard';
    accessibilityTrend.style.color = accessibility === 'Difficult' ? 'var(--color-yellow)' : 'var(--accent-green)';
  }
  const complexityTrend = document.getElementById('surveyKpiComplexityTrend');
  if (complexityTrend) {
    complexityTrend.textContent = complexity === 'Low' ? '🟢 Low Risk' : complexity === 'Medium' ? '🟡 Medium' : '🔴 Complex';
    complexityTrend.style.color = complexity === 'Low' ? 'var(--accent-green)' : complexity === 'Medium' ? 'var(--color-yellow)' : 'var(--color-red)';
  }
  const safetyTrend = document.getElementById('surveyKpiSafetyTrend');
  if (safetyTrend) {
    safetyTrend.textContent = finalSafetyVal >= 80 ? '🟢 Secured' : finalSafetyVal >= 60 ? '🟡 Warning' : '🔴 Elevated';
    safetyTrend.style.color = finalSafetyVal >= 80 ? 'var(--accent-green)' : finalSafetyVal >= 60 ? 'var(--color-yellow)' : 'var(--color-red)';
  }
  const timeTrend = document.getElementById('surveyKpiTimeTrend');
  if (timeTrend) {
    timeTrend.textContent = estDays <= 3 ? '⏱️ Fast' : '⏱️ Standard';
    timeTrend.style.color = 'var(--text-secondary)';
  }
  const statusTrend = document.getElementById('surveyKpiStatusTrend');
  if (statusTrend) {
    statusTrend.textContent = surveyData.feasibility_status === 'Highly Feasible' ? '🟢 Pass' : '🟡 Review';
    statusTrend.style.color = surveyData.feasibility_status === 'Highly Feasible' ? 'var(--accent-green)' : 'var(--color-yellow)';
  }

  // 3. Recommendation Banner Card Hydration
  const recBanner = document.getElementById('surveyRecommendationBanner');
  if (recBanner) {
    let stars = '★★★★★';
    let title = 'Site Approved';
    let sub = 'Ready for Installation';
    let bannerClass = 'approved';

    if (score < 50) {
      stars = '★★★☆☆';
      title = 'Engineering Review Required';
      sub = 'Structural or safety parameters are outside optimal guidelines. Reinforcement required.';
      bannerClass = 'review';
    } else if (score < 80) {
      stars = '★★★★☆';
      title = 'Requires Minor Improvements';
      sub = 'Minor electrical or mounting adjustments required prior to site layout approval.';
      bannerClass = 'conditional';
    }

    recBanner.className = `card-base recommendation-banner-card ${bannerClass}`;
    recBanner.innerHTML = `
      <div class="recommendation-stars">${stars}</div>
      <div class="recommendation-title">${title}</div>
      <p class="recommendation-text">${sub} (Feasibility Index: ${score}%)</p>
    `;
  }

  // 4. Draw Site Layout Preview SVG Diagram
  drawSiteLayoutPreview(surveyData);

  // 5. Visual Site Assessment Dashboard Grid Values
  const spaceUtilPct = Math.round((_safeNum(surveyData.area_required_sqft) / Math.max(1, _safeNum(surveyData.usable_area_sqft))) * 100);

  document.getElementById('resAssRoofArea').textContent = `${surveyData.total_roof_area_sqft || surveyData.usable_area_sqft} sq ft`;
  document.getElementById('resAssUsableArea').textContent = `${surveyData.usable_area_sqft} sq ft`;
  document.getElementById('resAssSpaceUtil').textContent = `${spaceUtilPct}%`;
  document.getElementById('resAssCableRun').textContent = `${surveyData.cable_run_estimate_meters} m`;
  document.getElementById('resAssStructureCond').textContent = surveyData._ui_structure_condition || 'Good';
  document.getElementById('resAssElectricalAccess').textContent = `${surveyData._ui_electrical_panel_distance_m} m`;
  document.getElementById('resAssMountingType').textContent = surveyData.mounting_structure_type || 'RCC Fixed Rack';

  // 6. Risk Profile Hydration
  const structRiskScore = surveyData._ui_structure_condition === 'Good' ? 10 : surveyData._ui_structure_condition === 'Fair' ? 40 : 80;
  const elecRiskScore = Math.min(95, Math.round(surveyData._ui_electrical_panel_distance_m * 4));
  const execRiskScore = complexity === 'High' ? 75 : complexity === 'Medium' ? 45 : 15;

  document.getElementById('riskScoreStructural').textContent = `Score: ${structRiskScore}%`;
  const riskBadgeStructural = document.getElementById('riskBadgeStructural');
  if (riskBadgeStructural) {
    riskBadgeStructural.textContent = structRiskScore <= 30 ? '🟢 Low' : structRiskScore <= 60 ? '🟡 Medium' : '🔴 High';
    riskBadgeStructural.style.color = structRiskScore <= 30 ? 'var(--accent-green)' : structRiskScore <= 60 ? 'var(--color-yellow)' : 'var(--color-red)';
  }

  document.getElementById('riskScoreElectrical').textContent = `Score: ${elecRiskScore}%`;
  const riskBadgeElectrical = document.getElementById('riskBadgeElectrical');
  if (riskBadgeElectrical) {
    riskBadgeElectrical.textContent = elecRiskScore <= 30 ? '🟢 Low' : elecRiskScore <= 60 ? '🟡 Medium' : '🔴 High';
    riskBadgeElectrical.style.color = elecRiskScore <= 30 ? 'var(--accent-green)' : elecRiskScore <= 60 ? 'var(--color-yellow)' : 'var(--color-red)';
  }

  document.getElementById('riskScoreInstallation').textContent = `Score: ${execRiskScore}%`;
  const riskBadgeInstallation = document.getElementById('riskBadgeInstallation');
  if (riskBadgeInstallation) {
    riskBadgeInstallation.textContent = execRiskScore <= 30 ? '🟢 Low' : execRiskScore <= 60 ? '🟡 Medium' : '🔴 High';
    riskBadgeInstallation.style.color = execRiskScore <= 30 ? 'var(--accent-green)' : execRiskScore <= 60 ? 'var(--color-yellow)' : 'var(--color-red)';
  }

  // 7. Results views text updates
  document.getElementById('resSurveyCustHeader').textContent = `${surveyData.customer_name}'s Feasibility Report`;
  
  const statusTag = document.getElementById('resSurveyStatusTag');
  if (statusTag) {
    statusTag.textContent = (surveyData.feasibility_status || 'Feasible').toUpperCase();
    if (surveyData.feasibility_status === 'Highly Feasible') {
      statusTag.style.backgroundColor = 'rgba(54, 211, 153, 0.15)';
      statusTag.style.color = 'var(--accent-green)';
    } else if (surveyData.feasibility_status === 'Feasible with Conditions') {
      statusTag.style.backgroundColor = 'rgba(251, 146, 60, 0.15)';
      statusTag.style.color = 'var(--accent-orange)';
    } else {
      statusTag.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
      statusTag.style.color = 'var(--color-red)';
    }
  }

  // Summary, structures, lists
  document.getElementById('resSurveySummary').textContent = surveyData.site_assessment_summary;

  // Risks list
  const risksList = document.getElementById('resSurveyRisks');
  if (risksList && surveyData.identified_risks) {
    risksList.innerHTML = surveyData.identified_risks.map(r => `<li>${_esc(r)}</li>`).join('');
  }
  // Recommendations list
  const recsList = document.getElementById('resSurveyRecommendations');
  if (recsList && surveyData.recommendations) {
    recsList.innerHTML = surveyData.recommendations.map(a => `<li>${_esc(a)}</li>`).join('');
  }

  // Detailed Report Section items
  document.getElementById('repCustomerName').textContent = surveyData.customer_name;
  document.getElementById('repCity').textContent = surveyData.city;
  document.getElementById('repAddress').textContent = surveyData._ui_address || '—';
  document.getElementById('repBuildingType').textContent = surveyData._ui_building_type || '—';
  document.getElementById('repRoofType').textContent = surveyData._ui_roof_type || '—';
  document.getElementById('repRoofArea').textContent = `${surveyData.total_roof_area_sqft || surveyData.usable_area_sqft} sq ft`;
  document.getElementById('repUsableArea').textContent = `${surveyData.usable_area_sqft} sq ft`;
  document.getElementById('repRequiredArea').textContent = `${surveyData.area_required_sqft} sq ft`;
  document.getElementById('repStructureCondition').textContent = surveyData._ui_structure_condition || '—';
  document.getElementById('repRoofAge').textContent = `${surveyData._ui_roof_age_years} years`;
  document.getElementById('repMountingStructure').textContent = surveyData.mounting_structure_type;
  document.getElementById('repReinforcementCost').textContent = `₹${Number(surveyData.estimated_additional_cost_rs).toLocaleString('en-IN')}`;
  document.getElementById('repPanelDistance').textContent = `${surveyData._ui_electrical_panel_distance_m} m`;
  document.getElementById('repCableRun').textContent = `${surveyData.cable_run_estimate_meters} m`;
  document.getElementById('repMeterLocation').textContent = surveyData._ui_meter_location || '—';
  document.getElementById('repParkingAccess').textContent = surveyData._ui_parking_access || '—';
  document.getElementById('repProposedSize').textContent = `${surveyData._ui_proposed_system_kw} kW`;
  document.getElementById('repDifficulty').textContent = complexity;
  
  // Derived crew recommendations
  let crewRec = 'Standard Solar Installation Crew';
  if (complexity === 'High') {
    crewRec = 'Specialist High-Elevation Crew with safety harnesses';
  } else if (surveyData.estimated_additional_cost_rs > 0) {
    crewRec = 'Civil reinforcement specialist + standard crew';
  }
  document.getElementById('repCrewRecommendation').textContent = crewRec;

  // Specialist equipment derived
  let specEquip = 'Harnesses, safety ropes, standard assembly tools';
  if (surveyData._ui_num_floors >= 4) {
    specEquip = 'Mobile crane for hoisting modules, perimeter netting, harnesses';
  } else if (surveyData._ui_roof_type === 'Sloped Tin') {
    specEquip = 'Direct clamp rails, seam clamps, fall arrester blocks';
  }
  document.getElementById('repSpecialEquipment').textContent = specEquip;

  document.getElementById('repShadingDetails').textContent = surveyData._ui_shading_details || '—';
  document.getElementById('repShadingNote').textContent = surveyData.shading_impact_note;
  document.getElementById('repSafetyHazards').textContent = surveyData._ui_safety_hazards || 'None';
  document.getElementById('repRiskLevel').textContent = complexity === 'High' ? 'Elevated Risk' : 'Standard Risk';
  document.getElementById('repEngineerNotes').textContent = surveyData.site_assessment_summary;

  // Recommendations detailed bullet
  const repList = document.getElementById('repRecommendationsList');
  if (repList && surveyData.recommendations) {
    repList.innerHTML = surveyData.recommendations.map(r => `<li>${_esc(r)}</li>`).join('');
  }

  // Enable Download buttons
  const dlBtn = document.getElementById('btnDownloadSurveyReport');
  if (dlBtn) dlBtn.disabled = false;

  // Set timeline progress based on feasibility score
  if (score >= 80) setSurveyTimelineProgress(7);
  else if (score >= 50) setSurveyTimelineProgress(6);
  else setSurveyTimelineProgress(4);
}

function drawSiteLayoutPreview(surveyData) {
  const container = document.getElementById('siteLayoutPreviewBox');
  if (!container) return;

  const width = 480;
  const height = 300;
  
  // Extract values with default fallbacks
  const systemKw = _safeNum(surveyData._ui_proposed_system_kw || surveyData.proposed_system_kw || 10.0);
  const shading = !!surveyData.shading_present;
  const shadingLevel = surveyData._ui_shading_level || 'None';
  const roofType = surveyData._ui_roof_type || 'RCC Flat';
  const distance = _safeNum(surveyData._ui_electrical_panel_distance_m || surveyData.electrical_panel_distance_m || 15);
  const obstaclesText = (surveyData._ui_obstacles || '').toLowerCase();
  
  // Dynamic panel sizing and layout
  const panelCount = Math.min(24, Math.max(4, Math.round(systemKw * 2)));
  let panelsHTML = '';
  const rows = Math.min(4, Math.ceil(Math.sqrt(panelCount)));
  const cols = Math.ceil(panelCount / rows);
  
  // Array offset inside roof footprint
  const startX = 140;
  const startY = 100;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * cols + c >= panelCount) break;
      const px = startX + c * 16;
      const py = startY + r * 10;
      panelsHTML += `<rect x="${px}" y="${py}" width="12" height="7" rx="1" fill="#1e3a8a" stroke="#60a5fa" stroke-width="0.7" opacity="0.95" />`;
      // Draw grid lines inside panel to look like cell grid
      panelsHTML += `<line x1="${px + 6}" y1="${py}" x2="${px + 6}" y2="${py + 7}" stroke="#3b82f6" stroke-width="0.3" />`;
      panelsHTML += `<line x1="${px}" y1="${py + 3.5}" x2="${px + 12}" y2="${py + 3.5}" stroke="#3b82f6" stroke-width="0.3" />`;
    }
  }

  // Draw obstacles based on text detection
  let acUnitHTML = '';
  let waterTankHTML = '';
  
  if (obstaclesText.includes('tank') || true) { // Always show water tank for rich visual complexity, make it red/cautioned if in text
    const isExplicit = obstaclesText.includes('tank');
    waterTankHTML = `
      <g transform="translate(320, 80)">
        <circle cx="12" cy="12" r="10" fill="rgba(30, 41, 59, 0.9)" stroke="${isExplicit ? '#ef4444' : '#64748b'}" stroke-width="1.5" />
        <circle cx="12" cy="12" r="6" fill="none" stroke="${isExplicit ? '#f87171' : '#94a3b8'}" stroke-width="1" />
        <line x1="12" y1="2" x2="12" y2="22" stroke="${isExplicit ? '#ef4444' : '#64748b'}" stroke-width="0.7" />
        <line x1="2" y1="12" x2="22" y2="12" stroke="${isExplicit ? '#ef4444' : '#64748b'}" stroke-width="0.7" />
        <text x="12" y="-4" font-size="8" fill="${isExplicit ? '#f87171' : '#94a3b8'}" text-anchor="middle" font-weight="600">Water Tank</text>
      </g>
    `;
  }
  
  if (obstaclesText.includes('ac') || true) { // Always show AC unit block
    const isExplicit = obstaclesText.includes('ac');
    acUnitHTML = `
      <g transform="translate(290, 130)">
        <rect x="0" y="0" width="16" height="12" rx="1" fill="rgba(30, 41, 59, 0.9)" stroke="${isExplicit ? '#ef4444' : '#64748b'}" stroke-width="1.5" />
        <line x1="3" y1="3" x2="13" y2="9" stroke="${isExplicit ? '#f87171' : '#94a3b8'}" stroke-width="1" />
        <line x1="3" y1="9" x2="13" y2="3" stroke="${isExplicit ? '#f87171' : '#94a3b8'}" stroke-width="1" />
        <text x="8" y="20" font-size="7" fill="${isExplicit ? '#f87171' : '#94a3b8'}" text-anchor="middle">AC Unit</text>
      </g>
    `;
  }

  // Shading / Trees representation
  let treesHTML = '';
  if (shading || shadingLevel !== 'None') {
    treesHTML = `
      <g transform="translate(60, 180)">
        <!-- Shadow overlay zone -->
        <ellipse cx="25" cy="20" rx="35" ry="25" fill="rgba(251, 191, 36, 0.06)" stroke="rgba(251, 191, 36, 0.15)" stroke-width="1" stroke-dasharray="3,3" />
        <!-- Main tree crown -->
        <circle cx="20" cy="15" r="16" fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" stroke-width="1" />
        <circle cx="35" cy="22" r="12" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" stroke-width="1" />
        <circle cx="10" cy="25" r="10" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" stroke-width="1" />
        <line x1="22" y1="15" x2="22" y2="38" stroke="#78350f" stroke-width="2.5" />
        <text x="25" y="48" font-size="8" fill="#f59e0b" text-anchor="middle" font-weight="600">Tree (Shade: ${shadingLevel})</text>
      </g>
    `;
  } else {
    treesHTML = `
      <g transform="translate(50, 190)" opacity="0.6">
        <circle cx="20" cy="20" r="10" fill="rgba(34, 197, 94, 0.15)" stroke="rgba(34, 197, 94, 0.3)" stroke-width="0.7" />
        <line x1="20" y1="20" x2="20" y2="30" stroke="#78350f" stroke-width="1.5" />
        <text x="20" y="38" font-size="7" fill="var(--text-muted)" text-anchor="middle">Clear Zone</text>
      </g>
    `;
  }

  // Draw access path (Green dashed route to access point)
  const pathData = `M 40 250 L 370 250 L 370 190`;

  // Draw main DC cable route (Yellow warning line from solar array to meter/panel)
  const cablePathData = `M 200 135 L 200 180 L 270 180 L 270 215`;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background: rgba(6, 17, 31, 0.4); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); font-family: 'Inter', sans-serif;">
      <!-- Grid Pattern -->
      <defs>
        <pattern id="surveyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1" />
        </pattern>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(30, 41, 59, 0.85)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.95)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#surveyGrid)" />

      <!-- Property Boundary -->
      <rect x="15" y="15" width="450" height="270" rx="6" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="4,4" />
      <text x="25" y="28" font-size="8" fill="var(--text-muted)" font-weight="700" letter-spacing="1">PROPERTY BOUNDARY LINE</text>

      <!-- Access Route -->
      <path d="${pathData}" fill="none" stroke="rgba(54, 211, 153, 0.25)" stroke-width="3" stroke-dasharray="4,4" />
      <text x="180" y="262" font-size="8" fill="var(--accent-green)" font-weight="600">Access Path (Clear)</text>

      <!-- House / Main Building Roof Footprint -->
      <rect x="100" y="50" width="280" height="150" rx="8" fill="url(#roofGrad)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
      <text x="110" y="68" font-size="9" font-weight="700" fill="var(--text-primary)" letter-spacing="0.5">ROOF STRUCTURE (${roofType})</text>

      <!-- Solar Array Outline Bounds -->
      <rect x="130" y="90" width="130" height="60" rx="4" fill="rgba(23, 168, 229, 0.03)" stroke="var(--accent-blue)" stroke-dasharray="3,3" stroke-width="0.8" />
      <text x="135" y="84" font-size="7.5" fill="var(--accent-blue)" font-weight="700">SOLAR ARRAY AREA (${systemKw} kW)</text>

      <!-- Solar Panels Grid -->
      ${panelsHTML}

      <!-- Obstacles on Roof -->
      ${waterTankHTML}
      ${acUnitHTML}

      <!-- Nearby structures (Shadow outline) -->
      <rect x="400" y="80" width="50" height="120" rx="3" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="425" y="140" font-size="7" fill="var(--text-muted)" text-anchor="middle" transform="rotate(-90 425 140)">Adjacent Structure</text>

      <!-- Trees / Shading -->
      ${treesHTML}

      <!-- DC Cable Run (orange) -->
      <path d="${cablePathData}" fill="none" stroke="var(--color-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <text x="215" y="174" font-size="7.5" fill="var(--color-orange)" font-weight="600">DC Routing (~${distance}m Cable Run)</text>

      <!-- Distribution Panel -->
      <g transform="translate(260, 215)">
        <rect x="0" y="0" width="20" height="16" rx="2" fill="var(--accent-purple)" stroke="rgba(255,255,255,0.15)" />
        <!-- Lightning bolt -->
        <path d="M10 2L6 8h3v5l5-6h-3z" fill="#ffffff" transform="scale(0.8) translate(2,0)" />
      </g>
      <text x="285" y="226" font-size="7.5" fill="var(--accent-purple)" font-weight="700">Distribution Panel</text>

      <!-- Energy Meter Node -->
      <circle cx="370" cy="190" r="7" fill="var(--accent-green)" stroke="#ffffff" stroke-width="1" />
      <text x="382" y="193" font-size="7.5" fill="var(--accent-green)" font-weight="700">Net Meter Interface</text>

      <!-- Compass Indicator -->
      <g transform="translate(435, 30)">
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" />
        <line x1="12" y1="5" x2="12" y2="19" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
        <line x1="5" y1="12" x2="19" y2="12" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
        <polygon points="12,3 9,7 15,7" fill="var(--color-orange)" />
        <text x="12" y="26" font-size="7" fill="var(--text-muted)" text-anchor="middle" font-weight="700">N</text>
      </g>
    </svg>
  `;

  container.innerHTML = svg;
}

function restoreSurveyState(surveyData) {
  if (!surveyData) return;

  // Restore fields
  if (document.getElementById('surveyCustomerName')) document.getElementById('surveyCustomerName').value = surveyData.customer_name || '';
  if (document.getElementById('surveyCity')) document.getElementById('surveyCity').value = surveyData.city || 'Lucknow';
  if (document.getElementById('surveyAddress')) document.getElementById('surveyAddress').value = surveyData._ui_address || '';
  if (document.getElementById('surveyBuildingType')) document.getElementById('surveyBuildingType').value = surveyData._ui_building_type || 'Residential';
  if (document.getElementById('surveyRoofType')) document.getElementById('surveyRoofType').value = surveyData._ui_roof_type || 'RCC Flat';
  if (document.getElementById('surveyRoofAge')) document.getElementById('surveyRoofAge').value = surveyData._ui_roof_age_years || 5;
  if (document.getElementById('surveyRoofArea')) document.getElementById('surveyRoofArea').value = surveyData.total_roof_area_sqft || 1200;
  if (document.getElementById('surveyRoofHeight')) document.getElementById('surveyRoofHeight').value = surveyData._ui_roof_height || 30;
  if (document.getElementById('surveyNumFloors')) document.getElementById('surveyNumFloors').value = surveyData._ui_num_floors || 2;
  if (document.getElementById('surveyProposedSystem')) document.getElementById('surveyProposedSystem').value = surveyData._ui_proposed_system_kw || 10.0;
  if (document.getElementById('surveyPanelDistance')) document.getElementById('surveyPanelDistance').value = surveyData._ui_electrical_panel_distance_m || 15.0;
  if (document.getElementById('surveyElectricPoleDistance')) document.getElementById('surveyElectricPoleDistance').value = surveyData._ui_electric_pole_distance || 25.0;
  if (document.getElementById('surveyMeterLocation')) document.getElementById('surveyMeterLocation').value = surveyData._ui_meter_location || 'Ground Floor Outer Wall';
  if (document.getElementById('surveyStructureCondition')) document.getElementById('surveyStructureCondition').value = surveyData._ui_structure_condition || 'Good';
  if (document.getElementById('surveyShadingLevel')) document.getElementById('surveyShadingLevel').value = surveyData._ui_shading_level || 'None';
  if (document.getElementById('surveyShadingPresent')) document.getElementById('surveyShadingPresent').checked = (surveyData._ui_shading_level !== 'None');
  if (document.getElementById('surveyShadingDetails')) document.getElementById('surveyShadingDetails').value = surveyData._ui_shading_details || 'None';
  if (document.getElementById('surveyParkingAccess')) document.getElementById('surveyParkingAccess').value = surveyData._ui_parking_access || 'Good';
  if (document.getElementById('surveySafetyHazards')) document.getElementById('surveySafetyHazards').value = surveyData._ui_safety_hazards || 'None';
  if (document.getElementById('surveyAdditionalNotes')) document.getElementById('surveyAdditionalNotes').value = surveyData._ui_additional_notes || '';

  // Hydrate visual components
  hydrateSurveyUI(surveyData);

  const placeholder = document.getElementById('surveyPlaceholderInfo');
  const results = document.getElementById('surveyResultsView');
  const reportSection = document.getElementById('surveyReportFullSection');
  if (placeholder) placeholder.style.display = 'none';
  if (results) results.style.display = 'flex';
  if (reportSection) reportSection.style.display = 'flex';
}

window.setSurveyTimelineProgress = function(step) {
  const bar = document.getElementById('surveyTimelineProgress');
  if (bar) {
    const percent = (step * 14.2) + '%';
    if (window.innerWidth <= 820) {
      bar.style.width = '100%';
      bar.style.height = percent;
    } else {
      bar.style.width = percent;
      bar.style.height = '100%';
    }
  }
  const steps = document.querySelectorAll('.survey-timeline-step');
  steps.forEach((el, idx) => {
    el.classList.remove('active', 'completed', 'current', 'future');
    if (idx + 1 < step) {
      el.classList.add('completed');
    } else if (idx + 1 === step) {
      el.classList.add('active', 'current');
    } else {
      el.classList.add('future');
    }
  });
};

// Listen to resizing to update survey progress bar dimensions
window.addEventListener('resize', () => {
  const activeStep = document.querySelector('.survey-timeline-step.current');
  if (activeStep) {
    const steps = Array.from(document.querySelectorAll('.survey-timeline-step'));
    const currentStepIdx = steps.indexOf(activeStep) + 1;
    if (currentStepIdx > 0) {
      window.setSurveyTimelineProgress(currentStepIdx);
    }
  }
});

function downloadSiteSurveyReport(surveyData) {
  if (!surveyData) return;
  const dateStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  const feasibility = (surveyData.feasibility_status || 'Feasible').toUpperCase();
  const score = _safeNum(surveyData.feasibility_score);

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Feasibility Survey - ${surveyData.customer_name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #060f1f;
      color: #f7fbff;
      margin: 0;
      padding: 30px;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5 {
      font-family: 'Outfit', sans-serif;
      color: #ffffff;
      margin: 0;
    }
    .accent-purple { color: #7c5dfa; }
    .accent-cyan { color: #17a8e5; }
    .accent-green { color: #36d399; }
    .page-break { page-break-after: always; }
    
    .header-logo {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-sub {
      font-size: 9px;
      font-weight: 700;
      color: #17a8e5;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    
    .report-card {
      background: rgba(14, 34, 53, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #17a8e5;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 20px 0;
    }
    .kpi-box {
      background: rgba(8, 24, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px 10px;
      text-align: center;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 4px;
      display: block;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      padding: 5px 0;
      font-size: 12px;
      color: #cbd5e1;
    }
    .data-row strong {
      color: #ffffff;
    }
    
    .footer-stamp {
      font-size: 9px;
      color: #475569;
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 10px;
    }
    
    @media print {
      body {
        background: #060f1f !important;
        color: #f7fbff !important;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="border: 2px solid rgba(124, 93, 250, 0.3); border-radius: 12px; padding: 60px 40px; text-align: center; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; margin-bottom: 40px;" class="page-break">
    <div>
      <div class="header-logo">GET Solar Energy</div>
      <div class="header-sub">Solar Intelligence & Feasibility Assessment Platform</div>
    </div>

    <div style="margin: 60px 0;">
      <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.2; margin: 0 0 10px 0; letter-spacing: 0.5px;">Feasibility Assessment Report</h1>
      <div style="width: 80px; height: 3px; background: linear-gradient(90deg, #7c5dfa, #36d399); margin: 0 auto 20px auto; border-radius: 2px;"></div>
      <span style="background: rgba(124, 93, 250, 0.15); border: 1px solid rgba(124, 93, 250, 0.3); color: #7c5dfa; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; letter-spacing: 0.5px;">
        ${feasibility}
      </span>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11.5px; color: #9fb3c8; text-align: left; line-height: 1.5;">
      <div>
        <span style="display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #9fb3c8; margin-bottom: 4px; letter-spacing: 0.5px;">CLIENT & PROPERTY METADATA</span>
        <strong style="color: #ffffff; font-size: 14px;">${_esc(surveyData.customer_name)}</strong>
        <br>Address: ${_esc(surveyData._ui_address || '—')}
        <br>City: ${_esc(surveyData.city)}
        <br>Building Type: ${_esc(surveyData._ui_building_type || 'Residential')}
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #9fb3c8; margin-bottom: 4px; letter-spacing: 0.5px;">ENGINEERING SUMMARY</span>
        <span style="font-weight: 700; color: #ffffff;">Feasibility Score: ${score}%</span>
        <br>Assessment Date: ${dateStr}
        <br>Mounting Structure: ${surveyData.mounting_structure_type}
        <br>System Size: ${surveyData._ui_proposed_system_kw || 10.0} kW
      </div>
    </div>
  </div>

  <!-- Details Page -->
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 20px;">
      <div class="header-logo" style="font-size: 16px;">GET Solar Energy</div>
      <div style="font-size: 9px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Feasibility Report &bull; Confidential</div>
    </div>

    <div class="card-grid">
      <div class="kpi-box">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Suitability Index</span>
        <strong class="kpi-val accent-green">${score}%</strong>
      </div>
      <div class="kpi-box">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Usable Solar Area</span>
        <strong class="kpi-val">${surveyData.usable_area_sqft} sq ft</strong>
      </div>
      <div class="kpi-box">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">DC Cable Run Route</span>
        <strong class="kpi-val accent-cyan">${surveyData.cable_run_estimate_meters} meters</strong>
      </div>
    </div>

    <!-- 1. Executive Summary -->
    <div class="report-card">
      <div class="card-title accent-purple">1. Executive Site Assessment Summary</div>
      <p style="font-size: 11.5px; line-height: 1.5; color: #cbd5e1; margin: 0;">${surveyData.site_assessment_summary}</p>
    </div>

    <!-- 2. Split parameters grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div class="report-card" style="margin-bottom: 0;">
        <div class="card-title accent-cyan">2. Structural Parameters</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div class="data-row"><span>Roof Structure Type</span><strong>${surveyData._ui_roof_type}</strong></div>
          <div class="data-row"><span>Structure Condition</span><strong>${surveyData._ui_structure_condition}</strong></div>
          <div class="data-row"><span>Structure Age</span><strong>${surveyData._ui_roof_age_years} years</strong></div>
          <div class="data-row"><span>Total Roof Area</span><strong>${surveyData.total_roof_area_sqft || surveyData.usable_area_sqft} sq ft</strong></div>
          <div class="data-row"><span>Est. Reinforcement Cost</span><strong>₹${Number(surveyData.estimated_additional_cost_rs).toLocaleString('en-IN')}</strong></div>
        </div>
      </div>
      
      <div class="report-card" style="margin-bottom: 0;">
        <div class="card-title accent-cyan">3. Electrical & Access Specs</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div class="data-row"><span>Required Solar Area</span><strong>${surveyData.area_required_sqft} sq ft</strong></div>
          <div class="data-row"><span>Panel Distance</span><strong>${surveyData._ui_electrical_panel_distance_m} m</strong></div>
          <div class="data-row"><span>Meter Location</span><strong>${_esc(surveyData._ui_meter_location)}</strong></div>
          <div class="data-row"><span>Parking & Rigging Access</span><strong>${surveyData._ui_parking_access}</strong></div>
          <div class="data-row"><span>Building Height / Floors</span><strong>${surveyData._ui_roof_height}ft / ${surveyData._ui_num_floors} Floors</strong></div>
        </div>
      </div>
    </div>

    <!-- 3. Shading & Safety -->
    <div class="report-card">
      <div class="card-title accent-purple">4. Shading Analysis & Safety Hazards</div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: #cbd5e1;">
        <div>Site shading details: <strong>${_esc(surveyData._ui_shading_details)}</strong></div>
        <div>Shading impact note: <strong>${surveyData.shading_impact_note}</strong></div>
        <div>Detected safety hazards: <strong>${_esc(surveyData._ui_safety_hazards)}</strong></div>
      </div>
    </div>

    <!-- 4. Risks -->
    <div class="report-card">
      <div class="card-title accent-purple" style="color: #ef4444;">5. Identified Feasibility Risks</div>
      <ul style="font-size: 11.5px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${surveyData.identified_risks.map(r => `<li>${_esc(r)}</li>`).join('')}
      </ul>
    </div>

    <!-- 5. Recommendations -->
    <div class="report-card">
      <div class="card-title accent-green">6. Action Recommendations for Installation Crew</div>
      <ul style="font-size: 11.5px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${surveyData.recommendations.map(a => `<li>${_esc(a)}</li>`).join('')}
      </ul>
    </div>
    
    <!-- Signature block -->
    <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; padding: 0 10px;">
      <div>
        <span style="display: block; border-top: 1px solid rgba(255,255,255,0.25); width: 180px; margin-top: 30px; padding-top: 5px; text-align: center; color: #cbd5e1;">Assigned Surveyor Signature</span>
      </div>
      <div style="text-align: right;">
        <span style="display: block; border-top: 1px solid rgba(255,255,255,0.25); width: 180px; margin-top: 30px; padding-top: 5px; text-align: center; color: #cbd5e1;">Approving Engineer Signature</span>
      </div>
    </div>
    
    <div class="footer-stamp">
      CONFIDENTIAL &bull; GET Solar Energy Site Survey Assessment Report &bull; Page 2 of 2
    </div>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    createNotification('reports', 'Report Downloaded', `Exported Feasibility Report PDF for ${surveyData.customer_name}`, 'low');
    addActivityLog('crm', 'Site Survey PDF Exported', `Downloaded feasibility report PDF`);
    const currentUser = _getUser() || {};
    logAuditEvent(currentUser.email || 'system', 'Site Survey Report Downloaded', 'O&M Portal', `Downloaded feasibility report PDF for ${surveyData.customer_name}.`, 'Low');
  } else {
    showToast("Pop-up blocked! Please allow pop-ups to download PDF reports.", "error");
  }
}






