import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
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
    if (city && debouncedBill) {
      const num = parseFloat(debouncedBill)
      if (!isNaN(num) && num >= 500) {
        runCalculation(false)
      }
    }
  }, [debouncedBill, city, runCalculation])

  const handleCalculate = useCallback(() => {
    let hasError = false

    if (!city) {
      setValidationCity(true)
      hasError = true
    } else {
      setValidationCity(false)
    }

    if (!hasError && (isNaN(billNum) || billNum < 500)) {
      setValidationBill(true)
      hasError = true
    } else {
      setValidationBill(false)
    }

    if (!hasError) {
      runCalculation(true)
    }
  }, [city, billNum, runCalculation])

  return (
    <div className="quick-estimate-card">
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

      {status === 'loading' && <LoadingSkeleton />}

      {status === 'results' && estimate && (
        <div className="estimate-output-container" style={{ display: 'block' }}>
          <EstimateResults
            result={estimate}
            cityLabel={getCityLabel(city)}
            city={city}
            billValue={billNum}
          />
        </div>
      )}
    </div>
  )
}
