export { cn } from './cn'
export { trackCTA } from './analytics'
export {
  calculateEstimate,
  calculateLifetimeReturn,
  calculateFallbackROI,
  formatInrCompact,
} from './solar'
export type { EstimateResult, FallbackROIInput, FallbackROIResult } from './solar'
export { loadEstimatePersistence, saveEstimatePersistence } from './persistence'
export {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatNumber,
  formatUnits,
} from './formatters'
export { resolveAvatarUrl } from './avatar'
