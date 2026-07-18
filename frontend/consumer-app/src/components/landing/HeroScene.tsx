import { type MetricConfig, useIntersectionCounter } from '../../hooks/useIntersectionCounter'
import { trackCTA } from '../../utils/analytics'

const METRICS: MetricConfig[] = [
  {
    key: 'billsAnalyzed',
    endValue: 25000,
    label: 'Bills Analyzed',
    suffix: '+',
    delay: 0,
  },
  {
    key: 'customerSavings',
    endValue: 12.4,
    label: 'Customer Savings',
    prefix: '₹',
    suffix: ' Cr+',
    delay: 150,
    decimals: 1,
  },
  {
    key: 'citiesServed',
    endValue: 12,
    label: 'Cities Served',
    suffix: '+',
    delay: 300,
  },
]

function HeroBadge() {
  return (
    <div className="hero-badge-container">
      <div className="hero-accent-badge">
        <span className="badge-check-icon">{'\u2713'}</span>
        Trusted Solar Solutions Across India
      </div>
    </div>
  )
}

function HeroTitle() {
  return (
    <h1 className="hero-main-title">
      Analyze. Plan. <br />
      <span className="highlight-orange">Save</span> with Solar.
    </h1>
  )
}

function HeroDescription() {
  return (
    <p className="hero-description-paragraph">
      Design your custom solar layout, calculate your exact savings, and verify
      government subsidies.
    </p>
  )
}

function HeroCTA() {
  return (
    <div className="hero-action-ctas">
      <a
        href="#sceneEstimate"
        className="btn-hero-primary"
        onClick={() => trackCTA('hero_primary')}
      >
        Start Free Assessment
      </a>
      <a
        href="#how-it-works"
        className="btn-hero-secondary"
        onClick={() => trackCTA('hero_secondary')}
      >
        See How It Works
      </a>
    </div>
  )
}

function TrustPills() {
  return (
    <div className="hero-trust-pills">
      <span className="trust-pill">{'\u{1F1EE}\u{1F1F3}'} PM Surya Ghar Ready</span>
      <span className="trust-pill">Government Subsidy Support</span>
      <span className="trust-pill">PAN India Coverage</span>
    </div>
  )
}

function PlatformMetricsStrip() {
  const { values, containerRef, hasAnimated } = useIntersectionCounter(METRICS)

  return (
    <div
      className="hero-stats-grid"
      ref={containerRef}
      style={{ marginTop: 40 }}
    >
      <div
        className={`hero-stat-item${hasAnimated ? ' animate-in' : ''}`}
        style={{ transitionDelay: '0ms' }}
      >
        <span className="stat-num">{values.billsAnalyzed}</span>
        <span className="stat-lbl">Bills Analyzed</span>
      </div>
      <div
        className={`hero-stat-item${hasAnimated ? ' animate-in' : ''}`}
        style={{ transitionDelay: '150ms' }}
      >
        <span className="stat-num">{values.customerSavings}</span>
        <span className="stat-lbl">Customer Savings</span>
      </div>
      <div
        className={`hero-stat-item${hasAnimated ? ' animate-in' : ''}`}
        style={{ transitionDelay: '300ms' }}
      >
        <span className="stat-num">{values.citiesServed}</span>
        <span className="stat-lbl">Cities Served</span>
      </div>
    </div>
  )
}

export default function HeroScene() {
  return (
    <article
      className="cinematic-scene scene-hero"
      id="sceneHero"
      data-camera="arrival"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/frontend/assets/Cinematic/Asset 1.webp"
          alt="Premium solar home"
          fetchPriority="high"
        />
      </div>
      <div className="lighting-overlay lighting-warm" />

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          className="hero-left-col"
          style={{
            maxWidth: 600,
            position: 'relative',
            padding: 40,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="text-scrim-overlay" />
          <HeroBadge />
          <HeroTitle />
          <HeroDescription />
          <HeroCTA />
          <TrustPills />
          <PlatformMetricsStrip />
        </div>
      </div>
    </article>
  )
}
