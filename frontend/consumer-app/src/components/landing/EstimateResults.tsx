import { useEffect, useState } from 'react'
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
    duration: 1000,
    isPrefix: true,
    enabled: revealed,
  })

  const systemSizeDisplay = useAnimatedCounter(result.recommendedSize, {
    suffix: ' kW',
    decimals: 1,
    duration: 800,
    enabled: revealed,
  })

  const annualSavingsDisplay = useAnimatedCounter(result.annualSavings, {
    prefix: '\u20B9',
    decimals: 0,
    duration: 1100,
    isPrefix: true,
    enabled: revealed,
  })

  const paybackDisplay = useAnimatedCounter(result.paybackYears, {
    suffix: ' Yrs',
    decimals: 1,
    duration: 900,
    enabled: revealed,
  })

  const lifetimeDisplay = useAnimatedCounter(lifetimeReturn, {
    prefix: '\u20B9',
    decimals: 0,
    duration: 1200,
    isPrefix: true,
    enabled: revealed,
  })

  const insightText =
    `A ${result.recommendedSize.toFixed(1)} kW system in ${label} can offset ~90% of your bill. ` +
    `After the \u20B9${subsidy.toLocaleString('en-IN')} government subsidy, your net payback is under ${result.paybackYears.toFixed(1)} years.`

  return (
    <div aria-live="polite" role="region" aria-label="Solar savings estimate results">
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
        className={`result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ transitionDelay: '0.32s' }}
      >
        <SubsidyCard amount={subsidy} />
      </div>

      <div
        className={`result-reveal${revealed ? ' is-visible' : ''}`}
        style={{ transitionDelay: '0.36s' }}
      >
        <InsightCard text={insightText} />
      </div>

      <a
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
      </a>

      <p className="results-source-text">
        Estimate based on standard solar irradiance &amp; regional DISCOM tariffs.
        Subject to on-site assessment.
      </p>
    </div>
  )
}
