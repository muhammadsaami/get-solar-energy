import type { SuggestedPrompt } from '../types/technicianAi.types'

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'prompt-1',
    title: 'Inverter Error E04 (Overvoltage)',
    errorCode: 'E04',
    prompt: 'Inverter showing Fault E04 - Grid Overvoltage threshold exceeded',
    category: 'Inverter',
  },
  {
    id: 'prompt-2',
    title: 'Low Insulation Riso Fault E01',
    errorCode: 'E01',
    prompt: 'Rooftop array reporting low insulation resistance Riso < 1.0 MΩ',
    category: 'Grounding',
  },
  {
    id: 'prompt-3',
    title: 'DISCOM Net-Meter Frequency Trip',
    errorCode: 'GRID-50HZ',
    prompt: 'Net meter trip due to DISCOM grid frequency fluctuation outside 47.5Hz - 51.5Hz',
    category: 'DISCOM Grid',
  },
  {
    id: 'prompt-4',
    title: 'MC4 Connector Thermal Hotspot',
    errorCode: 'TEMP-85C',
    prompt: 'Thermal imaging camera detected 85°C hotspot on DC string combiner box MC4 junction',
    category: 'String Wiring',
  },
]
