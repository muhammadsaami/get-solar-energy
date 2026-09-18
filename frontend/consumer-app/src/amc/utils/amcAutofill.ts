import type { AMCRecommendationRequest } from '../types/amc.types'
import { readUserStorage, type IdentifiableUser } from '../../utils/userStorage'
import { tokenManager } from '../../services/auth/tokenManager'

interface BillAnalysis {
  customer_name?: string
  city?: string
  system_size_kw?: number
  monthly_generation_units?: number
}

interface RoofAnalysis {
  customer_name?: string
  city?: string
  system_size_kw?: number
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

export function buildAutofillRequest(): Partial<AMCRecommendationRequest> {
  const user = tokenManager.getUser() as IdentifiableUser | null
  const billAnalysis = readUserStorage<BillAnalysis>('lastBillAnalysis', user)
  const roofAnalysis = readUserStorage<RoofAnalysis>('lastRoofAnalysis', user)
  const installData = readUserStorage<InstallData>('lastInstallationData', user)

  let profile: UserProfile | null = null
  try {
    const raw = tokenManager.getUser()
    if (raw && typeof raw === 'object') profile = raw as UserProfile
  } catch {
    /* noop */
  }

  const request: Partial<AMCRecommendationRequest> = {}

  request.customer_name =
    billAnalysis?.customer_name ||
    roofAnalysis?.customer_name ||
    installData?.customer_name ||
    profile?.name ||
    ''

  request.city =
    billAnalysis?.city ||
    roofAnalysis?.city ||
    installData?.city ||
    profile?.city ||
    ''

  const systemKw =
    billAnalysis?.system_size_kw ||
    roofAnalysis?.system_size_kw ||
    installData?.system_size_kw

  if (systemKw && systemKw > 0) {
    request.system_size_kw = systemKw
  }

  if (billAnalysis?.monthly_generation_units) {
    request.current_generation_units = billAnalysis.monthly_generation_units
    request.expected_generation_units = Math.round(billAnalysis.monthly_generation_units * 1.1)
  }

  if (installData?.install_date) {
    request.installation_date = installData.install_date
  }

  request.last_service_date = ''
  request.inverter_error_codes = 'None'
  request.panel_cleaning_done = false
  request.physical_damage_observed = false
  request.damage_details = 'None'

  return request
}
