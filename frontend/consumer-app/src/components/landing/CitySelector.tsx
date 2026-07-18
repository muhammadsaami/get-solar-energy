interface CitySelectorProps {
  value: string
  onChange: (city: string) => void
  hasError: boolean
}

const CITIES = ['Lucknow', 'Noida', 'Delhi', 'Mumbai', 'Bengaluru', 'Jaipur']

export default function CitySelector({ value, onChange, hasError }: CitySelectorProps) {
  return (
    <div className="form-group">
      <label htmlFor="estCity">Select Your City</label>
      <select
        id="estCity"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select your city for solar estimate"
        aria-invalid={hasError}
      >
        <option value="" disabled>
          Select your city
        </option>
        {CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  )
}
