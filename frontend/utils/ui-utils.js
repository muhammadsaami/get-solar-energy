/**
 * GET Solar Energy — Shared UI Utilities
 * Version: 1.0.0
 *
 * Centralized helpers extracted from app.js for reuse across modules.
 * Must be loaded BEFORE app.js via <script> tag in index.html.
 */

/* ==========================================================================
   1. DEBOUNCE
   ========================================================================== */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/* ==========================================================================
   2. SAFE NUMBER COERCION
   ========================================================================== */
function _safeNum(val, fallback = 0) {
  const n = Number(val);
  return isFinite(n) ? n : fallback;
}

/* ==========================================================================
   3. PDF.JS LAZY LOADER
   ========================================================================== */
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

/* ==========================================================================
   4. PDF-TO-IMAGE BLOB CONVERSION
   Unified helper replacing convertPdfToImageBlob + convertSolarPdfToImageBlob.
   ========================================================================== */
async function pdfToImageBlob(pdfFile) {
  const pdfjsLib = await loadPdfJS();
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

/* ==========================================================================
   5. TOAST MESSAGE SYSTEM
   Centralized for the main dashboard. auth.js retains its own version.
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');
  const toastSvg = toast?.querySelector('svg');

  if (toast && toastText) {
    toastText.textContent = message;
    toast.className = 'toast-msg active ' + type;

    if (toastSvg) {
      if (type === 'error') {
        toastSvg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      } else if (type === 'warning') {
        toastSvg.innerHTML = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      } else {
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
   6. PROGRESS BAR SIMULATOR FACTORY
   Reusable factory replacing 4 duplicated setInterval patterns.
   ========================================================================== */
function createProgressSimulator(options) {
  const {
    barEl,
    pctEl,
    statusEl,
    increment = 10,
    intervalMs = 200,
    maxPct = 90,
    steps = {},
    onComplete
  } = options;

  let progress = 0;
  let timerId = null;

  function update(pct, status) {
    if (barEl) barEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (statusEl && status) statusEl.textContent = status;
  }

  timerId = setInterval(() => {
    if (progress < maxPct) {
      progress = Math.min(maxPct, progress + increment);
      const statusMsg = steps[progress] || '';
      update(progress, statusMsg);
    }
  }, intervalMs);

  return {
    getProgress() { return progress; },
    setProgress(pct, status) {
      progress = pct;
      update(pct, status);
    },
    complete(status) {
      clearInterval(timerId);
      progress = 100;
      update(100, status || 'Complete');
      if (onComplete) onComplete();
    },
    clear() {
      clearInterval(timerId);
    },
    destroy() {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

/* ==========================================================================
   7. CHART MANAGER
   Centralized chart lifecycle: create, get, resize, destroy.
   Wraps Chart.js instances to prevent memory leaks and duplicate canvases.
   ========================================================================== */
const ChartManager = (function () {
  const _registry = {};

  /**
   * Register and create a Chart.js instance.
   * Automatically destroys any existing chart on the same canvas.
   */
  function create(canvasId, config) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return null;

    // Destroy existing chart on this canvas if present
    if (_registry[canvasId]) {
      _registry[canvasId].destroy();
      delete _registry[canvasId];
    }

    // Also check for existing Chart.js instance on the canvas (legacy pattern)
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const chart = new Chart(canvas.getContext('2d'), config);
    _registry[canvasId] = chart;

    // Attach ResizeObserver for automatic resize
    if (canvas.parentElement) {
      const ro = new ResizeObserver(debounce(() => {
        if (_registry[canvasId]) {
          _registry[canvasId].resize();
        }
      }, 150));
      ro.observe(canvas.parentElement);
      chart._resizeObserver = ro;
    }

    return chart;
  }

  /** Get a registered chart by canvas ID. */
  function get(canvasId) {
    return _registry[canvasId] || null;
  }

  /** Resize a specific chart. */
  function resize(canvasId) {
    const chart = _registry[canvasId];
    if (chart) chart.resize();
  }

  /** Resize all registered charts. */
  function resizeAll() {
    Object.values(_registry).forEach(chart => {
      if (chart && typeof chart.resize === 'function') chart.resize();
    });
  }

  /** Destroy a specific chart and remove from registry. */
  function destroy(canvasId) {
    const chart = _registry[canvasId];
    if (chart) {
      if (chart._resizeObserver) chart._resizeObserver.disconnect();
      chart.destroy();
      delete _registry[canvasId];
    }
  }

  /** Destroy all charts (e.g., on logout or page unload). */
  function destroyAll() {
    Object.keys(_registry).forEach(destroy);
  }

  /** Get count of registered charts. */
  function count() {
    return Object.keys(_registry).length;
  }

  return { create, get, resize, resizeAll, destroy, destroyAll, count };
})();

/* ==========================================================================
   8. COMPONENT STATE HELPERS
   Reusable showLoading / showError / showEmpty / showContent patterns.
   ========================================================================== */
const ComponentState = (function () {
  /**
   * Show a loading skeleton inside a container.
   * @param {HTMLElement|string} container - Element or ID
   * @param {string} [message='Loading...'] - Optional status message
   */
  function showLoading(container, message) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = `
      <div class="state-loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:12px;">
        <div class="skeleton-loader" style="width:40px;height:40px;border-radius:50%;"></div>
        <span style="font-size:12px;color:var(--text-muted);">${message || 'Loading...'}</span>
      </div>`;
    el.style.display = '';
  }

  /**
   * Show an error state inside a container.
   * @param {HTMLElement|string} container - Element or ID
   * @param {string} message - Error message
   * @param {Function} [onRetry] - Optional retry callback
   */
  function showError(container, message, onRetry) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    const retryBtn = onRetry
      ? `<button class="btn btn-sm" style="margin-top:8px;padding:6px 16px;border-radius:6px;background:var(--accent-orange);color:#fff;border:none;cursor:pointer;font-size:11px;" onclick="(${onRetry.toString()})()">Retry</button>`
      : '';
    el.innerHTML = `
      <div class="state-error" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:8px;text-align:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:32px;height:32px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span style="font-size:12px;color:#ef4444;font-weight:600;">${message || 'Something went wrong'}</span>
        ${retryBtn}
      </div>`;
    el.style.display = '';
  }

  /**
   * Show an empty state inside a container.
   * @param {HTMLElement|string} container - Element or ID
   * @param {string} [message='No data available'] - Empty message
   * @param {string} [icon='box'] - Icon type: 'box', 'search', 'chart'
   */
  function showEmpty(container, message, icon) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    const iconSvg = icon === 'search'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.4;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
      : icon === 'chart'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.4;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.4;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>';
    el.innerHTML = `
      <div class="state-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:8px;text-align:center;color:var(--text-muted);">
        ${iconSvg}
        <span style="font-size:12px;">${message || 'No data available'}</span>
      </div>`;
    el.style.display = '';
  }

  /**
   * Show success state inside a container.
   * @param {HTMLElement|string} container - Element or ID
   * @param {string} [message='Success'] - Success message
   */
  function showSuccess(container, message) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = `
      <div class="state-success" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:8px;text-align:center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="width:32px;height:32px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span style="font-size:12px;color:#16a34a;font-weight:600;">${message || 'Success'}</span>
      </div>`;
    el.style.display = '';
  }

  /**
   * Restore original content (clear any state overlay).
   * @param {HTMLElement|string} container - Element or ID
   */
  function showContent(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    const stateEl = el.querySelector('.state-loading, .state-error, .state-empty, .state-success');
    if (stateEl) stateEl.remove();
  }

  return { showLoading, showError, showEmpty, showSuccess, showContent };
})();
