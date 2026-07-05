/**
 * GET Solar Energy - Public Landing Page Interactive Script
 * Features: Sizing logic (1600 divisor), dynamic typing calculations with shimmers,
 * animated stats intersection observers, active timeline connectors, and tracking hooks.
 */

document.addEventListener('DOMContentLoaded', () => {
  initQuickEstimate();
  initLiveStatsCounter();
  initTimelineProgress();
  initMobileMenu();
  initAmbientParticles();
  initFeatureCardMouseFollow();
  initDynamicBanner();
  initStickyHeader();
  initScrollProgress();
  initActiveSectionHighlight();
  init3DHeroTilt();
  
  // Phase 6.0B: Unified Cinematic Storytelling Engine
  CinematicEngine.init();
});

/* ==========================================================================
   1. ANALYTICS CTA TRACKING WRAPPER (Phase 7.1 Upgrade)
   ========================================================================== */
function trackCTA(payload) {
  if (typeof payload === 'string') {
    payload = {
      action: payload,
      location: 'unknown',
      timestamp: Date.now()
    };
  }
  console.log('[CTA]', payload);
}

/* ==========================================================================
   2. ESTIMATE EXPERIENCE — PERSONALIZED SOLAR ASSESSMENT (Phase 4.3)
   ========================================================================== */

/**
 * PM Surya Ghar Subsidy Calculator (Central Government scheme, 2024 rates)
 * - 1–2 kW: ₹30,000/kW
 * - 2–3 kW: ₹60,000 + ₹18,000 for the 3rd kW
 * - >3 kW: fixed cap at ₹78,000
 */
function calculateSubsidy(kW) {
  if (kW <= 2) return Math.round(kW * 30000);
  if (kW <= 3) return 60000 + Math.round((kW - 2) * 18000);
  return 78000;
}

/**
 * Format a number as Indian currency (compact if ≥ 1 lakh)
 */
function formatInrCompact(amount) {
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + ' L';
  }
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function calculateEstimate(city, monthlyBill) {
  // Sizing logic using 1600 divisor
  const recommendedSize = Math.max(
    1,
    Math.round((monthlyBill / 1600) * 2) / 2
  );

  const monthlySavings = Math.round(monthlyBill * 0.9);
  const annualSavings = monthlySavings * 12;
  const paybackYears = (4 + (recommendedSize * 0.15)).toFixed(1);

  return {
    recommendedSize,
    monthlySavings,
    annualSavings,
    paybackYears
  };
}

function initQuickEstimate() {
  const calcBtn         = document.getElementById('quickEstimateCTA');
  const billInput       = document.getElementById('estBill');
  const citySelect      = document.getElementById('estCity');
  const outputContainer = document.getElementById('estimateOutput');
  const shimmerLoader   = document.getElementById('shimmerLoader');

  // Result element refs
  const outEstSavings       = document.getElementById('outEstSavings');
  const outEstSize          = document.getElementById('outEstSize');
  const outEstAnnualSavings = document.getElementById('outEstAnnualSavings');
  const outEstPayback       = document.getElementById('outEstPayback');
  const outEstLifetime      = document.getElementById('outEstLifetime');
  const outSubsidyAmount    = document.getElementById('outSubsidyAmount');
  const resultCityEl        = document.getElementById('estimateResultCity');
  const resultSubtitleEl    = document.getElementById('estimateResultSubtitle');
  const insightNoteEl       = document.getElementById('calcInsightText');

  // Inline validation
  const msgCity = document.getElementById('validationMsgCity');
  const msgBill = document.getElementById('validationMsgBill');

  // Legacy compat refs (hidden in DOM, JS still reads them safely)
  const insightPanel        = document.getElementById('calcInsightPanel');
  const confidenceContainer = document.getElementById('aiConfidenceContainer');
  const confidenceBadge     = document.getElementById('confidenceBadge');

  if (!calcBtn || !billInput || !citySelect || !outputContainer) return;

  // City display name map
  const CITY_LABELS = {
    Lucknow:   'Lucknow, UP',
    Noida:     'Noida, UP',
    Delhi:     'Delhi',
    Mumbai:    'Mumbai, MH',
    Bengaluru: 'Bengaluru, KA',
    Jaipur:    'Jaipur, RJ',
  };

  let calculateTimeout = null;

  /** Show or hide an inline validation message */
  function showValidation(el, visible) {
    if (!el) return;
    el.style.display = visible ? 'block' : 'none';
  }

  /** Trigger staggered CSS entrance animation on all .result-reveal elements */
  function triggerRevealAnimations() {
    const reveals = outputContainer.querySelectorAll('.result-reveal');
    reveals.forEach((el) => {
      el.classList.remove('is-visible');
      void el.offsetWidth; // force reflow to restart animation
      el.classList.add('is-visible');
    });
  }

  function runCalculation(isImmediate = false) {
    const billVal = parseFloat(billInput.value);
    const cityVal = citySelect.value;

    if (!cityVal || isNaN(billVal) || billVal <= 0) return;

    // Persist for signup pre-fill
    localStorage.setItem('solar_estimate_city', cityVal);
    localStorage.setItem('solar_estimate_bill', billVal.toString());

    // Show shimmer + container
    if (shimmerLoader) shimmerLoader.style.display = 'block';
    if (outputContainer.style.display !== 'block') {
      outputContainer.style.display = 'block';
    }

    const delay = isImmediate ? 0 : 300;

    setTimeout(() => {
      if (shimmerLoader) shimmerLoader.style.display = 'none';

      // --- Core calculation (unchanged) ---
      const result = calculateEstimate(cityVal, billVal);

      // --- Extended calculations ---
      const subsidy       = calculateSubsidy(result.recommendedSize);
      // 25-yr lifetime return: annualSavings × 25 × degradation factor (0.82)
      const lifetimeReturn = Math.round(result.annualSavings * 25 * 0.82);

      // --- Personalized header ---
      const cityLabel = CITY_LABELS[cityVal] || cityVal;
      if (resultCityEl) resultCityEl.textContent = cityLabel;
      if (resultSubtitleEl) {
        resultSubtitleEl.textContent = `Based on your ₹${Math.round(billVal).toLocaleString('en-IN')} monthly bill`;
      }

      // --- Animate main metrics ---
      animateEstimateValue(outEstSavings,       0, result.monthlySavings,   '₹', 0, 1000, true);
      animateEstimateValue(outEstSize,          0, result.recommendedSize,  ' kW', 1, 800);
      animateEstimateValue(outEstAnnualSavings, 0, result.annualSavings,    '₹', 0, 1100, true);
      animateEstimateValue(outEstPayback,       0, result.paybackYears,     ' Yrs', 1, 900);
      animateEstimateValue(outEstLifetime,      0, lifetimeReturn,          '₹', 0, 1200, true);

      // --- Subsidy card ---
      if (outSubsidyAmount) {
        outSubsidyAmount.textContent = formatInrCompact(subsidy);
      }

      // --- Insight note ---
      if (insightNoteEl) {
        const paybackDisplay = parseFloat(result.paybackYears).toFixed(1);
        const sizeDisplay = parseFloat(result.recommendedSize).toFixed(1);
        insightNoteEl.textContent =
          `A ${sizeDisplay} kW system in ${cityLabel} can offset ~90% of your bill. ` +
          `After the ₹${subsidy.toLocaleString('en-IN')} government subsidy, your net payback is under ${paybackDisplay} years.`;
      }


      // --- Trigger staggered reveal animations ---
      triggerRevealAnimations();

      // --- Legacy compat (elements hidden, safe to call) ---
      if (insightPanel) insightPanel.style.display = 'none';
      if (confidenceContainer) confidenceContainer.style.display = 'none';
      if (confidenceBadge) confidenceBadge.style.display = 'none';

    }, delay);
  }

  // Debounced live recalculation on bill input
  billInput.addEventListener('input', () => {
    showValidation(msgBill, false);
    if (calculateTimeout) clearTimeout(calculateTimeout);
    calculateTimeout = setTimeout(() => runCalculation(false), 400);
  });

  // Immediate recalculation on city change
  citySelect.addEventListener('change', () => {
    showValidation(msgCity, false);
    runCalculation(true);
  });

  // Calculate button — inline validation instead of alert()
  calcBtn.addEventListener('click', () => {
    trackCTA({ action: 'quick_estimate', location: 'hero_card', timestamp: Date.now() });

    const billVal = parseFloat(billInput.value);
    const cityVal = citySelect.value;

    let hasError = false;

    if (!cityVal) {
      showValidation(msgCity, true);
      citySelect.focus();
      hasError = true;
    } else {
      showValidation(msgCity, false);
    }

    if (!hasError && (isNaN(billVal) || billVal < 500)) {
      showValidation(msgBill, true);
      billInput.focus();
      hasError = true;
    } else {
      showValidation(msgBill, false);
    }

    if (!hasError) runCalculation(true);
  });
}

/**
 * Values animation count-up/transition utility
 */
function animateEstimateValue(element, start, end, suffixOrPrefix, decimals = 0, duration = 800, isPrefix = false, extraSuffix = '') {
  if (!element) return;
  
  const endNum = parseFloat(end);
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = start + (endNum - start) * easeProgress;
    
    let formattedVal = currentVal.toFixed(decimals);
    if (decimals === 0) {
      formattedVal = Math.round(currentVal).toLocaleString('en-IN');
    }

    if (isPrefix) {
      element.textContent = suffixOrPrefix + formattedVal + extraSuffix;
    } else {
      element.textContent = formattedVal + suffixOrPrefix;
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ==========================================================================
   3. STATS COUNT-UP SCROLL ANIMATION (PlatformMetricsProvider Integration)
   ========================================================================== */
class PlatformMetricsProvider {
  constructor() {
    this.data = {
      billsAnalyzed: 25000,
      customerSavingsCr: 12.4,
      citiesServed: 12,
      certifiedPartners: 45,
      customerSatisfaction: 99.2
    };
  }

  async fetchMetrics() {
    // Easily configurable to map REST/GraphQL fetch API in future.
    return this.data;
  }
}

function initLiveStatsCounter() {
  const metricsStrip = document.getElementById('metricsStrip');
  if (!metricsStrip) return;

  const provider = new PlatformMetricsProvider();

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        
        const metrics = await provider.fetchMetrics();
        
        const cardConfigs = [
          { id: 'metricBillsCount', wrapperId: 'metricCard1', val: metrics.billsAnalyzed, prefix: '', suffix: '+', delay: 0 },
          { id: 'metricSavingsCount', wrapperId: 'metricCard2', val: metrics.customerSavingsCr, prefix: '₹', suffix: ' Cr+', delay: 150 },
          { id: 'metricCitiesCount', wrapperId: 'metricCard3', val: metrics.citiesServed, prefix: '', suffix: '+', delay: 300 },
          { id: 'metricPartnersCount', wrapperId: 'metricCard4', val: metrics.certifiedPartners, prefix: '', suffix: '+', delay: 450 },
          { id: 'metricSatisfactionCount', wrapperId: 'metricCard5', val: metrics.customerSatisfaction, prefix: '', suffix: '%', delay: 600 }
        ];

        cardConfigs.forEach((config) => {
          setTimeout(() => {
            const cardEl = document.getElementById(config.id);
            const wrapperEl = document.getElementById(config.wrapperId);
            if (wrapperEl) {
              wrapperEl.classList.add('animate-in');
            }
            if (cardEl) {
              animateCounter(cardEl, 0, config.val, config.prefix, config.suffix, 2000);
            }
          }, config.delay);
        });
      }
    });
  }, { threshold: 0.1 });

  observer.observe(metricsStrip);
}

function animateCounter(element, start, end, prefix, suffix, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out quartic
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const currentVal = start + (end - start) * easeProgress;
    
    let displayVal = '';
    if (end % 1 === 0) {
      displayVal = Math.round(currentVal).toLocaleString('en-IN');
    } else {
      displayVal = currentVal.toFixed(1);
    }

    element.textContent = prefix + displayVal + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ==========================================================================
   4. HOW IT WORKS TIMELINE ACTIVE CONNECTOR (6.8 Timeline Upgrade)
   ========================================================================== */
function initTimelineProgress() {
  const steps = document.querySelectorAll('.timeline-step');
  const activeLine = document.getElementById('activeTimelineLine');
  if (steps.length === 0 || !activeLine) return;

  const observerOptions = {
    root: null,
    threshold: 0.5,
    rootMargin: '-50px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepNum = parseInt(entry.target.getAttribute('data-step'));
        
        // Mark all steps up to stepNum as active
        steps.forEach(s => {
          const sNum = parseInt(s.getAttribute('data-step'));
          if (sNum <= stepNum) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });

        // Update active connector line width
        const totalSteps = steps.length;
        const progressPercentage = ((stepNum - 1) / (totalSteps - 1)) * 100;
        activeLine.style.width = `${progressPercentage}%`;
      }
    });
  }, observerOptions);

  steps.forEach(step => observer.observe(step));
}



/* ==========================================================================
   6. MOBILE MENU TOGGLE LOGIC
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  const closeBtn = document.getElementById('drawerCloseBtn');
  if (!toggleBtn || !drawer || !closeBtn) return;

  toggleBtn.addEventListener('click', () => {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  });

  const closeDrawer = () => {
    drawer.classList.remove('active');
    document.body.style.overflow = ''; // restore background scroll
  };

  closeBtn.addEventListener('click', closeDrawer);

  const drawerLinks = drawer.querySelectorAll('a');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   7. AMBIENT PARTICLES EFFECTS (6.8 Background Atmosphere)
   ========================================================================== */
function initAmbientParticles() {
  const container = document.getElementById('ambientParticles');
  if (!container) return;

  const particleCount = 20;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 4 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = Math.random() > 0.5 ? '#00B5E2' : '#F59E0B';
    particle.style.borderRadius = '50%';
    particle.style.opacity = Math.random() * 0.15 + 0.05 + '';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.left = Math.random() * 100 + '%';
    
    // Ambient floating keyframes
    const floatDuration = Math.random() * 15 + 15;
    particle.style.animation = `floatParticle ${floatDuration}s infinite linear alternate`;
    
    container.appendChild(particle);
  }

  // Inject dynamic keyframes if not defined
  if (!document.getElementById('particleKeyframes')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'particleKeyframes';
    styleSheet.textContent = `
      @keyframes floatParticle {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px) scale(1.3); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

/* ==========================================================================
   8. FEATURE CARDS MOUSE FOLLOW GLOW (Phase 7.1)
   ========================================================================== */
function initFeatureCardMouseFollow() {
  const cards = document.querySelectorAll('.feature-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* ==========================================================================
   9. DYNAMIC PLATFORM INTELLIGENCE BANNER (Phase 7.1)
   ========================================================================== */
function initDynamicBanner() {
  const banner = document.getElementById('heroDynamicBanner');
  if (!banner) return;

  const facts = [
    "Analyzing over 25,000 electricity bills and rooftop assessments across India.",
    "Real-time integration active with Surya Ghar national subsidy guidelines.",
    "Average consumer bill reduction estimated at 84% post install.",
    "Over 120 MW of solar capacity potential scanned in UP, NCR & Gujarat."
  ];

  let index = 0;
  setInterval(() => {
    banner.style.opacity = '0';
    setTimeout(() => {
      index = (index + 1) % facts.length;
      banner.textContent = facts[index];
      banner.style.opacity = '1';
    }, 600);
  }, 6000);
}

/* ==========================================================================
   10. SCROLL PROGRESS INDICATOR & STICKY HEADER & ACTIVE SECTION HIGHLIGHTS
   ========================================================================== */
function initStickyHeader() {
  const header = document.getElementById('navbarHeader');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initScrollProgress() {
  const progressEl = document.getElementById('scrollProgress');
  if (!progressEl) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressEl.style.width = scrolled + '%';
  });
}

function initActiveSectionHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link-item');
  if (sections.length === 0 || navItems.length === 0) return;

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href').slice(1) === current) {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   11. CINEMATIC 3D HERO MOUSE TILT & SCROLL PARALLAX (Phase 3.3, 4.2A)
   ========================================================================== */
function init3DHeroTilt() {
  const scene = document.querySelector('.hero-3d-scene');
  if (!scene) return;

  // Respect prefers-reduced-motion — disable tilt entirely if user has motion sensitivity
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  scene.addEventListener('mousemove', (e) => {
    // Only tilt on desktop screens (width > 1024px)
    if (window.innerWidth <= 1024) return;

    const rect = scene.getBoundingClientRect();
    const x = e.clientX - rect.left - (rect.width / 2);
    const y = e.clientY - rect.top - (rect.height / 2);

    // Limit rotation to max 6deg
    const rotateX = -(y / rect.height) * 12;
    const rotateY = (x / rect.width) * 12;

    const villa = scene.querySelector('.solar-villa-card');
    const shadow = scene.querySelector('.villa-ground-shadow');

    if (villa) {
      villa.style.transform = `rotateX(${8 + rotateX}deg) rotateY(${-12 + rotateY}deg)`;
    }
    if (shadow) {
      // Offset shadow opposite to tilt to simulate fixed light source
      shadow.style.transform = `rotateX(80deg) translateZ(-50px) translateX(${-rotateY * 2.2}px) translateY(${-rotateX * 2.2}px)`;
    }
  });

  scene.addEventListener('mouseleave', () => {
    const villa = scene.querySelector('.solar-villa-card');
    const shadow = scene.querySelector('.villa-ground-shadow');

    if (villa) {
      villa.style.transform = `rotateX(8deg) rotateY(-12deg)`;
    }
    if (shadow) {
      shadow.style.transform = `rotateX(80deg) translateZ(-50px)`;
    }
  });
}

/* ==========================================================================
   11. CINEMATIC SCENE OBSERVER & MOTION ENGINE (Phase 6.0B)
   ========================================================================== */
const CinematicEngine = {
  scenes: [],
  ticking: false,
  reducedMotion: false,
  isMobile: false,

  init() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth < 768;
    this.scenes = Array.from(document.querySelectorAll('.cinematic-scene'));
    
    if (this.scenes.length === 0) return;

    this.setupIntersectionObserver();

    // Disable continuous rAF loop on mobile or reduced-motion
    if (!this.reducedMotion && !this.isMobile) {
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => {
        this.isMobile = window.innerWidth < 768;
      });
    }
  },

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-playing');
          entry.target.dataset.intersecting = "true";
          
          // Trigger discrete entry animations
          const innerElements = entry.target.querySelectorAll('.scene-element, .why-card');
          innerElements.forEach(el => el.classList.add('is-visible'));
          
        } else {
          entry.target.dataset.intersecting = "false";
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "300px 0px"
    });

    this.scenes.forEach(scene => observer.observe(scene));
  },

  onScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.renderFrame(window.scrollY);
        this.ticking = false;
      });
      this.ticking = true;
    }
  },

  renderFrame(scrollY) {
    // Only process scenes that are intersecting to save GPU budget
    this.scenes.forEach(scene => {
      if (scene.dataset.intersecting !== "true") return;

      const rect = scene.getBoundingClientRect();
      const relativeScroll = rect.top; // 0 when top of scene hits top of viewport
      
      const cameraType = scene.getAttribute('data-camera');
      if (!cameraType) return;

      const bgLayer = scene.querySelector('.layer-bg');
      if (!bgLayer) return;

      // Parallax math normalized roughly -1 to 1 based on viewport
      const progress = relativeScroll / window.innerHeight;

      switch(cameraType) {
        case 'arrival':
          // Extremely slow, subconscious push-in
          const scalePush = 1 + (scrollY * 0.00005);
          bgLayer.style.transform = `scale(${Math.max(1, Math.min(1.05, scalePush))})`;
          
          // Hero specific floating widgets parallax
          const heroWidgets = scene.querySelectorAll('.floating-widget');
          heroWidgets.forEach((w, i) => {
             const depth = (i % 2 === 0 ? 0.15 : -0.15);
             w.style.transform = `translateZ(${60 + scrollY*depth}px) translateY(${scrollY * 0.08}px)`;
          });
          break;
          
        case 'estimate':
          // Subtle focal shift (y parallax)
          const focalY = progress * 15;
          bgLayer.style.transform = `translateY(${focalY}px) scale(1.02)`;
          break;
          
        case 'roof':
          // Camera slowly rises tracking sunlight
          const riseY = Math.max(-40, progress * 30);
          bgLayer.style.transform = `translateY(${riseY}px) scale(1.03)`;
          break;
          
        case 'installation':
          // Slow documentary horizontal pan
          const panX = progress * -25;
          bgLayer.style.transform = `translateX(${panX}px) scale(1.04)`;
          break;
          
        case 'technology':
          // Precision macro focus pull-back
          const macroPull = 1.05 - (Math.abs(progress) * 0.03);
          bgLayer.style.transform = `scale(${Math.max(1, macroPull)})`;
          break;

        case 'savings':
          // Grand drone pull-back
          const dronePull = 1.08 - (Math.abs(progress) * 0.06);
          bgLayer.style.transform = `scale(${Math.max(1, dronePull)})`;
          break;
          
        case 'lifestyle':
          // Absolute stillness
          bgLayer.style.transform = `translateY(0) scale(1)`;
          break;
          
        case 'conversion':
          // Gentle forward movement toward CTA
          const ctaPush = 1 + (Math.max(0, -progress) * 0.04);
          bgLayer.style.transform = `scale(${Math.min(1.06, ctaPush)}) translateY(${progress * 15}px)`;
          break;
      }
    });
  }
};
