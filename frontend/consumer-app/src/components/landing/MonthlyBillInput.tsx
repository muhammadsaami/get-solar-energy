interface MonthlyBillInputProps {
  value: string
  onChange: (bill: string) => void
  hasError: boolean
}

export default function MonthlyBillInput({ value, onChange, hasError }: MonthlyBillInputProps) {
  return (
    <div className="form-group">
      <label htmlFor="estBill">Monthly Electricity Bill</label>
      <div className="input-wrapper">
        <span className="currency-prefix" aria-hidden="true">
          {'\u20B9'}
        </span>
        <input
          type="number"
          id="estBill"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter amount (₹)"
          min={500}
          aria-label="Monthly electricity bill amount in rupees"
          aria-invalid={hasError}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
