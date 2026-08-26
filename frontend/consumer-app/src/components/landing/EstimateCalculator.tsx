import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useDebounce } from '../../hooks/useDebounce'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import {
  calculateEstimate,
  type EstimateResult,
} from '../../utils/solar'
import {
  loadEstimatePersistence,
  saveEstimatePersistence,
} from '../../utils/persistence'
import EstimateForm from './EstimateForm'
import LoadingSkeleton from './LoadingSkeleton'
import EstimateResults from './EstimateResults'

type CalcStatus = 'idle' | 'loading' | 'results'

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

export default function EstimateCalculator() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'estimate' })
  const [city, setCity] = useState('')
  const [bill, setBill] = useState('')
  const [validationCity, setValidationCity] = useState(false)
  const [validationBill, setValidationBill] = useState(false)
  const [status, setStatus] = useState<CalcStatus>('idle')
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const calcCount = useRef(0)

  const billNum = useMemo(() => parseFloat(bill), [bill])

  useEffect(() => {
    const saved = loadEstimatePersistence()
    if (saved.city) setCity(saved.city)
    if (saved.bill) setBill(saved.bill)
  }, [])

  const debouncedBill = useDebounce(bill, 400)

  const runCalculation = useCallback((isImmediate: boolean) => {
    const cityVal = document.getElementById('estCity') as HTMLSelectElement | null
    const billVal = document.getElementById('estBill') as HTMLInputElement | null
    const currentCity = cityVal?.value || ''
    const currentBill = parseFloat(billVal?.value || '')

    if (!currentCity || isNaN(currentBill) || currentBill <= 0) return

    saveEstimatePersistence(currentCity, billVal?.value || '')

    const count = ++calcCount.current
    setStatus('loading')

    const delay = isImmediate ? 0 : 300

    setTimeout(() => {
      if (count !== calcCount.current) return

      const result = calculateEstimate(currentCity, currentBill)
      setEstimate(result)
      setStatus('results')
    }, delay)
  }, [])

  const handleCityChange = useCallback(
    (newCity: string) => {
      setCity(newCity)
      setValidationCity(false)
      if (newCity && billNum >= 500) {
        runCalculation(true)
      }
    },
    [billNum, runCalculation],
  )

  const handleBillChange = useCallback((newBill: string) => {
    setBill(newBill)
    setValidationBill(false)
  }, [])

  useEffect(() => {
    if (debouncedBill && city && parseFloat(debouncedBill) >= 500) {
      runCalculation(false)
    }
  }, [debouncedBill, city, runCalculation])

  const handleCalculate = useCallback(() => {
    const cityVal = document.getElementById('estCity') as HTMLSelectElement | null
    const billVal = document.getElementById('estBill') as HTMLInputElement | null
    const currentCity = cityVal?.value || ''
    const currentBill = parseFloat(billVal?.value || '')

    let valid = true
    if (!currentCity) {
      setValidationCity(true)
      valid = false
    }
    if (isNaN(currentBill) || currentBill < 500) {
      setValidationBill(true)
      valid = false
    }

    if (!valid) return
    runCalculation(true)
  }, [runCalculation])

  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-estimate"
      id="sceneEstimate"
      data-camera="estimate"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 2.webp"
          alt="Home solar potential"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-cool" />

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <motion.div
          className="hero-right-col"
          style={{ maxWidth: 500, width: '100%' }}
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="quick-estimate-card"
            style={{
              position: 'relative',
              transform: 'none',
              right: 'auto',
              top: 'auto',
              width: '100%',
              margin: 0,
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="estimate-card-header">
              <h3 className="card-title">Instant Solar Estimate</h3>
              <span className="estimate-powered-text">
                powered by GET Solar
              </span>
            </div>

            <EstimateForm
              city={city}
              bill={bill}
              validationCity={validationCity}
              validationBill={validationBill}
              onCityChange={handleCityChange}
              onBillChange={handleBillChange}
              onCalculate={handleCalculate}
            />

            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoadingSkeleton />
                </motion.div>
              )}

              {status === 'results' && estimate && (
                <motion.div
                  key="results"
                  className="estimate-output-container"
                  style={{ display: 'block' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <EstimateResults
                    result={estimate}
                    cityLabel={getCityLabel(city)}
                    city={city}
                    billValue={billNum}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </article>
  )
}
