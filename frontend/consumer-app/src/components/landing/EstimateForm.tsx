import { useCallback } from 'react'
import CitySelector from './CitySelector'
import MonthlyBillInput from './MonthlyBillInput'
import { trackCTA } from '../../utils/analytics'

interface EstimateFormProps {
  city: string
  bill: string
  validationCity: boolean
  validationBill: boolean
  onCityChange: (city: string) => void
  onBillChange: (bill: string) => void
  onCalculate: () => void
}

export default function EstimateForm({
  city,
  bill,
  validationCity,
  validationBill,
  onCityChange,
  onBillChange,
  onCalculate,
}: EstimateFormProps) {
  const handleCalculate = useCallback(() => {
    trackCTA({
      action: 'quick_estimate',
      location: 'hero_card',
      timestamp: Date.now(),
    })
    onCalculate()
  }, [onCalculate])

  return (
    <>
      <CitySelector
        value={city}
        onChange={onCityChange}
        hasError={validationCity}
      />
      {validationCity && (
        <p
          className="form-validation-msg"
          role="alert"
          aria-live="assertive"
        >
          Please select your city first.
        </p>
      )}

      <MonthlyBillInput
        value={bill}
        onChange={onBillChange}
        hasError={validationBill}
      />
      {validationBill && (
        <p
          className="form-validation-msg"
          role="alert"
          aria-live="assertive"
        >
          Please enter a valid bill amount (₹500 or more).
        </p>
      )}

      <button
        type="button"
        className="btn-calculate"
        onClick={handleCalculate}
      >
        Calculate My Savings
      </button>

      <p className="card-footer-note">
        Instant estimate &middot; No sign-up required
      </p>
    </>
  )
}
