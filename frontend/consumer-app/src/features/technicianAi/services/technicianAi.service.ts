import api from '../../../services/api/client'
import type { RawDiagnosisPayload } from '../types/technicianAi.types'

export const technicianAiService = {
  async troubleshoot(
    query: string,
    errorCode?: string,
    equipmentType?: string
  ): Promise<RawDiagnosisPayload> {
    const res = await api.post('/technician/ai/troubleshoot', {
      query,
      error_code: errorCode,
      equipment_type: equipmentType,
    })

    if (res.data && res.data.success && res.data.diagnosis) {
      return res.data.diagnosis
    }

    return {
      error_code: errorCode || 'DIAG-GEN',
      title: 'Field Troubleshooting Guide',
      severity: 'Medium',
      cause: `Field query: '${query}'`,
      steps: [
        '1. Inspect AC disconnect switch and DC string fuses.',
        '2. Verify open-circuit voltage (VOC) using digital multimeter.',
        '3. Inspect array earthing pit connections for low ground resistance.',
      ],
      safety_warning: '⚠️ ALWAYS WEAR CLASS 0 INSULATED GLOVES AND SAFETY GLASSES.',
      suggested_kb_title: 'Standard Solar Inspection Procedures',
      recommended_training_module: 'Level 1: Safety Protocols',
    }
  },
}
