/**
 * GET Solar Energy – Authentication Logic (auth.js)
 * Handles: mock login, signup, session persistence, particle generation.
 *
 * Future API Integration Points are marked with:
 *   // [API_HOOK] POST /api/login   – replace mock block with real fetch()
 *   // [API_HOOK] POST /api/signup  – replace mock block with real fetch()
 */

'use strict';

/* ═════════════════════════════════════════════════════════════
   CONFIGURATION
   ═════════════════════════════════════════════════════════════ */

const AUTH_CONFIG = {
  /** Storage key for session data */
  SESSION_KEY: 'get_solar_session',
  /** Mock credentials – swap for real API later */
  MOCK_USERS: [
    { email: 'demo@getsolar.in',   password: 'Demo@1234', name: 'Muhammad Haq',    role: 'Premium User' },
    { email: 'admin@getsolar.in',  password: 'Admin@5678', name: 'Admin User',      role: 'Administrator' },
    { email: 'test@getsolar.in',   password: 'Test@9999',  name: 'Solar Tester',    role: 'Free User' },
  ],
  /** Mobile prefix shorthand (treat 10-digit numbers as mobile logins) */
  MOBILE_REGEX: /^[6-9]\d{9}$/,
  SPINNER_DELAY_MS: 1200,
  DASHBOARD_URL: 'index.html',
  LOGIN_URL:     'login.html',
  SIGNUP_URL:    'signup.html',
  PARTICLE_COUNT: 25,
};

/* ═════════════════════════════════════════════════════════════
   SESSION HELPERS
   ═════════════════════════════════════════════════════════════ */

function saveSession(user, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getSession() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/* ═════════════════════════════════════════════════════════════
   PARTICLES
   ═════════════════════════════════════════════════════════════ */

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = [
    'rgba(23, 168, 229, 0.5)',
    'rgba(255, 138, 29, 0.4)',
    'rgba(54, 211, 153, 0.4)',
  ];

  for (let i = 0; i < AUTH_CONFIG.PARTICLE_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'particle';
    const size = 2 + Math.random() * 3;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * duration;

    Object.assign(dot.style, {
      width:            `${size}px`,
      height:           `${size}px`,
      left:             `${left}%`,
      background:       color,
      animationDuration:`${duration}s`,
      animationDelay:   `-${delay}s`,
    });

    container.appendChild(dot);
  }
}

/* ═════════════════════════════════════════════════════════════
   UI HELPERS & VALIDATION HELPERS
   ═════════════════════════════════════════════════════════════ */

function showToast(message, type = 'info', durationMs = 3500) {
  const toast = document.getElementById('authToast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `auth-toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = 'auth-toast';
  }, durationMs);
}

/**
 * Show inline error on field
 */
function showFieldError(inputId, message) {
  const inputEl = document.getElementById(inputId);
  const feedbackEl = document.getElementById(`${inputId}Feedback`);
  if (!inputEl) return;
  
  inputEl.classList.add('input-error');
  inputEl.classList.remove('input-success');
  
  if (feedbackEl) {
    feedbackEl.innerHTML = `<span class="feedback-icon">⚠</span> ${message}`;
    feedbackEl.className = 'input-feedback error';
  }
}

/**
 * Show inline success on field
 */
function showFieldSuccess(inputId, message = '') {
  const inputEl = document.getElementById(inputId);
  const feedbackEl = document.getElementById(`${inputId}Feedback`);
  if (!inputEl) return;
  
  inputEl.classList.remove('input-error');
  inputEl.classList.add('input-success');
  
  if (feedbackEl) {
    feedbackEl.innerHTML = message ? `<span class="feedback-icon">✓</span> ${message}` : '';
    feedbackEl.className = 'input-feedback success';
  }
}

/**
 * Clear individual inline errors
 */
function clearFieldError(inputId) {
  const inputEl = document.getElementById(inputId);
  const feedbackEl = document.getElementById(`${inputId}Feedback`);
  if (!inputEl) return;
  
  inputEl.classList.remove('input-error');
  inputEl.classList.remove('input-success');
  
  if (feedbackEl) {
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'input-feedback';
  }
}

/**
 * Kept for reverse compatibility if standard dashboard flows search for showError()
 */
function showError(bannerId, message) {
  const el = document.getElementById(bannerId);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
  // Also push to toast to guarantee the user sees it prominently without alert box layout shifts
  showToast(message, 'error', 4000);
}

function clearError(bannerId) {
  const el = document.getElementById(bannerId);
  if (el) {
    el.textContent = '';
    el.classList.remove('visible');
  }
}

function setButtonLoading(btnId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  const text = btn?.querySelector('.btn-text');
  const arrow = btn?.querySelector('.btn-arrow');
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    if (spinner) spinner.classList.add('active');
    if (text) text.style.opacity = '0.5';
    if (arrow) arrow.style.opacity = '0';
  } else {
    btn.disabled = false;
    if (spinner) spinner.classList.remove('active');
    if (text) text.style.opacity = '1';
    if (arrow) arrow.style.opacity = '1';
  }
}

/* ═════════════════════════════════════════════════════════════
   PASSWORD VISIBILITY TOGGLE
   ═════════════════════════════════════════════════════════════ */

function initPasswordToggle(toggleBtnId, inputId) {
  const btn = document.getElementById(toggleBtnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    // swap icon
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.innerHTML = isText
        ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
        : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    }
  });
}

/* ═════════════════════════════════════════════════════════════
   PASSWORD STRENGTH METER (signup page)
   ═════════════════════════════════════════════════════════════ */

function initPasswordStrength() {
  const input = document.getElementById('signupPassword');
  if (!input) return;

  const bars = [1, 2, 3, 4].map(n => document.getElementById(`sb${n}`));
  const label = document.getElementById('strengthLabel');
  if (!label) return;

  const levels = [
    { min: 0,  color: '',       text: 'Strength' },
    { min: 1,  color: 'weak',   text: 'Weak' },
    { min: 2,  color: 'fair',   text: 'Fair' },
    { min: 3,  color: 'good',   text: 'Good' },
    { min: 4,  color: 'strong', text: 'Strong' },
  ];

  input.addEventListener('input', () => {
    const val = input.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const level = levels[score] || levels[0];
    bars.forEach((bar, i) => {
      if (bar) bar.className = 'strength-bar' + (i < score ? ` ${level.color}` : '');
    });
    label.textContent = val.length ? level.text : 'Strength';
    label.style.color = score === 4 ? 'var(--accent-green)' : score >= 2 ? 'var(--accent-blue)' : 'var(--text-muted)';
  });
}

/* ═════════════════════════════════════════════════════════════
   REAL API SERVICE & HELPERS
   ═════════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://127.0.0.1:8000';

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    const errMsg = data.detail || (data.error ? data.error : 'Login failed. Invalid credentials.');
    throw new Error(errMsg);
  }

  if (data.success && data.token) {
    saveSession(data.user, data.token);
    return data;
  } else {
    throw new Error(data.message || 'Login failed. Invalid credentials.');
  }
}

async function signup(userData) {
  const response = await fetch(`${API_BASE_URL}/api/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  if (!response.ok) {
    const errMsg = data.detail || (data.error ? data.error : 'Signup failed. Please try again.');
    throw new Error(errMsg);
  }

  if (data.success && data.token) {
    saveSession(data.user, data.token);
    return data;
  } else {
    throw new Error(data.message || 'Signup failed. Please try again.');
  }
}

function logout() {
  clearSession();
  window.location.replace(AUTH_CONFIG.LOGIN_URL);
}

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function getCurrentUser() {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getToken() {
  return localStorage.getItem("token");
}

/* ═════════════════════════════════════════════════════════════
   PAGE: LOGIN
   ═════════════════════════════════════════════════════════════ */

function initLoginPage() {
  // Redirect if already authenticated
  const tokenVal = getToken();
  if (tokenVal) {
    window.location.replace(AUTH_CONFIG.DASHBOARD_URL);
    return;
  }

  initPasswordToggle('toggleLoginPwd', 'loginPassword');

  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput    = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  // Clear errors on input
  emailInput?.addEventListener('input', () => {
    clearFieldError('loginEmail');
    clearError('loginError');
  });
  passwordInput?.addEventListener('input', () => {
    clearFieldError('loginPassword');
    clearError('loginError');
  });

  // Forgot password modal controls
  const forgotModal = document.getElementById('forgotPasswordModal');
  const forgotForm = document.getElementById('forgotPasswordForm');
  const forgotEmailInput = document.getElementById('forgotEmail');
  const forgotSuccessCard = document.getElementById('forgotSuccessCard');

  const openForgotModal = () => {
    if (!forgotModal) return;
    forgotModal.classList.add('active');
    forgotModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // lock scroll
    if (forgotEmailInput) {
      forgotEmailInput.value = '';
      clearFieldError('forgotEmail');
    }
    if (forgotForm) forgotForm.style.display = 'block';
    if (forgotSuccessCard) forgotSuccessCard.style.display = 'none';
    setTimeout(() => forgotEmailInput?.focus(), 150);
  };

  const closeForgotModal = () => {
    if (!forgotModal) return;
    forgotModal.classList.remove('active');
    forgotModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // unlock scroll
    document.getElementById('forgotPasswordBtn')?.focus();
  };

  document.getElementById('forgotPasswordBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotModal();
  });

  document.getElementById('closeForgotModalBtn')?.addEventListener('click', closeForgotModal);
  document.getElementById('backToLoginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeForgotModal();
  });

  forgotModal?.addEventListener('click', (e) => {
    if (e.target === forgotModal) {
      closeForgotModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && forgotModal?.classList.contains('active')) {
      closeForgotModal();
    }
  });

  // Forgot password form submission to existing backend API
  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldError('forgotEmail');
    
    const email = forgotEmailInput?.value?.trim() ?? '';
    if (!email) {
      showFieldError('forgotEmail', 'Email is required.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFieldError('forgotEmail', 'Please enter a valid email address.');
      return;
    }

    setButtonLoading('sendResetBtn', 'forgotSpinner', true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setButtonLoading('sendResetBtn', 'forgotSpinner', false);
      
      if (response.ok && data.success) {
        if (forgotForm) forgotForm.style.display = 'none';
        if (forgotSuccessCard) forgotSuccessCard.style.display = 'block';
        showToast('Password reset processed.', 'success');
      } else {
        const errMsg = data.detail || 'An error occurred. Please try again.';
        showFieldError('forgotEmail', errMsg);
      }
    } catch (err) {
      setButtonLoading('sendResetBtn', 'forgotSpinner', false);
      showFieldError('forgotEmail', 'Server is currently unreachable. Please try again later.');
    }
  });

  // Google / Microsoft social buttons (mock)
  document.getElementById('googleBtn')?.addEventListener('click', () => {
    showToast('Google login coming soon! Use credentials for now.', 'info', 4000);
  });
  document.getElementById('microsoftBtn')?.addEventListener('click', () => {
    showToast('Microsoft login coming soon! Use credentials for now.', 'info', 4000);
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('loginError');
    clearFieldError('loginEmail');
    clearFieldError('loginPassword');

    const identifier = emailInput?.value?.trim() ?? '';
    const password   = passwordInput?.value ?? '';

    // Basic client-side validation
    let hasError = false;
    if (!identifier) {
      showFieldError('loginEmail', 'Email is required.');
      hasError = true;
    } else {
      showFieldSuccess('loginEmail');
    }
    
    if (!password) {
      showFieldError('loginPassword', 'Password is required.');
      hasError = true;
    } else {
      showFieldSuccess('loginPassword');
    }
    
    if (hasError) return;

    const btn = document.getElementById('loginBtn');
    const btnText = btn?.querySelector('.btn-text');
    const originalText = btnText ? btnText.innerHTML : 'Login & Continue →';
    if (btnText) btnText.innerHTML = 'Logging In...';

    setButtonLoading('loginBtn', 'loginSpinner', true);

    try {
      const result = await login(identifier, password);
      
      showFieldSuccess('loginEmail', 'Verification successful');
      showFieldSuccess('loginPassword', 'Password verified');
      showToast(`Welcome back, ${result.user.name}! 🎉`, 'success', 2000);
      setTimeout(() => {
        window.location.replace(AUTH_CONFIG.DASHBOARD_URL);
      }, 800);
    } catch (err) {
      setButtonLoading('loginBtn', 'loginSpinner', false);
      if (btnText) btnText.innerHTML = originalText;
      
      const errorMsg = err.message || 'Wrong password or invalid credentials';
      showFieldError('loginEmail', errorMsg);
      showFieldError('loginPassword', 'Invalid credentials');
      showToast(errorMsg, 'error', 4000);
    }
  });
}

/* ═════════════════════════════════════════════════════════════
   PAGE: SIGNUP
   ═════════════════════════════════════════════════════════════ */

function initSignupPage() {
  // Redirect if already authenticated
  const tokenVal = getToken();
  if (tokenVal) {
    window.location.replace(AUTH_CONFIG.DASHBOARD_URL);
    return;
  }

  initPasswordToggle('toggleSignupPwd',     'signupPassword');
  initPasswordToggle('toggleSignupConfirm', 'signupConfirm');
  initPasswordStrength();

  const form = document.getElementById('signupForm');
  if (!form) return;

  const nameInput    = document.getElementById('signupName');
  const mobileInput  = document.getElementById('signupMobile');
  const emailInput   = document.getElementById('signupEmail');
  const pwdInput     = document.getElementById('signupPassword');
  const confirmInput = document.getElementById('signupConfirm');

  // Clear feedback on user input
  const fields = ['signupName', 'signupMobile', 'signupEmail', 'signupPassword', 'signupConfirm'];
  [nameInput, mobileInput, emailInput, pwdInput, confirmInput].forEach((el, index) => {
    el?.addEventListener('input', () => {
      clearFieldError(fields[index]);
      clearError('signupError');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('signupError');
    fields.forEach(field => clearFieldError(field));

    const name    = nameInput?.value?.trim() ?? '';
    const mobile  = mobileInput?.value?.trim() ?? '';
    const email   = emailInput?.value?.trim() ?? '';
    const pwd     = pwdInput?.value ?? '';
    const confirm = confirmInput?.value ?? '';

    // Validation
    let hasError = false;

    if (!name) {
      showFieldError('signupName', 'Full name is required.');
      hasError = true;
    } else {
      showFieldSuccess('signupName');
    }

    if (!mobile || !AUTH_CONFIG.MOBILE_REGEX.test(mobile.replace(/\s/g, ''))) {
      showFieldError('signupMobile', 'Enter a valid 10-digit mobile number.');
      hasError = true;
    } else {
      showFieldSuccess('signupMobile');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('signupEmail', 'Enter a valid email address.');
      hasError = true;
    } else {
      showFieldSuccess('signupEmail');
    }

    if (pwd.length < 8) {
      showFieldError('signupPassword', 'Password must be at least 8 characters.');
      hasError = true;
    } else {
      showFieldSuccess('signupPassword');
    }

    if (pwd !== confirm || !confirm) {
      showFieldError('signupConfirm', 'Passwords do not match.');
      hasError = true;
    } else {
      showFieldSuccess('signupConfirm');
    }

    if (hasError) return;

    const btn = document.getElementById('signupBtn');
    const btnText = btn?.querySelector('.btn-text');
    const originalText = btnText ? btnText.innerHTML : 'Create My Account &rarr;';
    if (btnText) btnText.innerHTML = 'Creating Account...';

    setButtonLoading('signupBtn', 'signupSpinner', true);

    try {
      const result = await signup({
        name,
        phone: mobile,
        email,
        password: pwd,
        city: "Lucknow"
      });

      showToast(`Account created! Welcome, ${result.user.name} 🌞`, 'success', 2000);
      setTimeout(() => {
        window.location.replace(AUTH_CONFIG.DASHBOARD_URL);
      }, 900);
    } catch (err) {
      setButtonLoading('signupBtn', 'signupSpinner', false);
      if (btnText) btnText.innerHTML = originalText;

      const errorMsg = err.message || 'Signup failed. Please try again.';
      showFieldError('signupEmail', errorMsg);
      showToast(errorMsg, 'error', 4000);
    }
  });
}

function initResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token');
  const form = document.getElementById('resetPasswordForm');
  const tokenErrorCard = document.getElementById('tokenErrorCard');
  const tokenErrorText = document.getElementById('tokenErrorText');

  if (!token) {
    if (form) form.style.display = 'none';
    if (tokenErrorCard) {
      tokenErrorCard.style.display = 'block';
      tokenErrorText.textContent = 'Invalid or missing password reset link.';
    }
    return;
  }

  // Initialize toggle buttons
  initPasswordToggle('toggleResetPwd', 'resetPassword');
  initPasswordToggle('toggleConfirmPwd', 'confirmPassword');

  const pwdInput = document.getElementById('resetPassword');
  const confirmInput = document.getElementById('confirmPassword');
  const errorBanner = document.getElementById('resetError');
  const successCard = document.getElementById('resetSuccessCard');
  const countdownText = document.getElementById('countdownText');

  const requirements = {
    length:  { el: document.getElementById('reqLength'),  icon: document.getElementById('iconLength'),  test: (val) => val.length >= 8 && val.length <= 72 },
    upper:   { el: document.getElementById('reqUpper'),   icon: document.getElementById('iconUpper'),   test: (val) => /[A-Z]/.test(val) },
    lower:   { el: document.getElementById('reqLower'),   icon: document.getElementById('iconLower'),   test: (val) => /[a-z]/.test(val) },
    digit:   { el: document.getElementById('reqDigit'),   icon: document.getElementById('iconDigit'),   test: (val) => /\d/.test(val) },
    special: { el: document.getElementById('reqSpecial'), icon: document.getElementById('iconSpecial'), test: (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val) }
  };

  const checkRequirements = () => {
    const val = pwdInput?.value ?? '';
    let allValid = true;
    for (const key in requirements) {
      const req = requirements[key];
      if (!req.el || !req.icon) continue;
      const isValid = req.test(val);
      if (isValid) {
        req.el.className = 'pwd-req-item valid';
        req.icon.textContent = '✓';
      } else {
        req.el.className = 'pwd-req-item invalid';
        req.icon.textContent = '✕';
        allValid = false;
      }
    }
    return allValid;
  };

  pwdInput?.addEventListener('input', () => {
    checkRequirements();
    clearFieldError('resetPassword');
    clearError('resetError');
  });

  confirmInput?.addEventListener('input', () => {
    clearFieldError('confirmPassword');
    clearError('resetError');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('resetError');
    clearFieldError('resetPassword');
    clearFieldError('confirmPassword');

    const newPassword = pwdInput?.value ?? '';
    const confirmPassword = confirmInput?.value ?? '';

    const requirementsPassed = checkRequirements();
    if (!requirementsPassed) {
      showFieldError('resetPassword', 'Password does not meet all security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match.');
      return;
    }

    setButtonLoading('resetBtn', 'resetSpinner', true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        })
      });

      const data = await response.json();
      setButtonLoading('resetBtn', 'resetSpinner', false);

      if (response.ok && data.success) {
        if (form) form.style.display = 'none';
        if (successCard) successCard.style.display = 'block';
        showToast('Password reset successfully!', 'success');
        
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        let seconds = 5;
        const interval = setInterval(() => {
          seconds--;
          if (countdownText) countdownText.textContent = seconds;
          if (seconds <= 0) {
            clearInterval(interval);
            window.location.replace(AUTH_CONFIG.LOGIN_URL);
          }
        }, 1000);
      } else {
        const errMsg = data.detail || 'Failed to reset password. Please try again.';
        showError('resetError', errMsg);
      }
    } catch (err) {
      setButtonLoading('resetBtn', 'resetSpinner', false);
      showError('resetError', 'Server is currently unreachable. Please try again later.');
    }
  });
}

/* ═════════════════════════════════════════════════════════════
   EXPORTS
   ═════════════════════════════════════════════════════════════ */

window.login = login;
window.signup = signup;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getToken = getToken;
window.authLogout = logout;
window.getSession = getSession;
window.initResetPasswordPage = initResetPasswordPage;

/* ═════════════════════════════════════════════════════════════
   INIT
   ═════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  const path = window.location.pathname;
  if (path.includes('signup')) {
    initSignupPage();
  } else if (path.includes('reset-password')) {
    initResetPasswordPage();
  } else if (path.includes('login') || document.getElementById('loginForm')) {
    initLoginPage();
  }
});
