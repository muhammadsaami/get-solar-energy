import { earningsService } from './earnings.service'

export const earningsApi = {
  getEarnings() {
    return earningsService.getEarnings()
  },
}
