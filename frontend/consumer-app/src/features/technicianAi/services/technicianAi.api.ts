import { technicianAiService } from './technicianAi.service'

export const technicianAiApi = {
  troubleshoot(query: string, errorCode?: string, equipmentType?: string) {
    return technicianAiService.troubleshoot(query, errorCode, equipmentType)
  },

  getHistory() {
    return technicianAiService.getHistory()
  },
}
