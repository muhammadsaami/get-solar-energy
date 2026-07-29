import type { AMCRecommendationRequest } from '../types/amc.types'

interface BillAnalysis {
  customer_name?: string
  city?: string
  system_size_kw?: number
  monthly_generation_units?: number
}

interface RoofAnalysis {
  customer_name?: string
  city?: string
}

interface InstallData {
  customer_name?: string
  city?: string
  system_size_kw?: number
  install_date?: string
}

interface UserProfile {
  name?: string
  email?: string
  city?: string
}

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function buildAutofillRequest(): Partial<AMCRecommendationRequest> {
  const billAnalysis = loadFromLocalStorage<BillAnalysis>('lastBillAnalysis')
  const roofAnalysis = loadFromLocalStorage<RoofAnalysis>('lastRoofAnalysis')
  const installData = loadFromLocalStorage<InstallData>('lastInstallationData')

  let profile: UserProfile | null = null
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('authUser')
    if (raw) profile = JSON.parse(raw) as UserProfile
  } catch {
    /* noop */
  }

  const request: Partial<AMCRecommendationRequest> = {}

  // Priority chain: billAnalysis > roofAnalysis > installData > profile > fallback

  request.customer_name =
    billAnalysis?.customer_name ||
    roofAnalysis?.customer_name ||
    installData?.customer_name ||
    profile?.name ||
    'Rajesh Kumar'

  request.city =
    billAnalysis?.city ||
    roofAnalysis?.city ||
    installData?.city ||
    profile?.city ||
    'Lucknow'

  request.system_size_kw =
    billAnalysis?.system_size_kw ||
    installData?.system_size_kw ||
    5.5

  if (billAnalysis?.monthly_generation_units) {
    request.current_generation_units = billAnalysis.monthly_generation_units
    request.expected_generation_units = Math.round(billAnalysis.monthly_generation_units * 1.1)
  } else {
    request.current_generation_units = 580
    request.expected_generation_units = 675
  }

  request.installation_date = installData?.install_date || '2023-04-10'
  request.last_service_date = ''
  request.inverter_error_codes = 'None'
  request.panel_cleaning_done = true
  request.physical_damage_observed = false
  request.damage_details = 'None'

  return request
}
