const CITY_KEY = 'solar_estimate_city'
const BILL_KEY = 'solar_estimate_bill'

export function loadEstimatePersistence(): { city: string; bill: string } {
  try {
    return {
      city: localStorage.getItem(CITY_KEY) || '',
      bill: localStorage.getItem(BILL_KEY) || '',
    }
  } catch {
    return { city: '', bill: '' }
  }
}

export function saveEstimatePersistence(city: string, bill: string): void {
  try {
    if (city) localStorage.setItem(CITY_KEY, city)
    if (bill) localStorage.setItem(BILL_KEY, bill)
  } catch {
    /* noop */
  }
}
