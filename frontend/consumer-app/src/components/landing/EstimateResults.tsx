import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter'
import type { EstimateResult } from '../../utils/solar'
import { calculateSubsidy, calculateLifetimeReturn } from '../../utils/solar'
import SubsidyCard from './SubsidyCard'
import InsightCard from './InsightCard'
import { trackCTA } from '../../utils/analytics'

interface EstimateResultsProps {
  result: EstimateResult
  cityLabel: string
  city: string
  billValue: number
}

const CITY_LABELS: Record<string, string> = {
  Lucknow: 'Lucknow, UP',
  Noida: 'Noida, UP',
  Delhi: 'Delhi',
  Mumbai: 'Mumbai, MH',
  Bengaluru: 'Bengaluru, KA',
  Jaipur: 'Jaipur, RP',
}

function getCityLabel(city: string): string {
  return CITY_LABELS[city] || city
}

export default function EstimateResults({
  result,
  cityLabel,
  city,
  billValue,
}: EstimateResultsProps) {
  const shouldReduceMotion = useReducedMotion()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const subsidy = calculateSubsidy(result.recommendedSize)
  const lifetimeReturn = calculateLifetimeReturn(result.annualSavings)
  const label = getCityLabel(city)

  const monthlySavingsDisplay = useAnimatedCounter(result.monthlySavings, {
    prefix: '\u20B9',
    decimals: 0,
    duration: shouldReduceMotion ? 0 : 1000,
    isPrefix: true,
    enabled: revealed,
  })

  const systemSizeDisplay = useAnimatedCounter(result.recommendedSize, {
    suffix: ' kW',
    decimals: 1,
    duration: shouldReduceMotion ? 0 : 800,
    enabled: revealed,
  })

  const annualSavingsDisplay = useAnimatedCounter(result.annualSavings, {
    prefix: '\u20B9',
    decimals: 0,
    duration: shouldReduceMotion ? 0 : 1100,
    isPrefix: true,
    enabled: revealed,
  })

  const paybackDisplay = useAnimatedCounter(result.paybackYears, {
    suffix: ' Yrs',
    decimals: 1,
    duration: shouldReduceMotion ? 0 : 900,
    enabled: revealed,
  })

  const lifetimeDisplay = useAnimatedCounter(lifetimeReturn, {
    prefix: '\u20B9',
    decimals: 0,
    duration: shouldReduceMotion ? 0 : 1200,
    isPrefix: true,
    enabled: revealed,
  })

  const systemPrice = result.systemCost || Math.round(result.recommendedSize * 55000)
  const netOutlay = result.netCost || Math.max(0, systemPrice - subsidy)

  const insightText =
    `A ${result.recommendedSize.toFixed(1)} kW system in ${label} can offset ~90% of your bill. ` +
    `Estimated turnkey pricing is \u20B9${systemPrice.toLocaleString('en-IN')}. After the \u20B9${subsidy.toLocaleString('en-IN')} government subsidy, your net outlay is \u20B9${netOutlay.toLocaleString('en-IN')} with payback in ${result.paybackYears.toFixed(1)} years.`

  return (
    <motion.div
      aria-live="polite"
      role="region"
      aria-label="Solar savings estimate results"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
    >
      <div className="output-divider" />

      <div
        className={`estimate-result-header result-reveal${revealed ? ' is-visible' : ''}`}
      >
        <div className="result-city-badge">
          <span className="result-city-icon" aria-hidden="true">
            {'\u2600'}
          </span>
          <span className="result-city-name">{cityLabel}</span>
        </div>
        <p className="result-personalized-note">
          Based on your {'\u20B9'}
          {Math.round(billValue).toLocaleString('en-IN')} monthly bill
        </p>
      </div>

      <div
        className={`primary-savings-card result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ transitionDelay: '0.08s' }}
      >
        <div className="primary-savings-label">Estimated Monthly Savings</div>
        <div className="primary-savings-value cyan">
          {monthlySavingsDisplay}
        </div>
        <div className="primary-savings-note">
          vs your current electricity bill
        </div>
      </div>

      <div className="result-metrics-grid">
        <div
          className={`result-metric-item result-reveal${revealed ? ' is-visible' : ''}`}
          style={{ transitionDelay: '0.14s' }}
        >
          <span className="metric-label">System Size</span>
          <span className="metric-value">{systemSizeDisplay}</span>
        </div>
        <div
          className={`result-metric-item result-reveal${revealed ? ' is-visible' : ''}`}
          style={{ transitionDelay: '0.18s' }}
        >
          <span className="metric-label">Annual Savings</span>
          <span className="metric-value orange">{annualSavingsDisplay}</span>
        </div>
        <div
          className={`result-metric-item result-reveal${revealed ? ' is-visible' : ''}`}
          style={{ transitionDelay: '0.22s' }}
        >
          <span className="metric-label">Payback Period</span>
          <span className="metric-value">{paybackDisplay}</span>
        </div>
        <div
          className={`result-metric-item result-reveal${revealed ? ' is-visible' : ''}`}
          style={{ transitionDelay: '0.26s' }}
        >
          <span className="metric-label">25-yr Returns</span>
          <span className="metric-value green">{lifetimeDisplay}</span>
        </div>
      </div>

      <div
        className={`card-glass result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ padding: '12px 14px', transitionDelay: '0.30s', margin: 'var(--space-3) 0' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Turnkey System Price:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{systemPrice.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-green)', marginBottom: 4 }}>
          <span>PM Surya Ghar Direct Subsidy:</span>
          <span style={{ fontWeight: 700 }}>- ₹{subsidy.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-orange)', paddingTop: 4, borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <span style={{ fontWeight: 700 }}>Net Capital Outlay:</span>
          <span style={{ fontWeight: 800 }}>₹{netOutlay.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div
        className={`result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ transitionDelay: '0.34s' }}
      >
        <SubsidyCard amount={subsidy} />
      </div>

      <div
        className={`result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ transitionDelay: '0.38s' }}
      >
        <InsightCard text={insightText} />
      </div>

      <motion.a
        href="/signup"
        className="btn-post-estimate-cta result-reveal"
        style={{ transitionDelay: '0.42s' }}
        onClick={() =>
          trackCTA({
            action: 'post_estimate_cta',
            location: 'hero_estimate',
            timestamp: Date.now(),
          })
        }
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        Get Your Full Assessment
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          style={{ width: 16, height: 16, flexShrink: 0 }}
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </motion.a>

      <p className="results-source-text">
        Estimate based on standard solar irradiance &amp; regional DISCOM tariffs.
        Subject to on-site assessment.
      </p>
    </motion.div>
  )
}
